export async function generateWithGemini(prompt, model) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 90000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "Return valid JSON only. No markdown fences." }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 8000, responseMimeType: "application/json" }
      }),
      signal: ctrl.signal
    });
    if (r.status === 429) throw new Error("Rate limit — please try again shortly.");
    if (r.status === 400) throw new Error("AI rejected the request (model name or quota).");
    if (r.status === 403 || r.status === 401) throw new Error("Invalid Gemini API key.");
    if (!r.ok) throw new Error(`AI provider error ${r.status}`);
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    if (!text.trim()) throw new Error("Empty AI response");
    return text;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("AI request timed out. Please try again.");
    throw e;
  } finally {
    clearTimeout(t);
  }
}
