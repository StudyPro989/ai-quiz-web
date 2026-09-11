import { CLASSES, MEDIUMS, DIFFICULTIES, COUNTS, QUESTION_TYPES, SUBJECTS_BY_CLASS, SUB_SUBJECTS, chaptersFor } from "../data/curriculum.js";
import { apiGenerate, apiModels, apiHealth, LOCAL_AI } from "../lib/api.js";
import { generateQuizDirect } from "../lib/localAI.js";
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
  <div style="margin-top:14px"><button class="btn" id="f-go">🚀 Generate Quiz</button> <span id="f-msg" class="mut"></span></div></div></div></div>
  <div id="f-err"></div>`;

  const $ = (id) => el.querySelector(id);
  apiHealth().then(h => { if (!h || h.ok !== true) throw 0; backendUp = true; paintConn(); }).catch(() => paintConn());
  const selTypes = new Set();
  el.querySelectorAll(".chip").forEach(ch => ch.onclick = () => { const t = ch.dataset.t; selTypes.has(t) ? selTypes.delete(t) : selTypes.add(t); ch.classList.toggle("on"); });
  const syncSub = () => {
    const c = $("#f-class").value;
    $("#f-sub").innerHTML = `<option value="">Select</option>` + (SUBJECTS_BY_CLASS[c] || []).map(x => `<option>${x}</option>`).join("");
    syncBranch();
  };
  const syncBranch = () => {
    const sb = $("#f-sub").value;
    const branches = SUB_SUBJECTS[sb] || [];
    $("#f-branch-wrap").style.display = branches.length ? "block" : "none";
    $("#f-branch").innerHTML = branches.map(x => `<option>${x}</option>`).join("");
    syncCh();
  };
  const syncCh = () => {
    const c = $("#f-class").value, sb = $("#f-sub").value;
    const br = (SUB_SUBJECTS[sb] || []).length ? $("#f-branch").value : "";
    $("#f-ch").innerHTML = chaptersFor(c, sb, br).map(x => `<option>${x}</option>`).join("");
  };
  $("#f-class").onchange = syncSub; $("#f-sub").onchange = syncBranch; $("#f-branch").onchange = syncCh;
  if (d.class) { $("#f-class").value = d.class; syncSub(); if (d.subject) { $("#f-sub").value = d.subject; syncCh(); } }
  else { syncSub(); }
  let backendUp = false;
  apiModels().then(m => {
    backendUp = true;
    const provs = m.providers?.length ? m.providers : ["groq"];
    const byProv = m.modelsByProvider || {};
    const preProv = ctx?.prefill?.provider;
    const curProv = provs.includes(preProv) ? preProv : (provs.includes(s.provider) ? s.provider : (m.defaultProvider || provs[0]));
    $("#f-provider").innerHTML = provs.map(p => `<option ${p === curProv ? "selected" : ""}>${p}</option>`).join("");
    const fill = () => {
      const p = $("#f-provider").value;
      const list = byProv[p]?.length ? byProv[p] : (m.models || []);
      const isCur = p === curProv;
      const def = isCur ? ((p === s.provider ? s.model : null) || m.defaultModel || list[0]) : list[0];
      $("#f-model").innerHTML = list.map(x => `<option ${x === def ? "selected" : ""}>${x}</option>`).join("");
    };
    $("#f-provider").onchange = fill; fill();
    paintConn();
  }).catch(() => {
    const m = LOCAL_AI;
    $("#f-provider").innerHTML = m.providers.map(p => `<option>${p}</option>`).join("");
    const list = m.modelsByProvider.gemini;
    $("#f-model").innerHTML = list.map(x => `<option>${x}</option>`).join("");
    paintConn();
  });
  function paintConn() {
    const hasKey = !!store.keys().gemini;
    if (backendUp || hasKey) {
      $("#f-conn").innerHTML = backendUp ? "" : `<div class="card" style="border:1.5px solid #a7e3c0;background:#f0fdf4"><b>🔑 Backend-free mode.</b><p class=mut style="margin:6px 0 0">No server found — generating with your saved browser key (Gemini, direct). Everything stays on this page.</p></div>`;
      return;
    }
    $("#f-conn").innerHTML = "";
  }

  let busy = false;
  $("#f-go").onclick = async () => {
    if (busy) return;
    const branch = (SUB_SUBJECTS[$("#f-sub").value] || []).length ? $("#f-branch").value : "";
    const ch = $("#f-custom").value.trim() || (branch ? `${branch}: ${$("#f-ch").value}` : $("#f-ch").value);
    const payload = { class: $("#f-class").value, subject: $("#f-sub").value, subSubject: branch, medium: $("#f-med").value, topic: ch, questionTypes: [...selTypes], difficulty: $("#f-diff").value, questionCount: Number($("#f-count").value), provider: $("#f-provider").value, model: $("#f-model").value };
    if (!payload.class || !payload.subject || !payload.topic) { $("#f-msg").textContent = "Please select class, subject and topic."; return; }
    if (!payload.questionTypes.length) { $("#f-msg").textContent = "Select at least one question type."; return; }
    busy = true;
    const btn = $("#f-go"); btn.disabled = true;
    let li = 0;
    const target = `Class ${payload.class} · ${payload.subject}${payload.subSubject ? " (" + payload.subSubject + ")" : ""} · ${payload.topic} · ${payload.questionCount} Qs · ${backendUp ? payload.provider + "/" + payload.model : "direct/browser-key"}`;
    $("#f-msg").textContent = `Generating for ${target}...`;
    const iv = setInterval(() => { li = (li + 1) % LOADS.length; $("#f-msg").textContent = `${LOADS[li]} (${target})`; }, 1600);
    btn.innerHTML = `<span class="spin"></span> Generating...`;
    const doneBtn = () => { busy = false; btn.disabled = false; btn.textContent = "🚀 Generate Quiz"; };
    try {
      let quiz;
      if (backendUp) {
        const j = await apiGenerate(payload);
        clearInterval(iv);
        quiz = { ...j.quiz, id: uid(), config: payload };
      } else {
        const key = store.keys().gemini;
        if (!key) { clearInterval(iv); showNoKey(target); doneBtn(); return; }
        const model = payload.provider === "gemini" ? payload.model : "gemini-2.5-flash";
        const q = await generateQuizDirect({ ...payload, provider: "gemini" }, key, model);
        clearInterval(iv);
        quiz = { ...q, id: uid(), config: { ...payload, provider: "gemini", model } };
      }
      store.saveQuiz(quiz);
      location.hash = `#/quiz/${quiz.id}`;
    } catch (e) {
      clearInterval(iv);
      showGenError(target, payload, e);
      doneBtn();
    }
  };
  function showNoKey(target) {
    $("#f-err").innerHTML = `<div class="card" style="border:1.5px solid #facc15;background:#fffbeb"><h3>🔑 Add your Gemini key to generate here</h3>
      <p><b>Tried:</b> ${target}</p>
      <p class=mut>This published link has no backend, so it generates straight from your browser. Paste a free key once in Settings (kept only on this device) and generate again.</p>
      <div style="margin-top:10px"><a class="btn" href="#/settings">Open Settings → add key</a></div></div>`;
    $("#f-err").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function showGenError(target, payload, e) {
    const at = new Date().toLocaleString();
    const ref = e.requestId ? ` · Ref: ${e.requestId}` : "";
    const tech = `Time: ${at}\nTried: ${target}\nTypes: ${(payload.questionTypes || []).join(", ")}\nDifficulty: ${payload.difficulty}\nModel: ${payload.model || "server default"}\nError: ${e.message}${e.status ? ` (HTTP ${e.status})` : ""}${e.requestId ? `\nRef: ${e.requestId}` : ""}`;
    $("#f-err").innerHTML = `<div class="card" style="border:1.5px solid #f3b8b8"><h3>⚠️ Quiz generation failed</h3>
      <p><b>Tried:</b> ${target}</p>
      <div class="fb bad"><b>Bug:</b> ${e.message || "Unknown error"}<p class=mut style="margin:6px 0 0">${at}${ref}</p></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="f-retry">↻ Try Again</button><button class="btn sec" id="f-copy">📋 Copy bug details</button></div>
      <details style="margin-top:10px"><summary class=mut>Technical details</summary><pre class=mut style="white-space:pre-wrap">${tech}</pre></details></div>`;
    el.querySelector("#f-retry").onclick = () => { $("#f-err").innerHTML = ""; $("#f-go").click(); };
    el.querySelector("#f-copy").onclick = async () => {
      try { await navigator.clipboard.writeText(`Quiz generation bug report\n${tech}`); el.querySelector("#f-copy").textContent = "✓ Copied"; }
      catch { prompt("Copy the bug details:", tech); }
    };
    $("#f-err").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (ctx?.prefill) {
    const p = ctx.prefill;
    $("#f-class").value = p.class; syncSub(); $("#f-sub").value = p.subject; syncBranch();
    if (p.subSubject && SUB_SUBJECTS[p.subject]?.includes(p.subSubject)) { $("#f-branch").value = p.subSubject; syncCh(); }
    $("#f-med").value = p.medium; $("#f-diff").value = p.difficulty; $("#f-count").value = String(p.questionCount);
    if (!COUNTS.includes(Number(p.questionCount))) $("#f-count").innerHTML += `<option selected>${p.questionCount}</option>`;
    (p.questionTypes || []).forEach(t => el.querySelector(`[data-t="${t}"]`)?.click());
    if (p.topic) $("#f-custom").value = p.topic;
  }
}
