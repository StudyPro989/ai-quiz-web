const API = import.meta.env.VITE_API_URL || "";
function errOf(r, j, fb, extra) {
  const e = new Error(j.error || fb);
  e.status = r.status; e.requestId = j.requestId; e.extra = extra;
  return e;
}
export async function apiHealth() {
  const r = await fetch(`${API}/api/health`);
  return r.json();
}
export async function apiModels() {
  const r = await fetch(`${API}/api/models`);
  if (!r.ok) return { models: [], defaultModel: "" };
  return r.json();
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
