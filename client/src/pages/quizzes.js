import { store } from "../lib/store.js";
export function renderQuizzes(el) {
  const qs = store.quizzes();
  el.innerHTML = `<h1>My Quizzes 📚</h1>` + (qs.length ? qs.map(q => `<div class="card"><b>${q.title}</b><br><span class=mut>Class ${q.class} · ${q.subject} · ${q.medium} · ${q.topic} · ${q.questions.length} Qs · ${new Date(q.createdAt).toLocaleString()}${q.demo ? " · demo" : ""}</span><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#/quiz/${q.id}">Open</a><button class="btn sec" data-sim="${q.id}">Generate Similar</button><button class="btn ghost" data-del="${q.id}">Delete</button></div></div>`).join("") : `<div class="card"><div class=empty><div class=big>📭</div>No quizzes yet.<br><br><a class="btn" href="#/create">+ Create your first quiz</a></div></div>`);
  el.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { store.deleteQuiz(b.dataset.del); renderQuizzes(el); });
  el.querySelectorAll("[data-sim]").forEach(b => b.onclick = () => {
    const q = store.getQuiz(b.dataset.sim);
    sessionStorage.setItem("quizapp.prefill", JSON.stringify(q.config || { class: q.class, subject: q.subject, medium: q.medium, topic: q.topic, difficulty: q.difficulty, questionCount: q.questions.length, questionTypes: q.questionTypes }));
    location.hash = "#/create";
  });
}
