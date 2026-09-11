import { store } from "../lib/store.js";
export function renderPerformance(el) {
  const rs = store.results();
  const tot = rs.reduce((a, r) => a + r.total, 0), cor = rs.reduce((a, r) => a + r.correct, 0);
  const acc = tot ? Math.round(cor / tot * 100) : 0;
  el.innerHTML = `<h1>Performance</h1>
  <div class="grid g4">
    <div class="card"><div class=mut>Answered</div><div class=stat>${tot}</div></div>
    <div class="card"><div class=mut>Correct</div><div class=stat>${cor}</div></div>
    <div class="card"><div class=mut>Accuracy</div><div class=stat>${acc}%</div></div>
    <div class="card"><div class=mut>Sessions</div><div class=stat>${rs.length}</div></div>
  </div>
  <div class="card"><h3>History</h3>${rs.map(r => `<p><b>${r.title}</b> — ${r.correct}/${r.total} (${r.accuracy}%) · revealed ${r.revealed} · ${new Date(r.at).toLocaleString()}</p>`).join("") || "<p class=mut>No attempts yet.</p>"}</div>`;
}
