import { store } from "../lib/store.js";
import { apiModels } from "../lib/api.js";
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
  <div style="margin-top:12px"><button class="btn" id="s-save">Save</button> <span id="s-msg" class=mut></span></div></div>`;
  const $ = (id) => el.querySelector(id);
  $("s-theme").value = s.theme || "light";
  Object.assign($("s-c"), { value: s.defaults?.class || "" });
  $("s-m").value = s.defaults?.medium || ""; $("s-d").value = s.defaults?.difficulty || ""; $("s-n").value = s.defaults?.count || "";
  apiModels().then(m => {
    const provs = m.providers?.length ? m.providers : ["groq"];
    const byProv = m.modelsByProvider || {};
    const curProv = provs.includes(s.provider) ? s.provider : (m.defaultProvider || provs[0]);
    $("s-provider").innerHTML = provs.map(p => `<option ${p === curProv ? "selected" : ""}>${p}</option>`).join("");
    const fill = () => {
      const p = $("s-provider").value;
      const list = byProv[p]?.length ? byProv[p] : (m.models || []);
      const def = p === curProv ? (s.model || m.defaultModel || list[0]) : list[0];
      $("s-model").innerHTML = list.map(x => `<option ${x === def ? "selected" : ""}>${x}</option>`).join("");
    };
    $("s-provider").onchange = fill; fill();
  });
  $("s-save").onclick = () => {
    store.saveSettings({ provider: $("s-provider").value, model: $("s-model").value, theme: $("s-theme").value, defaults: { class: $("s-c").value, medium: $("s-m").value, difficulty: $("s-d").value, count: $("s-n").value } });
    document.body.classList.toggle("dark", $("s-theme").value === "dark");
    $("s-msg").textContent = "Saved.";
  };
}
