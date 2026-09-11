import { generateWithGroq } from "./groq.js";
import { generateWithGemini } from "./gemini.js";

export const PROVIDERS = ["groq", "gemini"];

export function providerModels(p) {
  if (p === "gemini") {
    return (process.env.ALLOWED_GEMINI_MODELS || "gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.5-pro").split(",").map(s => s.trim()).filter(Boolean);
  }
  return (process.env.ALLOWED_MODELS || "openai/gpt-oss-120b,openai/gpt-oss-20b,openai/gpt-oss-safeguard-20b,qwen/qwen3.6-27b,qwen/qwen3.8-27b,groq/compound,groq/compound-mini,allam-2-7b").split(",").map(s => s.trim()).filter(Boolean);
}

export function defaultModel(p) {
  if (p === "gemini") return process.env.GEMINI_MODEL || providerModels("gemini")[0];
  return process.env.AI_MODEL || providerModels("groq")[0];
}

export function resolveProvider(requested) {
  const allowed = (process.env.ALLOWED_PROVIDERS || "groq,gemini").split(",").map(s => s.trim()).filter(Boolean);
  if (allowed.includes(requested)) return requested;
  return process.env.AI_PROVIDER || "groq";
}

export function resolveModel(provider, requested) {
  const list = providerModels(provider);
  if (list.includes(requested)) return requested;
  return defaultModel(provider);
}

export function providerKeyMissing(provider) {
  if (provider === "gemini") return !process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : "";
  return !process.env.AI_API_KEY ? "AI_API_KEY" : "";
}

export function generate(prompt, provider, model) {
  return provider === "gemini" ? generateWithGemini(prompt, model) : generateWithGroq(prompt, model);
}
