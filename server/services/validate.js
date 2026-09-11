const VALID = new Set(["mcq","true_false","fill_blank","one_word","short_answer","long_answer","assertion_reason","match","case_based"]);

function extractJson(raw) {
  let s = String(raw || "").trim().replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

export function validateQuiz(raw, cfg) {
  let d;
  try { d = extractJson(raw); }
  catch { return { error: "AI returned invalid JSON." }; }
  if (!d || !Array.isArray(d.questions)) return { error: "AI returned bad structure." };
  if (d.questions.length !== cfg.questionCount) return { error: `AI returned ${d.questions.length} questions, expected ${cfg.questionCount}.` };
  const ids = new Set();
  const kw = String(cfg.topic || "").toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3);
  const skipTopicCheck = !kw.length || /^(general|basics?)$/i.test(cfg.topic || "") || (cfg.medium || "").toLowerCase() !== "english";
  let onTopic = 0;
  for (let i = 0; i < d.questions.length; i++) {
    const q = d.questions[i];
    if (!q || VALID.has(q.type) === false) return { error: `Invalid question type at Q${i + 1}.` };
    if (!q.id || ids.has(q.id)) q.id = `q${i + 1}`;
    ids.add(q.id);
    if (!q.question || !String(q.question).trim()) return { error: `Empty question at Q${i + 1}.` };
    if (!q.answer || !String(q.answer).trim()) {
      if (q.type === "match" && q.answer && typeof q.answer === "object") { /* ok */ }
      else if (q.type === "case_based" && Array.isArray(q.subQuestions) && q.subQuestions.length) q.answer = q.subQuestions[0].answer || "See sub-questions";
      else return { error: `Empty answer at Q${i + 1}.` };
    }
    if (!["one_word", "explanation"].includes(q.answerMode)) {
      const words = String(q.answer?.text || q.answer || "").trim().split(/\s+/).length;
      q.answerMode = words <= 2 ? "one_word" : "explanation";
    }
    if (!q.explanation || !String(q.explanation).trim()) q.explanation = q.answerMode === "one_word" ? `The correct answer is ${q.answer}.` : String(typeof q.answer === "string" ? q.answer : "See answer above.");
    if (["mcq", "true_false", "assertion_reason"].includes(q.type)) {
      if (!Array.isArray(q.options) || q.options.length < 2) return { error: `Missing options at Q${i + 1}.` };
      const optIds = new Set(q.options.map(o => o.id));
      if (!optIds.has(q.correctAnswer)) return { error: `Correct answer not in options at Q${i + 1}.` };
      const ansText = q.options.find(o => o.id === q.correctAnswer)?.text;
      if (ansText && String(q.answer).length < 2) q.answer = ansText;
    }
    if (q.type === "mcq" && q.options.length !== 4) return { error: `MCQ must have 4 options at Q${i + 1}.` };
    if (q.type === "match" && (!Array.isArray(q.pairs) || !q.pairs.length)) return { error: `Missing pairs at Q${i + 1}.` };
    if (q.type === "case_based" && (!q.passage || !Array.isArray(q.subQuestions) || !q.subQuestions.length)) return { error: `Bad case question at Q${i + 1}.` };
    if ((q.type === "fill_blank" || q.type === "one_word") && !Array.isArray(q.acceptableAnswers)) {
      q.acceptableAnswers = [String(q.answer).toLowerCase().trim()];
    }
    if (!skipTopicCheck) {
      const hay = `${q.question} ${q.passage || ""} ${(q.subQuestions || []).map(s => s.question).join(" ")}`.toLowerCase();
      if (kw.some(k => hay.includes(k))) onTopic++;
    }
  }
  if (!skipTopicCheck && onTopic === 0) return { error: `AI drifted off-topic (expected "${cfg.topic}").` };
  return { quiz: { title: d.title || `Class ${cfg.class} ${cfg.subject} - ${cfg.topic}`, class: cfg.class, subject: cfg.subject, medium: cfg.medium, topic: cfg.topic, difficulty: cfg.difficulty, questionTypes: cfg.questionTypes, questions: d.questions, createdAt: new Date().toISOString() } };
}
