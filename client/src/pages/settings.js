import { store } from "../lib/store.js";
import { apiModels, LOCAL_AI } from "../lib/api.js";
import { testGeminiKey, cleanKey, pingGoogle, hasSiteKey, effKey } from "../lib/localAI.js";
import { CLASSES, MEDIUMS, DIFFICULTIES, COUNTS, SUBJECTS_BY_CLASS } from "../data/curriculum.js";
export function renderSettings(el) {
  const s = store.settings();
  el.innerHTML = `<h1>Settings</h1><div class="card">
  <label>AI Provider</label><select id="s-provider"><option>Loading...</option></select>
  <div style="margin-top:10px"><label>AI Model</label><select id="s-model"><option>Loading...</option></select></div>
  <p class=mut>API keys stay on the server. See <a href="/api/health" target="_blank">/api/health</a> for backend status.</p>
  <label>Theme</label><select id="s-theme"><option value="light">Light</option><option value="dark">Dark</option></select>
  <div class="grid g2" style="margin-top:10px">
    <div><label>Default class</label><select id="s-c"><option value="">—</option>${CLASSES.map(c => `<option>${c}</option>`).join("")}</select></div>
    <div><label>Default medium</label><select id="s-m"><option value="">—</option>${MEDIUMS.map(m => `<option>${m}</option>`).join("")}</select></div>
    <div><label>Default difficulty</label><select id="s-d"><option value="">—</option>${DIFFICULTIES.map(x => `<option value="${x.toLowerCase()}">${x}</option>`).join("")}</select></div>
    <div><label>Default count</label><select id="s-n"><option value="">—</option>${COUNTS.map(n => `<option>${n}</option>`).join("")}</select></div>
  </div>
  <div style="margin-top:12px"><button class="btn" id="s-save">Save</button> <span id="s-msg" class=mut></span></div></div>
  <div class="card"><h3>🔑 My AI Key (for published / Pages link)</h3>
  <p class=mut id="s-sitekey-note">Paste your own Gemini key to generate quizzes without any backend — the key stays only in this browser (never uploaded anywhere). Get one free at <b>aistudio.google.com/apikey</b>. Tip: restrict it to your site in Google AI Studio → API controls.</p>
  <label>Gemini API Key</label><input id="s-key" type="password" placeholder="AIza…" autocomplete="off" />
  <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn sec" id="s-test">Test Key</button><button class="btn ghost" id="s-del">Remove</button></div>
  <div id="s-kmsg" class=mut style="margin-top:8px"></div><div id="s-steps" class=mut style="margin-top:6px;font-size:12.5px"></div></div>`;
  const $ = (id) => el.querySelector(id.startsWith("#") ? id : "#" + id);
  const setV = (id, v) => { const n = $(id); if (n) n.value = v; };
  const setH = (id, h) => { const n = $(id); if (n) n.innerHTML = h; };
  const alive = () => el.isConnected;
  setV("s-theme", s.theme || "light");
  const sc = $("s-c"); if (sc) sc.value = s.defaults?.class || "";
  setV("s-m", s.defaults?.medium || ""); setV("s-d", s.defaults?.difficulty || ""); setV("s-n", s.defaults?.count || "");
  const fillLocal = () => {
    setH("s-provider", LOCAL_AI.providers.map(p => `<option>${p}</option>`).join(""));
    setH("s-model", LOCAL_AI.models.map(x => `<option>${x}</option>`).join(""));
  };
  fillLocal(); // instant first paint — never wait on network
  apiModels().then(m => {
    if (!alive()) return;
    m = m || LOCAL_AI;
    const provs = m.providers?.length ? m.providers : ["groq"];
    const byProv = m.modelsByProvider || {};
    const curProv = provs.includes(s.provider) ? s.provider : (m.defaultProvider || provs[0]);
    setH("s-provider", provs.map(p => `<option ${p === curProv ? "selected" : ""}>${p}</option>`).join(""));
    const fill = () => {
      if (!alive()) return;
      const sp = $("s-provider"), sm = $("s-model");
      if (!sp || !sm) return;
      const p = sp.value;
      const list = byProv[p]?.length ? byProv[p] : (m.models || []);
      const def = p === curProv ? (s.model || m.defaultModel || list[0]) : list[0];
      sm.innerHTML = list.map(x => `<option ${x === def ? "selected" : ""}>${x}</option>`).join("");
    };
    const sp = $("s-provider");
    if (sp) sp.onchange = fill;
    fill();
  }).catch(() => {
    if (!alive()) return;
    const m = LOCAL_AI;
    setH("s-provider", m.providers.map(p => `<option>${p}</option>`).join(""));
    setH("s-model", m.models.map(x => `<option>${x}</option>`).join(""));
  });
  const saveBtn = $("s-save");
  if (saveBtn) saveBtn.onclick = () => {
    const gv = (id) => { const n = $(id); return n ? n.value : ""; };
    store.saveSettings({ provider: gv("s-provider"), model: gv("s-model"), theme: gv("s-theme"), defaults: { class: gv("s-c"), medium: gv("s-m"), difficulty: gv("s-d"), count: gv("s-n") } });
    const k = gv("s-key").trim();
    if (k) store.saveKeys({ gemini: k });
    document.body.classList.toggle("dark", gv("s-theme") === "dark");
    const sm = $("s-msg");
    if (sm) sm.textContent = "Saved.";
  };
  const keys = store.keys();
  const sk = $("s-key");
  if (hasSiteKey()) {
    const note = $("s-sitekey-note");
    if (note) note.innerHTML = `This published site has a <b>built-in key ✓</b> — generation works with nothing to paste. You may still add a personal key below to override it (kept only in this browser).`;
    if (sk) sk.placeholder = "Site key active ✓ (paste personal key to override)";
  } else if (keys.gemini && sk) sk.placeholder = "Key saved ✓ (paste new to replace)";
  const testBtn = $("s-test");
  if (testBtn) testBtn.onclick = async () => {
    const btn = $("s-test");
    if (!btn) return;
    btn.disabled = true;
    const steps = (t) => { const d = $("s-steps"); if (d) d.innerHTML += `<div>• ${t}</div>`; };
    const km = $("s-kmsg");
    const say = (t) => { if (km) km.textContent = t; };
    const stepsBox = $("s-steps");
    if (stepsBox) stepsBox.innerHTML = "";
    const skIn = $("s-key");
    const raw = skIn ? skIn.value : "";
    const typed = raw.trim();
    const k = effKey(typed || store.keys().gemini);
    steps("1. Button works — starting test…");
    await new Promise(r => setTimeout(r, 50));
    try {
      await pingGoogle((s) => steps(s));
    } catch (e) {
      say("✗ " + e.message);
      steps("STOPPED: network path blocked — key cannot be tested until this passes.");
      btn.disabled = false;
      return;
    }
    steps(`2. Key seen: ${k ? `yes (${cleanKey(k).length} chars)` : "NO — empty box and none saved"}`);
    say("Checking...");
    try {
      steps("3. Contacting Google…");
      await testGeminiKey(k, (s) => steps(s));
      if (typed) store.saveKeys({ gemini: cleanKey(typed) });
      say("✓ Key works and is saved.");
      steps("4. Done — success.");
    }
    catch (e) {
      if (km) km.innerHTML = `✗ ${e.message} <button class="btn ghost" id="s-dbg" style="padding:4px 10px;font-size:12px">Copy debug</button>`;
      steps("4. Failed: " + e.message);
      const d = $("s-dbg");
      if (d) d.onclick = async () => {
        const sb = $("s-steps");
        const info = `Gemini key test failed\nTime: ${new Date().toISOString()}\nPage: ${location.href}\nSteps:\n${sb ? sb.innerText : "n/a"}\nError: ${e.message}\nDebug: ${e.debug || "n/a"}\nUA: ${navigator.userAgent}`;
        try { await navigator.clipboard.writeText(info); d.textContent = "✓ Copied — send this"; }
        catch { prompt("Copy the debug info:", info); }
      };
    }
    finally { btn.disabled = false; }
  };
  const delBtn = $("s-del");
  if (delBtn) delBtn.onclick = () => { store.saveKeys({ gemini: "" }); setV("s-key", ""); const sk2 = $("s-key"); if (sk2) sk2.placeholder = "AIza…"; const km2 = $("s-kmsg"); if (km2) km2.textContent = "Removed."; };
}
