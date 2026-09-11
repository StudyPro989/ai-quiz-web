import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { buildPrompt } from "./services/prompt.js";
import { validateQuiz } from "./services/validate.js";
import { generate, providerModels, defaultModel, resolveProvider, resolveModel, providerKeyMissing, PROVIDERS } from "./services/aiProvider.js";

const app = express();
const PORT = process.env.PORT || 3001;
app.disable("x-powered-by");
const origins = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : undefined));
app.use(express.json({ limit: "100kb" }));

// In-memory per-IP rate limit for the expensive generation endpoint (no extra deps).
const hits = new Map();
const GEN_LIMIT = Number(process.env.GEN_LIMIT_PER_HOUR || 20);
app.use(["/api/generate-quiz", "/api/regenerate-question"], (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now(), win = 60 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  if (arr.length >= GEN_LIMIT) {
    res.set("Retry-After", "3600");
    return res.status(429).json({ success: false, error: "Too many quiz requests. Please wait a while and try again.", requestId: `rl_${Date.now().toString(36)}` });
  }
  arr.push(now);
  hits.set(ip, arr);
  next();
});

const ALLOWED_TYPES = new Set(["mcq","true_false","fill_blank","one_word","short_answer","long_answer","assertion_reason","match","case_based"]);
const ALLOWED_DIFF = new Set(["easy","medium","hard","mixed"]);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, provider: "groq", model: process.env.AI_MODEL || "openai/gpt-oss-120b", hasKey: Boolean(process.env.AI_API_KEY), time: new Date().toISOString() });
});

app.get("/api/models", (req, res) => {
  const providers = PROVIDERS.filter(p => (process.env.ALLOWED_PROVIDERS || "groq,gemini").split(",").map(s => s.trim()).includes(p));
  const defaultProvider = process.env.AI_PROVIDER && providers.includes(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : providers[0];
  const modelsByProvider = Object.fromEntries(providers.map(p => [p, providerModels(p)]));
  res.json({ providers, defaultProvider, modelsByProvider, defaultModel: defaultModel(defaultProvider), models: modelsByProvider[defaultProvider] || [] });
});

app.post("/api/generate-quiz", async (req, res) => {
  const rid = `rq_${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  const fail = (code, error) => {
    console.error(`[${rid}] generate-quiz failed: ${error}`);
    return res.status(code).json({ success: false, error, requestId: rid });
  };
  try {
    const { class: cls, subject, medium, topic, questionTypes, difficulty, questionCount, model } = req.body || {};
    if (!cls) return fail(400, "Class is required.");
    if (!subject) return fail(400, "Subject is required.");
    if (!medium) return fail(400, "Medium is required.");
    if (!topic || !String(topic).trim()) return fail(400, "Chapter/topic is required.");
    const types = Array.isArray(questionTypes) ? questionTypes.filter(t => ALLOWED_TYPES.has(t)) : [];
    if (!types.length) return fail(400, "Select at least one valid question type.");
    const diff = String(difficulty || "medium").toLowerCase();
    if (!ALLOWED_DIFF.has(diff)) return fail(400, "Invalid difficulty.");
    const count = Number(questionCount);
    if (!Number.isInteger(count) || count < 1 || count > 30) return fail(400, "Question count must be 1-30.");

    const provider = resolveProvider(req.body?.provider);
    const chosenModel = resolveModel(provider, model);
    console.log(`Quiz request [${provider}/${chosenModel}]: Class ${cls} · ${subject} · ${medium} · "${topic}" · [${types.join(",")}] · ${diff} · x${count}`);
    const cfg = { class: String(cls), subject: String(subject), medium: String(medium), topic: String(topic).trim(), questionTypes: types, difficulty: diff, questionCount: count };

    const missing = providerKeyMissing(provider);
    if (missing) {
      return fail(500, `AI is not configured on the server. Please add ${missing} and restart.`);
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    async function genChunk(count) {
      const chunkCfg = { ...cfg, questionCount: count };
      const waits = [0, 12000, 30000];
      let lastErr = "unknown error";
      for (let a = 0; a < waits.length; a++) {
        if (waits[a]) await sleep(waits[a]);
        try {
          const raw = await generate(buildPrompt(chunkCfg), provider, chosenModel);
          const { quiz, error } = validateQuiz(raw, chunkCfg);
          if (!error) return quiz.questions;
          lastErr = error;
          if (/rate limit/i.test(error)) continue;
          if (a >= 1) break;
        } catch (e) {
          lastErr = e.message || "AI request failed";
          if (/401|invalid.*key/i.test(lastErr)) break;
          if (!/rate limit|timed out|provider error 5/i.test(lastErr)) { if (a >= 1) break; }
        }
      }
      throw new Error(lastErr);
    }
    try {
      const CHUNK = 10;
      const parts = [];
      for (let done = 0; done < count; done += CHUNK) parts.push(Math.min(CHUNK, count - done));
      let questions = [];
      for (const n of parts) questions = questions.concat(await genChunk(n));
      questions.forEach((q, i) => q.id = `q${i + 1}`);
      return res.json({ success: true, quiz: { title: `Class ${cfg.class} ${cfg.subject} - ${cfg.topic}`, class: cfg.class, subject: cfg.subject, medium: cfg.medium, topic: cfg.topic, difficulty: cfg.difficulty, questionTypes: cfg.questionTypes, questions, createdAt: new Date().toISOString() } });
    } catch (e) {
      const lastErr = e.message || "AI request failed";
      return fail(502, `We couldn't generate the quiz right now (${lastErr}). Please try again.`);
    }
  } catch {
    return fail(500, "We couldn't generate the quiz right now. Please try again.");
  }
});

