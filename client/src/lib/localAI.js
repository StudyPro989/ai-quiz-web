// Pages-native mode: prompt + validate + call Gemini straight from the browser.
// NOTE: keep in sync with server/services/{prompt,validate,gemini}.js
const CLASS_GUIDE = {
  "6": "age ~11, Upper Primary. Use very simple language, basic definitions, everyday examples. Only NCERT Class 6 syllabus depth.",
  "7": "age ~12, Upper Primary. Simple language, foundational concepts with small extensions. Only NCERT Class 7 syllabus depth.",
  "8": "age ~13, Upper Primary. Clear direct questions, introductory reasoning. Only NCERT Class 8 syllabus depth.",
  "9": "age ~14, Secondary school, board-foundation level. NCERT Class 9 depth with moderate reasoning.",
  "10": "age ~15-16, Secondary board-exam level. NCERT Class 10 depth, application + reasoning, but no Class 11 concepts.",
  "11": "age ~16-17, Senior Secondary. NCERT Class 11 depth with derivations and numericals where relevant, no UG-level content.",
  "12": "age ~17-18, Senior Secondary board + CUET/NEET/JEE-foundation level at most. NCERT Class 12 depth, no UG-level content."
};
const TYPE_GUIDE = {
  mcq: "Multiple choice with exactly 4 options (id option_1..option_4), correctAnswer = winning option id.",
  true_false: "True/False: options True and False (option_1=True, option_2=False), correctAnswer accordingly.",
  fill_blank: "Fill in the blank: question contains ______; answer = missing word/phrase; acceptableAnswers lowercase variants.",
  one_word: "One-word answer: very short fact answer.",
  short_answer: "Short answer: 2-4 sentences model answer.",
  long_answer: "Long answer: structured model answer with key points.",
  assertion_reason: "MCQ with Assertion + Reason, 4 standard options A-D as option texts.",
  match: "Match the following: pairs array [{left,right}], answer = mapping object, explanation describes each match. Also set answerMode explanation.",
  case_based: "Case-based: passage field + subQuestions array (each with question, answer, explanation). Top-level answer mirrors first sub-question summary."
};

export function buildPromptLocal(cfg, fix) {
  const types = cfg.questionTypes.join(", ");
  const level = CLASS_GUIDE[cfg.class] || "Use the exact syllabus depth of the stated class.";
  const regen = fix ? `
REGENERATION REQUEST (a previous question was reported wrong — replace it):
- Bad question: ${fix.badQuestion}
${fix.badOptions ? `- Its options were: ${fix.badOptions}` : ""}
- Reported problem: ${fix.reason}${fix.note ? ` (student note: ${fix.note})` : ""}
- Generate ONE fresh ${fix.type} question on "${cfg.topic}" that does NOT repeat this flaw: ensure exactly one unambiguously correct answer, correct option labelled correctly, and the question strictly on-topic at Class ${cfg.class} level.
` : "";
  return `You are a helpful Indian school curriculum quiz generator.
Generate a self-training quiz (NOT a timed exam) for:
Class: ${cfg.class}, Subject: ${cfg.subject}, Medium/language: ${cfg.medium}, Topic: ${cfg.topic}, Difficulty: ${cfg.difficulty}, Count: ${cfg.questionCount}, Types (mix evenly): ${types}.

STRICT TOPIC (never violate):
- EVERY question must be about the topic "${cfg.topic}" within ${cfg.subject}. Questions from any other chapter or topic are WRONG.
- Do not drift to neighbouring chapters even if they seem related. Stay on "${cfg.topic}" for all ${cfg.questionCount} questions.
- For case-based questions, the passage AND all sub-questions must be on "${cfg.topic}".

CLASS-LEVEL CEILING (strict — never violate):
- Target learner: Class ${cfg.class} (${level})
- Every question MUST be solvable by an average Class ${cfg.class} student who studied only up to the Class ${cfg.class} NCERT syllabus.
- NEVER use concepts, formulas, terminology, or problem-solving methods that are taught in HIGHER classes. If the topic also exists in higher classes, use ONLY the Class ${cfg.class} portion.
- Vocabulary and sentence length must suit Class ${cfg.class}. For Class 6-8 use short simple sentences; technical terms only if introduced by that class.
- Difficulty "${cfg.difficulty}" means difficulty WITHIN Class ${cfg.class} level: Easy = basic recall from the chapter; Medium = understanding/application at class level; Hard = the toughest board-style questions AT class level, never above it.
- Distractors (wrong MCQ options) must be plausible at Class ${cfg.class} level, not absurdly advanced or trivially silly.
- Case-study passages must be readable by a Class ${cfg.class} student.
- When uncertain about syllabus boundaries, always choose the simpler, lower-class version. If the topic is normally taught in a higher class, introduce it from scratch AT Class ${cfg.class} level instead of importing the higher-class treatment.
${regen}
Rules:
- Content language MUST be in ${cfg.medium} (questions, options, answers, explanations, passages).
- Distribute the ${cfg.questionCount} questions across the requested types.
- answerMode: "one_word" ONLY if answer is genuinely one word/short term; else "explanation".
- Every question needs: id (q1..qn), type, question, answer, answerMode, explanation.
- mcq/true_false/assertion_reason need options[{id,text}] + correctAnswer (option id). assertion_reason options must be:
  option_1 "Both A and R are true, and R correctly explains A.", option_2 "Both A and R are true, but R does not explain A.", option_3 "A is true but R is false.", option_4 "A is false but R is true."
- fill_blank/one_word add acceptableAnswers (lowercase).
- match needs pairs[{left,right}] + answer mapping like {"A":"2"} + answerMode "explanation".
- case_based needs passage + subQuestions[{question,answer,explanation}].
Type notes:
${Object.entries(TYPE_GUIDE).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

Return JSON ONLY, no markdown, matching this shape:
{"title":"...","class":"${cfg.class}","subject":"${cfg.subject}","medium":"${cfg.medium}","topic":"${cfg.topic}","difficulty":"${cfg.difficulty}","questions":[{"id":"q1","type":"mcq","question":"...","options":[{"id":"option_1","text":"..."}],"correctAnswer":"option_1","answer":"...","answerMode":"one_word","explanation":"..."}]}`;
}

