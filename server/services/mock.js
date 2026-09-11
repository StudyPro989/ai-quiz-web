export function generateMockQuiz(cfg) {
  const qs = [];
  const pool = [...cfg.questionTypes];
  for (let i = 0; i < cfg.questionCount; i++) {
    const type = pool[i % pool.length];
    const n = i + 1;
    const base = { id: `q${n}`, type, explanation: `Demo explanation for Q${n} on ${cfg.topic} (${cfg.subject}, Class ${cfg.class}).` };
    if (type === "mcq") qs.push({ ...base, question: `Demo MCQ ${n}: Which of these relates to ${cfg.topic}?`, options: [{ id: "option_1", text: cfg.topic }, { id: "option_2", text: "Unrelated A" }, { id: "option_3", text: "Unrelated B" }, { id: "option_4", text: "Unrelated C" }], correctAnswer: "option_1", answer: cfg.topic, answerMode: "explanation" });
    else if (type === "true_false") qs.push({ ...base, question: `Demo ${n}: "${cfg.topic}" is part of ${cfg.subject}.`, options: [{ id: "option_1", text: "True" }, { id: "option_2", text: "False" }], correctAnswer: "option_1", answer: "True", answerMode: "one_word" });
    else if (type === "fill_blank") qs.push({ ...base, question: `Demo ${n}: The key concept in ______ is important. (Hint: ${cfg.topic})`, answer: cfg.topic, acceptableAnswers: [cfg.topic.toLowerCase()], answerMode: "one_word" });
    else if (type === "match") qs.push({ ...base, question: `Demo ${n}: Match the items related to ${cfg.topic}.`, pairs: [{ left: "A: Concept 1", right: "1: Meaning 1" }, { left: "B: Concept 2", right: "2: Meaning 2" }], answer: { A: "1", B: "2" }, answerMode: "explanation" });
    else if (type === "case_based") qs.push({ ...base, question: `Demo case ${n} on ${cfg.topic}`, passage: `Read: A short demo passage about ${cfg.topic} for Class ${cfg.class} ${cfg.subject}. Use it to answer below.`, subQuestions: [{ question: `What is the main idea of the passage?`, answer: cfg.topic, explanation: "Main idea demo." }], answer: cfg.topic, answerMode: "explanation" });
    else if (type === "assertion_reason") qs.push({ ...base, question: `Assertion (A): ${cfg.topic} is important. Reason (R): It is part of ${cfg.subject}.`, options: [{ id: "option_1", text: "Both A and R are true, and R correctly explains A." }, { id: "option_2", text: "Both A and R are true, but R does not explain A." }, { id: "option_3", text: "A is true but R is false." }, { id: "option_4", text: "A is false but R is true." }], correctAnswer: "option_1", answer: "Both A and R are true, and R correctly explains A.", answerMode: "explanation" });
    else qs.push({ ...base, question: `Demo ${type} ${n}: Explain "${cfg.topic}" in the context of Class ${cfg.class} ${cfg.subject} (${cfg.difficulty}).`, answer: `${cfg.topic} is a key concept in ${cfg.subject}; revise definition, examples and key points.`, answerMode: type === "one_word" ? "one_word" : "explanation" });
  }
  return { title: `Class ${cfg.class} ${cfg.subject} - ${cfg.topic} (Demo)`, class: cfg.class, subject: cfg.subject, medium: cfg.medium, topic: cfg.topic, difficulty: cfg.difficulty, questionTypes: cfg.questionTypes, questions: qs, createdAt: new Date().toISOString() };
}
