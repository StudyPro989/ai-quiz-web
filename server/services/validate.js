const VALID = new Set(["mcq","true_false","fill_blank","one_word","short_answer","long_answer","assertion_reason","match","case_based"]);

function balanced(s) {
  const start = s.indexOf("{");
  if (start < 0) return s;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; }
    else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return s.slice(start, i + 1); }
  }
  return s.slice(start);
}

function autoClose(s) {
  const start = s.indexOf("{");
  if (start < 0) return s;
  let depthB = 0, depthA = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; }
    else if (c === '"') inStr = true;
    else if (c === "{") depthB++;
    else if (c === "}") depthB--;
    else if (c === "[") depthA++;
    else if (c === "]") depthA--;
  }
  return s.slice(start) + "}".repeat(Math.max(0, depthB)) + "]".repeat(Math.max(0, depthA));
}

function extractJson(raw) {
  const s0 = String(raw || "").trim().replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  const tries = [s0];
  const a = s0.indexOf("{"), b = s0.lastIndexOf("}");
  if (a >= 0 && b > a) tries.push(s0.slice(a, b + 1));
  tries.push(balanced(s0));
  tries.push(autoClose(s0));
  for (const t of tries) {
    try {
      const d = JSON.parse(t);
      if (d && Array.isArray(d.questions)) return d;
    } catch { /* next */ }
  }
  throw new Error("bad json");
}

function topicHit(q, kw) {
  const hay = `${q.question} ${(q.options || []).map(o => o.text).join(" ")} ${typeof q.answer === "string" ? q.answer : ""} ${q.explanation || ""} ${q.passage || ""} ${(q.subQuestions || []).map(s => s.question).join(" ")}`.toLowerCase();
  return kw.some(k => {
    const v = [k, k + "s", k.replace(/s$/, "")].filter((x, i, a) => x.length > 3 && a.indexOf(x) === i);
    return v.some(x => hay.includes(x));
  });
}

// Validates (and repairs) ONE question. Returns error string or null.
function checkOne(q, i, ids) {
  if (!q || VALID.has(q.type) === false) return `Invalid question type at Q${i + 1}.`;
  if (!q.id || (ids && ids.has(q.id))) q.id = `q${i + 1}`;
  if (ids) ids.add(q.id);
  if (!q.question || !String(q.question).trim()) return `Empty question at Q${i + 1}.`;
  if (!q.answer || !String(q.answer).trim()) {
    if (q.type === "match" && q.answer && typeof q.answer === "object") { /* ok */ }
    else if (q.type === "case_based" && Array.isArray(q.subQuestions) && q.subQuestions.length) q.answer = q.subQuestions[0].answer || "See sub-questions";
    else return `Empty answer at Q${i + 1}.`;
  }
  if (!["one_word", "explanation"].includes(q.answerMode)) {
    const words = String(q.answer?.text || q.answer || "").trim().split(/\s+/).length;
    q.answerMode = words <= 2 ? "one_word" : "explanation";
  }
  if (!q.explanation || !String(q.explanation).trim()) q.explanation = q.answerMode === "one_word" ? `The correct answer is ${q.answer}.` : String(typeof q.answer === "string" ? q.answer : "See answer above.");
  if (["mcq", "true_false", "assertion_reason"].includes(q.type)) {
    if (!Array.isArray(q.options) || q.options.length < 2) return `Missing options at Q${i + 1}.`;
    if (!new Set(q.options.map(o => o.id)).has(q.correctAnswer)) return `Correct answer not in options at Q${i + 1}.`;
    const ansText = q.options.find(o => o.id === q.correctAnswer)?.text;
    if (ansText && String(q.answer).length < 2) q.answer = ansText;
  }
  if (q.type === "mcq" && q.options.length !== 4) return `MCQ must have 4 options at Q${i + 1}.`;
  if (q.type === "match" && (!Array.isArray(q.pairs) || !q.pairs.length)) return `Missing pairs at Q${i + 1}.`;
  if (q.type === "case_based" && (!q.passage || !Array.isArray(q.subQuestions) || !q.subQuestions.length)) return `Bad case question at Q${i + 1}.`;
  if ((q.type === "fill_blank" || q.type === "one_word") && !Array.isArray(q.acceptableAnswers)) {
    q.acceptableAnswers = [String(q.answer).toLowerCase().trim()];
  }
  return null;
}

export function validateQuiz(raw, cfg) {
  let d;
  try { d = extractJson(raw); }
  catch { return { error: "AI returned invalid JSON." }; }
  if (!d || !Array.isArray(d.questions)) return { error: "AI returned bad structure." };
  const kw = String(cfg.topic || "").toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3);
  const skipTopicCheck = !kw.length || /^(general|basics?)$/i.test(cfg.topic || "") || (cfg.medium || "").toLowerCase() !== "english";
  if (d.questions.length !== cfg.questionCount) {
    const good = [];
    for (const q of d.questions) { if (!checkOne(q, good.length)) good.push(q); }
    return { error: `AI returned ${d.questions.length} questions, expected ${cfg.questionCount}.`, partial: good };
  }
  const ids = new Set();
  for (let i = 0; i < d.questions.length; i++) {
    const err = checkOne(d.questions[i], i, ids);
    if (err) return { error: err };
  }
  if (!skipTopicCheck && d.questions.length >= 3) {
    const onTopic = d.questions.filter(q => topicHit(q, kw)).length;
    if (onTopic === 0 || onTopic / d.questions.length < 1 / 3) return { error: `AI drifted off-topic (expected "${cfg.topic}").` };
  }
  return { quiz: { title: d.title || `Class ${cfg.class} ${cfg.subject} - ${cfg.topic}`, class: cfg.class, subject: cfg.subject, medium: cfg.medium, topic: cfg.topic, difficulty: cfg.difficulty, questionTypes: cfg.questionTypes, questions: d.questions, createdAt: new Date().toISOString() } };
}