const VALID = new Set(["mcq", "true_false", "fill_blank", "one_word", "short_answer", "long_answer", "assertion_reason", "match", "case_based"]);
function extractJson(raw) {
  const s0 = String(raw || "").trim().replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  const a = s0.indexOf("{"), b = s0.lastIndexOf("}");
  return JSON.parse(a >= 0 && b > a ? s0.slice(a, b + 1) : s0);
}

export function validateLocal(raw, cfg) {
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
      if (!new Set(q.options.map(o => o.id)).has(q.correctAnswer)) return { error: `Correct answer not in options at Q${i + 1}.` };
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
      const hay = `${q.question} ${(q.options || []).map(o => o.text).join(" ")} ${typeof q.answer === "string" ? q.answer : ""} ${q.explanation || ""} ${q.passage || ""} ${(q.subQuestions || []).map(sq => sq.question).join(" ")}`.toLowerCase();
      const hit = kw.some(k => {
        const v = [k, k + "s", k.replace(/s$/, "")].filter((x, i, a) => x.length > 3 && a.indexOf(x) === i);
        return v.some(x => hay.includes(x));
      });
      if (hit) onTopic++;
    }
  }
  if (!skipTopicCheck && d.questions.length >= 3 && (onTopic === 0 || onTopic / d.questions.length < 1 / 3)) return { error: `AI drifted off-topic (expected "${cfg.topic}").` };
  return { quiz: { title: d.title || `Class ${cfg.class} ${cfg.subject} - ${cfg.topic}`, class: cfg.class, subject: cfg.subject, medium: cfg.medium, topic: cfg.topic, difficulty: cfg.difficulty, questionTypes: cfg.questionTypes, questions: d.questions, createdAt: new Date().toISOString() } };
}

