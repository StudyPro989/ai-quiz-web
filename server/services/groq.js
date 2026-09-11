export async function generateWithGroq(prompt, model) {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error("AI_API_KEY missing");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60000);
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, temperature: 0.5, max_tokens: 8000, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Return valid JSON only." }, { role: "user", content: prompt }] }),
      signal: ctrl.signal
    });
    if (r.status === 429) throw new Error("Rate limit — please try again shortly.");
    if (!r.ok) throw new Error(`AI provider error ${r.status}`);
    const j = await r.json();
    const text = j.choices?.[0]?.message?.content || "";
    if (!text.trim()) throw new Error("Empty AI response");
    return text;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("AI request timed out. Please try again.");
    throw e;
  } finally {
    clearTimeout(t);
  }
}