const REGEN_REASONS = new Set(["wrong_answer", "bad_options", "off_topic", "unclear", "wrong_level", "other"]);

app.post("/api/regenerate-question", async (req, res) => {
  const rid = `rg_${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  const fail = (code, error) => {
    console.error(`[${rid}] regenerate-question failed: ${error}`);
    return res.status(code).json({ success: false, error, requestId: rid });
  };
  try {
    const { class: cls, subject, medium, topic, difficulty, type, badQuestion, badOptions, reason, note, model, provider: reqProvider } = req.body || {};
    if (!cls || !subject || !medium || !topic) return fail(400, "Quiz context is required.");
    if (!ALLOWED_TYPES.has(type)) return fail(400, "Invalid question type.");
    if (!REGEN_REASONS.has(reason)) return fail(400, "Please choose a report reason.");
    const provider = resolveProvider(reqProvider);
    const missing = providerKeyMissing(provider);
    if (missing) return fail(500, `AI is not configured on the server. Please add ${missing} and restart.`);
    const chosenModel = resolveModel(provider, model);
    const cfg = { class: String(cls), subject: String(subject), medium: String(medium), topic: String(topic), questionTypes: [type], difficulty: String(difficulty || "medium").toLowerCase(), questionCount: 1 };
    const fix = { type, badQuestion: String(badQuestion || "").slice(0, 1000), badOptions: String(badOptions || "").slice(0, 1000), reason, note: String(note || "").slice(0, 500) };
    let lastErr = "unknown error";
    for (let a = 0; a < 2; a++) {
      try {
        const raw = await generate(buildPrompt(cfg, fix), provider, chosenModel);
        const { quiz, error } = validateQuiz(raw, cfg);
        if (!error && quiz.questions.length) return res.json({ success: true, question: quiz.questions[0] });
        lastErr = error || "empty result";
      } catch (e) {
        lastErr = e.message || "AI request failed";
        if (/401|invalid.*key/i.test(lastErr)) break;
      }
    }
    res.status(502).json({ success: false, error: `We couldn't regenerate this question (${lastErr}). Please try again.`, requestId: rid });
  } catch {
    res.status(500).json({ success: false, error: "We couldn't regenerate this question. Please try again.", requestId: rid });
  }
});

app.listen(PORT, () => console.log(`Quiz API on http://localhost:${PORT}`));

// Serve built frontend (client/dist) so the whole app runs from ONE server.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, "index.html")));
}