// Gemini keys have no whitespace — strip it all (catches broken pastes).
export const cleanKey = (k) => String(k || "").replace(/[\s'"]+/g, "");

const GROOT = "https://generativelanguage.googleapis.com";
// Header first, `?key=` fallback (avoids preflight/header-stripping issues).
async function gfetch(path, key, init = {}, timeoutMs = 25000, dbg = null) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const attempt = (asQuery, tag) => {
    if (dbg) dbg.tried.push(tag);
    const url = asQuery ? `${GROOT}${path}?key=${encodeURIComponent(key)}` : `${GROOT}${path}`;
    const headers = { ...(init.headers || {}) };
    if (!asQuery) headers["x-goog-api-key"] = key;
    return fetch(url, { ...init, headers, signal: ctrl.signal });
  };
  try {
    try { return await attempt(false, "header"); }
    catch (e) {
      if (e.name === "AbortError") throw e;
      if (dbg) dbg.headerErr = e.name + ": " + e.message;
      return await attempt(true, "query");
    }
  } finally { clearTimeout(t); }
}
const httpErr = (r) => {
  if (r.status === 400 || r.status === 403) return "Invalid Gemini API key (or it's restricted for this site).";
  if (r.status === 429) return "Rate limited — try again in a minute.";
  return `Key check failed (HTTP ${r.status}).`;
};

export async function testGeminiKey(key, say) {
  const log = (t) => { try { say && say(t); } catch (_) {} };
  key = cleanKey(key);
  if (!key) throw new Error("Paste a key first.");
  if (/^gsk_/.test(key)) throw new Error("That's a Groq key — this box needs a Gemini key (starts with AIza).");
  const dbg = { tried: [], at: new Date().toISOString() };
  try {
    log("3a. Trying secure header mode…");
    const r = await gfetch("/v1beta/models", key, {}, 25000, dbg);
    log("3b. Google answered (HTTP " + r.status + ")…");
    if (!r.ok) {
      const e = new Error(httpErr(r));
      e.debug = JSON.stringify({ ...dbg, http: r.status });
      throw e;
    }
    return true;
  } catch (e) {
    if (!e.debug) {
      e.debug = JSON.stringify({ ...dbg, err: e.name + ": " + e.message });
      if (e.name === "AbortError") e.message = "Timed out — check your internet and retry.";
      else if (/fetch|network|load failed/i.test(e.message)) e.message = "Network blocked — check internet / ad-blocker, then retry.";
    }
    throw e;
  }
}

async function geminiCall(prompt, key, model) {
  key = cleanKey(key);
  const dbg = { tried: [] };
  const body = {
    systemInstruction: { parts: [{ text: "Return valid JSON only. No markdown fences." }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 8000, responseMimeType: "application/json" }
  };
  try {
    const r = await gfetch(`/v1beta/models/${encodeURIComponent(model)}:generateContent`, key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }, 90000, dbg);
    if (r.status === 429) throw new Error("Rate limit — please try again shortly.");
    if (r.status === 400) throw new Error("AI rejected the request (model name or quota).");
    if (r.status === 403 || r.status === 401) throw new Error("Invalid Gemini API key. Check Settings.");
    if (!r.ok) throw new Error(`AI provider error ${r.status}`);
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    if (!text.trim()) throw new Error("Empty AI response");
    return text;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("AI request timed out. Please try again.");
    if (!/Rate limit|rejected|Invalid|provider error|Empty/.test(e.message)) e.message += " [net:" + (dbg.tried.join(",") || "none") + "]";
    throw e;
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function generateQuizDirect(cfg, key, model) {
  const parts = [];
  for (let done = 0; done < cfg.questionCount; done += 10) parts.push(Math.min(10, cfg.questionCount - done));
  let questions = [];
  for (const n of parts) {
    const chunkCfg = { ...cfg, questionCount: n };
    let lastErr = "unknown error";
    let got = null;
    for (const wait of [0, 6000, 15000]) {
      if (wait) await sleep(wait);
      try {
        const raw = await geminiCall(buildPromptLocal(chunkCfg), key, model);
        const { quiz, error } = validateLocal(raw, chunkCfg);
        if (!error) { got = quiz.questions; break; }
        lastErr = error;
        if (!/rate limit/i.test(error)) break;
      } catch (e) {
        lastErr = e.message || "AI request failed";
        if (/Invalid Gemini|rejected/i.test(lastErr)) break;
        if (!/Rate limit|timed out/i.test(lastErr)) break;
      }
    }
    if (!got) throw new Error(lastErr);
    questions = questions.concat(got);
  }
  questions.forEach((q, i) => q.id = `q${i + 1}`);
  return { title: `Class ${cfg.class} ${cfg.subject} - ${cfg.topic}`, class: cfg.class, subject: cfg.subject, medium: cfg.medium, topic: cfg.topic, difficulty: cfg.difficulty, questionTypes: cfg.questionTypes, questions, createdAt: new Date().toISOString(), direct: true };
}

export async function regenerateDirect(cfg, fix, key, model) {
  let lastErr = "unknown error";
  for (let a = 0; a < 2; a++) {
    try {
      const raw = await geminiCall(buildPromptLocal({ ...cfg, questionCount: 1, questionTypes: [fix.type] }, fix), key, model);
      const { quiz, error } = validateLocal(raw, { ...cfg, questionCount: 1, questionTypes: [fix.type] });
      if (!error && quiz.questions.length) return quiz.questions[0];
      lastErr = error || "empty result";
    } catch (e) {
      lastErr = e.message || "AI request failed";
      if (/Invalid Gemini|rejected/i.test(lastErr)) break;
    }
  }
  throw new Error(lastErr);
}
