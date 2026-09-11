import { store } from "../lib/store.js";
import { apiRegenerate } from "../lib/api.js";
import { checkQuestion, optText, esc, isCheckable } from "../components/questions.js";

const TYPE_LABEL = { mcq: "MCQ", true_false: "True / False", fill_blank: "Fill in the Blank", one_word: "One-Word", short_answer: "Short Answer", long_answer: "Long Answer", assertion_reason: "Assertion & Reason", match: "Match the Following", case_based: "Case-Based" };
const REASONS = [["wrong_answer", "Answer is wrong"], ["bad_options", "Options are wrong / duplicated"], ["off_topic", "Not on my chapter"], ["unclear", "Question unclear"], ["wrong_level", "Too hard / easy for my class"], ["other", "Other"]];

export function renderRunner(el, id) {
  const quiz = store.getQuiz(id);
  if (!quiz) { el.innerHTML = `<div class="card">Quiz not found. <a href="#/quizzes">Back</a></div>`; return; }
  const st = { idx: 0, ans: {}, phase: "taking" };
  const Q = () => quiz.questions[st.idx];
  const A = (qid) => st.ans[qid] || (st.ans[qid] = { user: null, checked: false, correct: false, correctText: "", revealed: false, open: false, subOpen: {} });

  function paint() {
    if (st.phase === "results") return paintResults();
    const q = Q(), a = A(q.id);
    if (st.repQid !== q.id) { st.rep = null; st.repQid = q.id; }
    const done = Object.values(st.ans).filter(x => x.checked || x.revealed).length;
    el.innerHTML = `<div class="quiz-head"><h1 style="margin-bottom:2px">${esc(quiz.title)}</h1>
    <p class=mut style="margin:4px 0 8px">Question ${st.idx + 1} / ${quiz.questions.length} &nbsp;<span class="badge">${TYPE_LABEL[q.type] || q.type}</span></p>
    <div class="prog"><i style="width:${Math.round(done / quiz.questions.length * 100)}%"></i></div></div>
    <div class="card"><div class="pal">${quiz.questions.map((x, i) => {
      const s = st.ans[x.id];
      const cls = [i === st.idx ? "cur" : "", s?.revealed ? "rev" : "", s?.checked ? "done" : ""].join(" ");
      return `<button data-j="${i}" class="${cls}">${i + 1}</button>`;
    }).join("")}</div></div>
    <div class="card"><h3>${q.regenerated ? "↻ " : ""}${esc(q.question)}</h3>${qBody(q, a)}
      <div id="fb">${feedback(q, a)}</div>
      <div id="rep">${reportHtml()}</div>
      <div class="nav2"><button class="btn sec" id="prev">Previous</button><button class="btn sec" id="next">Next</button></div>
    </div>
    <div class="card"><b>Finish Quiz</b><p class=mut>${quiz.questions.length} questions · Answered: ${done} · Unanswered: ${quiz.questions.length - done}</p>
    <button class="btn" id="finish">Finish Quiz</button> <button class="btn ghost" id="retry">Retry Quiz</button></div>`;
    el.querySelectorAll("[data-j]").forEach(b => b.onclick = () => { st.idx = Number(b.dataset.j); paint(); });
    el.querySelector("#prev").onclick = () => { if (st.idx > 0) { st.idx--; paint(); } };
    el.querySelector("#next").onclick = () => { if (st.idx < quiz.questions.length - 1) { st.idx++; paint(); } };
    el.querySelector("#retry").onclick = () => { st.idx = 0; st.ans = {}; st.phase = "taking"; paint(); };
    el.querySelector("#finish").onclick = finish;
    wireInputs(q, a);
  }

  function qBody(q, a) {
    const dis = a.checked ? "disabled" : "";
    if (["mcq", "true_false", "assertion_reason"].includes(q.type)) {
      return `<div class="opts">${(q.options || []).map(o => {
        const sel = a.user === o.id ? "sel" : "";
        const mark = a.checked ? (o.id === q.correctAnswer ? "right" : (a.user === o.id ? "wrong" : "")) : "";
        return `<label class="opt ${sel} ${mark}"><input type="radio" name="opt" value="${o.id}" ${a.user === o.id ? "checked" : ""} ${dis} /> ${esc(o.text)}</label>`;
      }).join("")}</div>${!a.checked ? `<button class="btn" id="check">Check Answer</button>` : ""}`;
    }
    if (["fill_blank", "one_word"].includes(q.type)) {
      return `<input id="txt" placeholder="Type your answer..." value="${esc(a.user || "")}" ${dis} />
      ${!a.checked ? `<div style="margin-top:10px"><button class="btn" id="check">Check</button></div>` : ""}`;
    }
    if (q.type === "match") {
      const rights = [...(q.pairs || []).map(p => p.right)];
      return (q.pairs || []).map((p, i) => {
        const leftKey = p.left.split(":")[0].trim();
        return `<div style="margin:8px 0"><b>${esc(p.left)}</b><select data-m="${esc(leftKey)}" ${dis}><option value="">— select —</option>${rights.map(r => `<option ${a.user?.[leftKey] === r ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></div>`;
      }).join("") + (!a.checked ? `<button class="btn" id="check">Check</button>` : "");
    }
    if (q.type === "case_based") {
      return `<div class="card" style="background:#f8f9ff"><b>Passage</b><p>${esc(q.passage)}</p></div>
      ${(q.subQuestions || []).map((s, i) => `<div class="reveal ${a.subOpen[i] ? "open" : ""}"><button data-sub="${i}">${a.subOpen[i] ? "Hide Answer ▲" : "Show Answer ▼"} — ${esc(s.question.slice(0, 60))}</button><div class="body"><div class="inner"><b>Answer:</b> ${esc(s.answer)}<p class=explain>${esc(s.explanation)}</p></div></div></div>`).join("")}
      ${!a.revealed ? `<div style="margin-top:10px"><button class="btn sec" id="rev">I have attempted — Show Answers</button></div>` : ""}`;
    }
    return `<textarea id="txt" class="${q.type === "long_answer" ? "long" : ""}" placeholder="Write your answer, then reveal the model answer...">${esc(a.user || "")}</textarea>
    <div class="reveal ${a.open ? "open" : ""}" style="margin-top:10px"><button id="rev">${a.open ? "Hide Answer ▲" : "Show Model Answer ▼"}</button>
    <div class="body"><div class="inner"><b>Model Answer:</b><p>${esc(typeof q.answer === "string" ? q.answer : JSON.stringify(q.answer))}</p><p class=explain>${esc(q.explanation)}</p></div></div></div>`;
  }

  function feedback(q, a) {
    if (a.checked) return `<div class="fb ${a.correct ? "ok" : "bad"}">${a.correct ? "✓ Correct" : "✗ Incorrect"}<br><b>Correct Answer:</b> ${esc(a.correctText)}<p class=explain>${esc(q.explanation)}</p></div>`;
    if (a.revealed) return `<div class="fb eye">👁 Answer Revealed — not counted as correct.<p class=explain>${esc(q.explanation)}</p></div>`;
    return "";
  }

  function wireInputs(q, a) {
    el.querySelectorAll('input[name="opt"]').forEach(r => r.onchange = () => { a.user = r.value; paint(); });
    const txt = el.querySelector("#txt");
    if (txt && ["short_answer", "long_answer"].includes(q.type)) txt.oninput = () => { a.user = txt.value; };
    const chk = el.querySelector("#check");
    if (chk) chk.onclick = () => {
      if (q.type === "match") {
        const m = {}; el.querySelectorAll("[data-m]").forEach(s => m[s.dataset.m] = s.value);
        a.user = m;
      } else if (txt) a.user = txt.value;
      if (a.user == null || a.user === "" || (typeof a.user === "object" && Object.values(a.user).some(v => !v))) { alert("Please answer first (or use Show Answer to learn)."); return; }
      const r = checkQuestion(q, a.user);
      a.checked = true; a.correct = r.correct; a.correctText = r.correctText;
      paint();
    };
    const rev = el.querySelector("#rev");
    if (rev) rev.onclick = () => {
      if (["short_answer", "long_answer"].includes(q.type)) { a.open = !a.open; if (a.open) a.revealed = true; if (txt) a.user = txt.value; }
      else a.revealed = true;
      paint();
    };
    el.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => {
      const i = b.dataset.sub; a.subOpen[i] = !a.subOpen[i]; a.revealed = true; paint();
    });
    wireReport(q);
  }

  function reportHtml() {
    const r = st.rep || {};
    if (r.done) return `<div class="fb ok">↻ Fresh question generated by AI.</div><div style="margin-top:8px"><button class="btn ghost" id="rep-open">⚠️ Report a problem</button></div>`;
    if (!r.open) return `<div style="margin-top:12px"><button class="btn ghost" id="rep-open">⚠️ Report a problem with this question</button></div>`;
    return `<div class="reveal open"><button id="rep-close">⚠️ Report — hide ▲</button><div class="body"><div class="inner">
      <label>What's wrong? (pick one)</label>
      <select id="rep-reason">${REASONS.map(([v, l]) => `<option value="${v}" ${r.reason === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <div style="margin-top:8px"><label>Note (optional)</label><input id="rep-note" placeholder="e.g. option B is also correct" value="${esc(r.note || "")}" /></div>
      ${r.err ? `<div class="fb bad">${esc(r.err)}</div>` : ""}
      <div style="margin-top:10px"><button class="btn" id="rep-go" ${r.busy ? "disabled" : ""}>${r.busy ? `<span class="spin"></span> Regenerating...` : "↻ AI: regenerate this question"}</button></div>
    </div></div></div>`;
  }

  function wireReport(q) {
    const open = el.querySelector("#rep-open");
    if (open) open.onclick = () => { st.rep = { open: true, reason: "wrong_answer", note: "" }; paint(); };
    const close = el.querySelector("#rep-close");
    if (close) close.onclick = () => { st.rep = null; paint(); };
    const sel = el.querySelector("#rep-reason"), note = el.querySelector("#rep-note");
    if (sel) sel.onchange = () => { st.rep.reason = sel.value; };
    if (note) note.oninput = () => { st.rep.note = note.value; };
    const go = el.querySelector("#rep-go");
    if (go) go.onclick = async () => {
      st.rep.busy = true; st.rep.err = ""; paint();
      try {
        const nq = await apiRegenerate({
          class: quiz.class, subject: quiz.subject, medium: quiz.medium, topic: quiz.topic,
          difficulty: quiz.difficulty, type: q.type, badQuestion: q.question,
          badOptions: (q.options || []).map(o => o.text).join(" | "),
          reason: st.rep.reason, note: st.rep.note, provider: quiz.config?.provider || store.settings().provider || undefined, model: store.settings().model || undefined
        });
        nq.id = q.id; nq.regenerated = true;
        quiz.questions[st.idx] = nq;
        delete st.ans[q.id];
        store.saveQuiz(quiz);
        st.rep = { done: true };
        paint();
      } catch (e) {
        st.rep.busy = false;
        st.rep.err = `Bug: ${e.message || "Regeneration failed. Please try again."}${e.requestId ? ` [Ref: ${e.requestId}]` : ""} — press the button again to retry.`;
        paint();
      }
    };
  }

  function finish() {
    let correct = 0, incorrect = 0, revealed = 0, unanswered = 0;
    const wrongTopics = [];
    quiz.questions.forEach(q => {
      const a = st.ans[q.id];
      if (!a || (!a.checked && !a.revealed)) unanswered++;
      else if (a.checked && a.correct) correct++;
      else if (a.checked) { incorrect++; wrongTopics.push(quiz.topic); }
      else if (a.revealed) { revealed++; wrongTopics.push(quiz.topic); }
    });
    const total = quiz.questions.length;
    const accuracy = Math.round(correct / total * 100);
    store.saveResult({ quizId: quiz.id, title: quiz.title, total, correct, incorrect, revealed, unanswered, accuracy, at: new Date().toISOString(), wrongTopics });
    st.summary = { correct, incorrect, revealed, unanswered, accuracy, total };
    st.phase = "results";
    paint();
  }

  function paintResults() {
    const s = st.summary;
    el.innerHTML = `<h1>Results</h1>
    <div class="grid g4">
      <div class="card"><div class=mut>Score</div><div class=stat>${s.correct} / ${s.total}</div></div>
      <div class="card"><div class=mut>Accuracy</div><div class=stat>${s.accuracy}%</div></div>
      <div class="card"><div class=mut>Correct / Incorrect</div><div class=stat>${s.correct} / ${s.incorrect}</div></div>
      <div class="card"><div class=mut>Revealed / Unanswered</div><div class=stat>${s.revealed} / ${s.unanswered}</div></div>
    </div>
    <div class="card"><h3>📖 Learning Review</h3>${quiz.questions.map((q, i) => {
      const a = st.ans[q.id] || {};
      const st3 = a.checked ? (a.correct ? `<span class="status ok">✓ Correct</span>` : `<span class="status bad">✗ Incorrect</span>`) : (a.revealed ? `<span class="status eye">👁 Answer Revealed</span>` : `<span class="status">○ Unanswered</span>`);
      const your = a.user == null ? "—" : (typeof a.user === "object" ? JSON.stringify(a.user) : a.user) || "(written answer — see model answer)";
      const corr = a.correctText || (typeof q.answer === "string" ? q.answer : JSON.stringify(q.answer || q.subQuestions?.[0]?.answer));
      return `<div class="rev-item"><b>Q${i + 1}</b> <span class="badge">${TYPE_LABEL[q.type]}</span><p>${esc(q.question)}</p><p><b>Your Answer:</b> ${esc(String(your))}</p><p><b>Correct Answer:</b> ${esc(String(corr))}</p><p class=explain><b>Explanation:</b> ${esc(q.explanation)}</p><p><b>Status:</b> ${st3}</p></div>`;
    }).join("")}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="r-retry">Retry Quiz</button><button class="btn sec" id="r-sim">Generate Similar Quiz</button><a class="btn ghost" href="#/dashboard">Dashboard</a></div>`;
    el.querySelector("#r-retry").onclick = () => { st.idx = 0; st.ans = {}; st.phase = "taking"; paint(); };
    el.querySelector("#r-sim").onclick = () => {
      sessionStorage.setItem("quizapp.prefill", JSON.stringify(quiz.config || { class: quiz.class, subject: quiz.subject, medium: quiz.medium, topic: quiz.topic, difficulty: quiz.difficulty, questionCount: quiz.questions.length, questionTypes: quiz.questionTypes }));
      location.hash = "#/create";
    };
  }
  paint();
}
