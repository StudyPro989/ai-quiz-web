const API = import.meta.env.VITE_API_URL || "";
// Used when no backend is reachable (published static link): Gemini direct from browser.
export const LOCAL_AI = {
  providers: ["gemini"],
  defaultProvider: "gemini",
  modelsByProvider: { gemini: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"] },
  defaultModel: "gemini-2.5-flash",
  models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"]
};
function errOf(r, j, fb, extra) {
  const e = new Error(j.error || fb);
  e.status = r.status; e.requestId = j.requestId; e.extra = extra;
  return e;
}
// fetch with timeout so "Loading..." can never stick forever on a hanging network.
async function fetchT(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
export async function apiHealth() {
  try {
    const r = await fetchT(`${API}/api/health`);
    return r.json();
  } catch {
    return null;
  }
}
// Returns server list, or NULL when no backend is reachable (never rejects).
// Callers must fall back to LOCAL_AI explicitly so backendUp stays accurate.
export async function apiModels() {
  try {
    const r = await fetchT(`${API}/api/models`);
    if (!r.ok) return null;
    const j = await r.json();
    return j.providers ? j : null;
  } catch {
    return null;
  }
}
export async function apiRegenerate(payload) {
  const r = await fetch(`${API}/api/regenerate-question`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw errOf(r, j, "Regeneration failed");
  if (!j.success) throw errOf(r, j, "Regeneration failed");
  return j.question;
}
export async function apiGenerate(payload) {
  const r = await fetch(`${API}/api/generate-quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw errOf(r, j, "Generation failed");
  if (!j.success) throw errOf(r, j, "Generation failed");
  return j;
}
