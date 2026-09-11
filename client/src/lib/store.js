const K = { quizzes: "quizapp.quizzes.v1", results: "quizapp.results.v1", settings: "quizapp.settings.v1" };
const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
export const store = {
  quizzes: () => read(K.quizzes, []),
  saveQuiz(quiz) {
    const all = read(K.quizzes, []);
    const i = all.findIndex(q => q.id === quiz.id);
    if (i >= 0) all[i] = quiz; else all.unshift(quiz);
    write(K.quizzes, all.slice(0, 100));
  },
  getQuiz: (id) => read(K.quizzes, []).find(q => q.id === id),
  deleteQuiz(id) { write(K.quizzes, read(K.quizzes, []).filter(q => q.id !== id)); },
  results: () => read(K.results, []),
  saveResult(r) { const all = read(K.results, []); all.unshift(r); write(K.results, all.slice(0, 200)); },
  settings: () => read(K.settings, { model: "", theme: "light", defaults: {} }),
  saveSettings(s) { write(K.settings, s); }
};
export const uid = () => "z" + Math.random().toString(36).slice(2, 9);
