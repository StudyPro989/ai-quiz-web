import { store } from "../lib/store.js";
export function renderDashboard(el) {
  const qs = store.quizzes(), rs = store.results();
  const done = rs.length;
  const acc = rs.length ? Math.round(rs.reduce((a, r) => a + r.accuracy, 0) / rs.length) : 0;
  const best = rs.length ? Math.max(...rs.map(r => r.accuracy)) : 0;
  const weak = {};
  rs.forEach(r => (r.wrongTopics || []).forEach(t => weak[t] = (weak[t] || 0) + 1));
  const need = Object.entries(weak).sort((a, b) => b[1] - a[1]).slice(0, 5);
  el.innerHTML = `<div class="hero"><h1>Your Learning 📚</h1><p>Practice at your own pace — reveal answers, learn explanations, track revision topics.</p><div><a class="btn" style="background:#fff;color:#5b21b6" href="#/create">+ Create Quiz</a></div></div>
  <div class="grid g3">
    <div class="card stat-card"><div class="ico">📝</div><div class="mut">Quizzes Created</div><div class="stat">${qs.length}</div></div>
    <div class="card stat-card"><div class="ico">✅</div><div class="mut">Quizzes Completed</div><div class="stat">${done}</div></div>
    <div class="card stat-card"><div class="ico">🎯</div><div class="mut">Average Accuracy</div><div class="stat">${acc}%</div></div>
  </div>
  <div class="grid g2">
    <div class="card"><h3>🔥 Needs Revision</h3>${need.length ? "<ul>" + need.map(([t, c]) => `<li>${t} (${c})</li>`).join("") + "</ul>" : "<div class=empty><div class=big>🌱</div>No data yet — complete a quiz.</div>"}<p class=mut>Best score: ${best}%</p></div>
    <div class="card"><h3>🕘 Recent quizzes</h3>${qs.slice(0, 5).map(q => `<p><a href="#/quiz/${q.id}">${q.title}</a><br><span class=mut>${q.topic} · ${q.questions.length} Qs</span></p>`).join("") || "<div class=empty><div class=big>📭</div>None yet.</div>"}</div>
  </div>`;
}
