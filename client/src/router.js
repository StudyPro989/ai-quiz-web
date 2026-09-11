import { renderDashboard } from "./pages/dashboard.js";
import { renderCreate } from "./pages/create.js";
import { renderRunner } from "./pages/runner.js";
import { renderQuizzes } from "./pages/quizzes.js";
import { renderPerformance } from "./pages/performance.js";
import { renderSettings } from "./pages/settings.js";
import { store } from "./lib/store.js";

const NAV = [["#/dashboard", "🏠 Dashboard"], ["#/create", "➕ Create Quiz"], ["#/quizzes", "📚 My Quizzes"], ["#/performance", "📊 Performance"], ["#/settings", "⚙️ Settings"]];

export function startApp() {
  window.addEventListener("error", (ev) => {
    try {
      if (document.getElementById("app-crash")) return;
      const src = String(ev.filename || "");
      const ours = /ai-quiz-web|studypro989|localhost|assets\/index-/.test(src);
      const d = document.createElement("div");
      d.id = "app-crash";
      d.style.cssText = "position:fixed;left:10px;right:10px;bottom:76px;z-index:99;background:#fef2f2;border:1.5px solid #f3b8b8;border-radius:14px;padding:12px 14px;font-size:13px;color:#991b1b";
      d.innerHTML = `<b>⚠️ Page error:</b> ${String(ev.message || "unknown").slice(0, 160)} <button id="app-crash-x" style="float:right">✕</button><div class=mut>${ours ? "Hard-refresh (Ctrl+Shift+R). If it repeats, screenshot this." : "This error comes from a browser extension, not the app — try Incognito (extensions off) to confirm."}</div>`;
      document.body.appendChild(d);
      document.getElementById("app-crash-x").onclick = () => d.remove();
    } catch (_) {}
  });
  document.body.classList.toggle("dark", store.settings().theme === "dark");
  const app = document.getElementById("app");
  app.innerHTML = `<aside><div class="logo">🎓 Quiz<span>Trainer</span></div><nav id="side"></nav><div class="side-foot">Self-paced practice<br>No timers, just learning.</div></aside><main id="view"></main><nav class="mob" id="mob"></nav>`;
  const side = app.querySelector("#side"), mob = app.querySelector("#mob"), view = app.querySelector("#view");
  const route = () => {
    const h = location.hash || "#/dashboard";
    const links = NAV.map(([href, label]) => `<a href="${href}" class="${h.startsWith(href) ? "active" : ""}">${label}</a>`).join("");
    side.innerHTML = links; mob.innerHTML = links;
    window.scrollTo(0, 0);
    if (h.startsWith("#/create")) {
      let prefill = null;
      try { prefill = JSON.parse(sessionStorage.getItem("quizapp.prefill") || "null"); sessionStorage.removeItem("quizapp.prefill"); } catch {}
      renderCreate(view, { prefill });
    }
    else if (h.startsWith("#/quiz/")) renderRunner(view, h.split("/")[2]);
    else if (h.startsWith("#/quizzes")) renderQuizzes(view);
    else if (h.startsWith("#/performance")) renderPerformance(view);
    else if (h.startsWith("#/settings")) renderSettings(view);
    else renderDashboard(view);
  };
  window.addEventListener("hashchange", route);
  route();
}
