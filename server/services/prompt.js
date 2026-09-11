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

const CLASS_GUIDE = {
  "6": "age ~11, Upper Primary. Use very simple language, basic definitions, everyday examples. Only NCERT Class 6 syllabus depth.",
  "7": "age ~12, Upper Primary. Simple language, foundational concepts with small extensions. Only NCERT Class 7 syllabus depth.",
  "8": "age ~13, Upper Primary. Clear direct questions, introductory reasoning. Only NCERT Class 8 syllabus depth.",
  "9": "age ~14, Secondary school, board-foundation level. NCERT Class 9 depth with moderate reasoning.",
  "10": "age ~15-16, Secondary board-exam level. NCERT Class 10 depth, application + reasoning, but no Class 11 concepts.",
  "11": "age ~16-17, Senior Secondary. NCERT Class 11 depth with derivations and numericals where relevant, no UG-level content.",
  "12": "age ~17-18, Senior Secondary board + CUET/NEET/JEE-foundation level at most. NCERT Class 12 depth, no UG-level content."
};

export function buildPrompt(cfg, fix) {
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
