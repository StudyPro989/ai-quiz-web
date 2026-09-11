export async function generateWithGroq(prompt, model) {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error("AI_API_KEY missing");
  const variants = [
    { json: true, max: 8000 },
    { json: false, max: 8000 },
    { json: false, max: 4000 }
  ];
  let lastErr = new Error(`AI rejected the request (${model}). Try another model like openai/gpt-oss-20b.`);
  for (const v of variants) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    try {
      const body = { model, temperature: 0.5, max_tokens: v.max, messages: [{ role: "system", content: "Return valid JSON only." }, { role: "user", content: prompt }] };
      if (v.json) body.response_format = { type: "json_object" };
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
      if (r.status === 429) throw new Error("Rate limit — please try again shortly.");
      if (r.status === 401) throw new Error("Invalid Groq API key.");
      if (r.status === 400) { lastErr = new Error(`AI rejected the request (${model}). Try another model like openai/gpt-oss-20b.`); continue; }
      if (!r.ok) throw new Error(`AI provider error ${r.status}`);
      const j = await r.json();
      const text = j.choices?.[0]?.message?.content || "";
      if (!text.trim()) throw new Error("Empty AI response");
      return text;
    } catch (e) {
      if (e.name === "AbortError") throw new Error("AI request timed out. Please try again.");
      if (/Rate limit|Invalid Groq|provider error|Empty/.test(e.message)) throw e;
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}
