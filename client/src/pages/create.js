import { CLASSES, MEDIUMS, DIFFICULTIES, COUNTS, QUESTION_TYPES, SUBJECTS_BY_CLASS, SUB_SUBJECTS, chaptersFor } from "../data/curriculum.js";
import { apiGenerate, apiModels, apiHealth, LOCAL_AI } from "../lib/api.js";
import { generateQuizDirect, effKey, offlineOptions, offlineKeyFor, offlineModelFor } from "../lib/localAI.js";
import { store, uid } from "../lib/store.js";

const LOADS = ["Preparing your quiz...", "Generating questions...", "Preparing answers...", "Checking generated questions...", "Almost ready..."];

export function renderCreate(el, ctx) {
  const s = store.settings();
  const d = s.defaults || {};
  el.innerHTML = `<h1>Create Quiz ✨</h1>
  <div id="f-conn"></div>
  <div class="card"><div class="step"><div class="step-n">1</div><div style="flex:1"><h3>Class, Subject & Topic</h3><div class="grid g2">
    <div><label>Class</label><select id="f-class"><option value="">Select</option>${CLASSES.map(c => `<option ${d.class === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
    <div><label>Subject</label><select id="f-sub"><option value="">Select class first</option></select></div>
    <div><label>Medium</label><select id="f-med">${MEDIUMS.map(m => `<option ${d.medium === m ? "selected" : ""}>${m}</option>`).join("")}</select></div>
    <div><label>Chapter / Topic</label><select id="f-ch"></select></div>
  </div>
  <div id="f-branch-wrap" style="display:none;margin-top:10px"><label>Branch</label><select id="f-branch"></select></div>
  <div style="margin-top:10px"><label>Or Custom Topic</label><input id="f-custom" placeholder="Enter topic..." /></div></div></div></div>
  <div class="card"><div class="step"><div class="step-n">2</div><div style="flex:1"><h3>Question Types</h3><p class=mut>Select one or more — the AI mixes them.</p><div class="chips" id="f-types">${QUESTION_TYPES.map(t => `<span class="chip" data-t="${t.id}">${t.label}</span>`).join("")}</div></div></div></div>
  <div class="card"><div class="step"><div class="step-n">3</div><div style="flex:1"><h3>Difficulty & Length</h3><div class="grid g2">
    <div><label>Difficulty</label><select id="f-diff">${DIFFICULTIES.map(x => `<option value="${x.toLowerCase()}" ${d.difficulty === x.toLowerCase() ? "selected" : ""}>${x}</option>`).join("")}</select></div>
    <div><label>Number of Questions</label><select id="f-count">${COUNTS.map(n => `<option ${Number(d.count) === n ? "selected" : ""}>${n}</option>`).join("")}</select></div>
  </div>
  <div class="grid g2" style="margin-top:10px">
    <div><label>AI Provider</label><select id="f-provider"><option>Loading...</option></select></div>
    <div><label>AI Model</label><select id="f-model"><option>Loading...</option></select></div>
  </div>
  <div style="margin-top:14px"><button class="btn" id="f-go">🚀 Generate Quiz</button> <span id="f-msg" class="mut"></span></div>
  <div id="f-progwrap" style="display:none;margin-top:10px"><div class="prog"><i id="f-bar" style="width:0%"></i></div><div class="mut" id="f-pct" style="margin-top:4px">0%</div></div></div></div></div>
  <div id="f-err"></div>`;

  const $ = (id) => el.querySelector(id.startsWith("#") ? id : "#" + id);
  const alive = () => el.isConnected;
  const setH = (id, h) => { const n = $(id); if (n) n.innerHTML = h; };
  const setV = (id, v) => { const n = $(id); if (n) n.value = v; };
  const getV = (id) => { const n = $(id); return n ? n.value : ""; };
  const selTypes = new Set();
  el.querySelectorAll(".chip").forEach(ch => ch.onclick = () => { const t = ch.dataset.t; selTypes.has(t) ? selTypes.delete(t) : selTypes.add(t); ch.classList.toggle("on"); });
  const syncSub = () => {
    const c = getV("f-class");
    setH("f-sub", `<option value="">Select</option>` + (SUBJECTS_BY_CLASS[c] || []).map(x => `<option>${x}</option>`).join(""));
    syncBranch();
  };
  const syncBranch = () => {
    const sb = getV("f-sub");
    const branches = SUB_SUBJECTS[sb] || [];
    const w = $("f-branch-wrap");
    if (w) w.style.display = branches.length ? "block" : "none";
    setH("f-branch", branches.map(x => `<option>${x}</option>`).join(""));
    syncCh();
  };
  const syncCh = () => {
    const c = getV("f-class"), sb = getV("f-sub");
    const br = (SUB_SUBJECTS[sb] || []).length ? getV("f-branch") : "";
    setH("f-ch", chaptersFor(c, sb, br).map(x => `<option>${x}</option>`).join(""));
  };
  const fc = $("f-class"), fs = $("f-sub"), fb = $("f-branch");
  if (fc) fc.onchange = syncSub; if (fs) fs.onchange = syncBranch; if (fb) fb.onchange = syncCh;
  if (d.class) { setV("f-class", d.class); syncSub(); if (d.subject) { setV("f-sub", d.subject); syncCh(); } }
  else { syncSub(); }
  let backendUp = false;
  const paintOfflineLists = () => {
    const o = offlineOptions();
    if (!o.providers.length) {
      setH("f-provider", `<option value="">Add key in Settings…</option>`);
      setH("f-model", `<option value="">—</option>`);
      return;
    }
    setH("f-provider", o.providers.map(p => `<option>${p}</option>`).join(""));
    const syncM = () => {
      const p = getV("f-provider") || o.providers[0];
      setH("f-model", (o.modelsByProvider[p] || []).map(x => `<option>${x}</option>`).join(""));
    };
    const fp = $("f-provider");
    if (fp) fp.onchange = syncM;
    syncM();
  };
  const fillLocal = paintOfflineLists; // instant first paint — never wait on network
  fillLocal();
  paintConn();
  apiModels().then(m => {
    if (!alive()) return;
    if (!m) { paintConn(); return; } // no backend — offline options already painted
    backendUp = true;
    const provs = m.providers?.length ? m.providers : ["groq"];
    const byProv = m.modelsByProvider || {};
    const preProv = ctx?.prefill?.provider;
    const curProv = provs.includes(preProv) ? preProv : (provs.includes(s.provider) ? s.provider : (m.defaultProvider || provs[0]));
    setH("f-provider", provs.map(p => `<option ${p === curProv ? "selected" : ""}>${p}</option>`).join(""));
    const fill = () => {
      if (!alive()) return;
      const p = getV("f-provider");
      const list = byProv[p]?.length ? byProv[p] : (m.models || []);
      const isCur = p === curProv;
      const def = isCur ? ((p === s.provider ? s.model : null) || m.defaultModel || list[0]) : list[0];
      setH("f-model", list.map(x => `<option ${x === def ? "selected" : ""}>${x}</option>`).join(""));
    };
    const fp = $("f-provider");
    if (fp) fp.onchange = fill;
    fill();
    paintConn();
  }).catch(() => {
    if (!alive()) return;
    paintOfflineLists();
    paintConn();
  });
  function paintConn() {
    const o = offlineOptions();
    const hasKey = o.providers.length > 0;
    if (backendUp || hasKey) {
      $("#f-conn").innerHTML = backendUp ? "" : `<div class="card" style="border:1.5px solid #a7e3c0;background:#f0fdf4"><b>🔑 Backend-free mode.</b><p class=mut style="margin:6px 0 0">No server found — generating with your saved browser key, direct. Everything stays on this page.</p></div>`;
      return;
    }
    $("#f-conn").innerHTML = "";
  }

  let busy = false;
  const goBtn = $("f-go");
  if (goBtn) goBtn.onclick = async () => {
    if (busy) return;
    const sub = getV("f-sub");
    const branch = (SUB_SUBJECTS[sub] || []).length ? getV("f-branch") : "";
    const custom = getV("f-custom").trim();
    const ch = custom || (branch ? `${branch}: ${getV("f-ch")}` : getV("f-ch"));
    const payload = { class: getV("f-class"), subject: sub, subSubject: branch, medium: getV("f-med"), topic: ch, questionTypes: [...selTypes], difficulty: getV("f-diff"), questionCount: Number(getV("f-count")), provider: getV("f-provider"), model: getV("f-model") };
    const msg = $("f-msg");
    if (!payload.class || !payload.subject || !payload.topic) { if (msg) msg.textContent = "Please select class, subject and topic."; return; }
    if (!payload.questionTypes.length) { if (msg) msg.textContent = "Select at least one question type."; return; }
    busy = true;
    const btn = $("f-go"); if (btn) btn.disabled = true;
    let li = 0, tick = 0;
    const t0 = Date.now();
    let waitUntil = 0, waitWhy = "";
    const target = `Class ${payload.class} · ${payload.subject}${payload.subSubject ? " (" + payload.subSubject + ")" : ""} · ${payload.topic} · ${payload.questionCount} Qs · ${backendUp ? payload.provider + "/" + payload.model : "direct/browser-key"}`;
    const renderMsg = () => {
      if (!alive() || !msg) return;
      const s = Math.floor((Date.now() - t0) / 1000);
      if (Date.now() < waitUntil) {
        const left = Math.ceil((waitUntil - Date.now()) / 1000);
        msg.textContent = `⏳ ${waitWhy === "rate" ? "Rate limited — cooling down" : "Retrying"}… ${left}s (${target}) · ${s}s elapsed`;
      } else {
        msg.textContent = `${LOADS[li]} (${target}) · ${s}s`;
      }
    };
    renderMsg();
    const wrap = $("f-progwrap"), bar = $("f-bar"), pct = $("f-pct");
    const setPct = (p, label) => {
      if (!alive()) return;
      if (wrap) wrap.style.display = "block";
      if (bar) bar.style.width = Math.max(0, Math.min(100, p)) + "%";
      if (pct) pct.textContent = `${Math.round(p)}%${label ? " · " + label : ""}`;
    };
    const hideBar = () => { if (wrap) wrap.style.display = "none"; };
    setPct(2, "starting…");
    let lastPct = 2, tries = 0;
    const iv = setInterval(() => { tick++; if (tick % 2 === 0) li = (li + 1) % LOADS.length; renderMsg(); }, 1000);
    let creep = 0;
    const ivCreep = setInterval(() => {
      if (!backendUp) return;
      creep = Math.min(90, creep + 3);
      setPct(creep, "AI working…");
    }, 1500);
    const stopIv = () => { clearInterval(iv); clearInterval(ivCreep); };
    if (btn) btn.innerHTML = `<span class="spin"></span> Generating...`;
    const doneBtn = () => { busy = false; if (btn) { btn.disabled = false; btn.textContent = "🚀 Generate Quiz"; } };
    const onEvent = (e) => {
      if (!e) return;
      if (e.t === "wait") { waitUntil = Date.now() + e.ms; waitWhy = e.why || ""; renderMsg(); }
      if (e.t === "attempt") tries++;
      if (e.t === "progress" && e.total) {
        const p = Math.max(lastPct, (e.done / e.total) * 100);
        lastPct = p;
        setPct(p, `part ${Math.floor(e.done)}/${e.total}${tries ? ` · try ${tries + 1}` : ""}`);
      }
    };
    try {
      let quiz;
      if (backendUp) {
        const j = await apiGenerate(payload);
        stopIv();
        quiz = { ...j.quiz, id: uid(), config: payload };
      } else {
        const prov = payload.provider === "groq" ? "groq" : "gemini";
        const key = offlineKeyFor(prov);
        if (!key) { stopIv(); hideBar(); showNoKey(target); doneBtn(); return; }
        const model = offlineModelFor(prov, payload.model);
        const q = await generateQuizDirect({ ...payload, provider: prov }, key, model, prov, onEvent);
        stopIv();
        quiz = { ...q, id: uid(), config: { ...payload, provider: prov, model } };
      }
      store.saveQuiz(quiz);
      location.hash = `#/quiz/${quiz.id}`;
    } catch (e) {
      stopIv();
      hideBar();
      showGenError(target, payload, e);
      doneBtn();
    }
  };
  function showNoKey(target) {
    setH("f-err", `<div class="card" style="border:1.5px solid #facc15;background:#fffbeb"><h3>🔑 Add an AI key to generate here</h3>
      <p><b>Tried:</b> ${target}</p>
      <p class=mut>This published link has no backend, so it generates straight from your browser. Paste a free key once in Settings (kept only on this device) and generate again.</p>
      <div style="margin-top:10px"><a class="btn" href="#/settings">Open Settings → add key</a></div></div>`);
    const fe = $("f-err");
    if (fe && fe.scrollIntoView) fe.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function showGenError(target, payload, e) {
    const at = new Date().toLocaleString();
    const ref = e.requestId ? ` · Ref: ${e.requestId}` : "";
    const isRate = /rate limit/i.test(e.message || "");
    const tech = `Time: ${at}\nTried: ${target}\nTypes: ${(payload.questionTypes || []).join(", ")}\nDifficulty: ${payload.difficulty}\nModel: ${payload.model || "server default"}\nError: ${e.message}${e.status ? ` (HTTP ${e.status})` : ""}${e.requestId ? `\nRef: ${e.requestId}` : ""}`;
    setH("f-err", `<div class="card" style="border:1.5px solid #f3b8b8"><h3>⚠️ Quiz generation failed</h3>
      <p><b>Tried:</b> ${target}</p>
      <div class="fb bad"><b>Bug:</b> ${e.message || "Unknown error"}${isRate ? `<p class=mut style="margin:6px 0 0">Rate limits reset every minute — retrying after a short wait usually works.</p>` : ""}<p class=mut style="margin:6px 0 0">${at}${ref}</p></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="f-retry">↻ Try Again</button><button class="btn sec" id="f-wait">⏳ Retry in 60s</button><button class="btn ghost" id="f-copy">📋 Copy bug details</button></div>
      <details style="margin-top:10px"><summary class=mut>Technical details</summary><pre class=mut style="white-space:pre-wrap">${tech}</pre></details></div>`);
    const rt = el.querySelector("#f-retry"), cp = el.querySelector("#f-copy"), go2 = $("f-go"), wt = el.querySelector("#f-wait");
    if (rt) rt.onclick = () => { setH("f-err", ""); if (go2) go2.click(); };
    if (wt) wt.onclick = () => {
      wt.disabled = true;
      let left = 60;
      wt.textContent = `⏳ Retrying in ${left}s… (tap Try Again to go now)`;
      const iv2 = setInterval(() => {
        left--;
        if (left <= 0) { clearInterval(iv2); setH("f-err", ""); if (go2) go2.click(); }
        else if (wt.isConnected) wt.textContent = `⏳ Retrying in ${left}s… (tap Try Again to go now)`;
        else clearInterval(iv2);
      }, 1000);
    };
    if (cp) cp.onclick = async () => {
      try { await navigator.clipboard.writeText(`Quiz generation bug report\n${tech}`); cp.textContent = "✓ Copied"; }
      catch { prompt("Copy the bug details:", tech); }
    };
    const fe2 = $("f-err");
    if (fe2 && fe2.scrollIntoView) fe2.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (ctx?.prefill) {
    const p = ctx.prefill;
    setV("f-class", p.class); syncSub(); setV("f-sub", p.subject); syncBranch();
    if (p.subSubject && SUB_SUBJECTS[p.subject]?.includes(p.subSubject)) { setV("f-branch", p.subSubject); syncCh(); }
    setV("f-med", p.medium); setV("f-diff", p.difficulty); setV("f-count", String(p.questionCount));
    if (!COUNTS.includes(Number(p.questionCount))) { const fco = $("f-count"); if (fco) fco.innerHTML += `<option selected>${p.questionCount}</option>`; }
    (p.questionTypes || []).forEach(t => el.querySelector(`[data-t="${t}"]`)?.click());
    if (p.topic) setV("f-custom", p.topic);
  }
}
