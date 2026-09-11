export const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
export function isCheckable(q) {
  return ["mcq", "true_false", "assertion_reason", "fill_blank", "one_word", "match"].includes(q.type);
}
export function checkQuestion(q, user) {
  if (["mcq", "true_false", "assertion_reason"].includes(q.type)) {
    return { correct: norm(user) === norm(q.correctAnswer), correctText: optText(q, q.correctAnswer) };
  }
  if (["fill_blank", "one_word"].includes(q.type)) {
    const acc = [q.answer, ...(q.acceptableAnswers || [])].map(norm);
    return { correct: acc.includes(norm(user)), correctText: String(q.answer) };
  }
  if (q.type === "match") {
    const keys = Object.keys(q.answer || {});
    const correct = keys.length > 0 && keys.every(k => norm(user?.[k]) === norm(q.answer[k]));
    const correctText = keys.map(k => `${k} → ${q.answer[k]}`).join(", ");
    return { correct, correctText };
  }
  return { correct: false, correctText: String(q.answer ?? "") };
}
export function optText(q, id) {
  return q.options?.find(o => o.id === id)?.text ?? String(q.answer ?? "");
}
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
