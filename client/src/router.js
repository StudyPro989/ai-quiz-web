import { renderDashboard } from "./pages/dashboard.js";
import { renderCreate } from "./pages/create.js";
import { renderRunner } from "./pages/runner.js";
import { renderQuizzes } from "./pages/quizzes.js";
import { renderPerformance } from "./pages/performance.js";
import { renderSettings } from "./pages/settings.js";
import { store } from "./lib/store.js";

const NAV = [["#/dashboard", "🏠 Dashboard"], ["#/create", "➕ Create Quiz"], ["#/quizzes", "📚 My Quizzes"], ["#/performance", "📊 Performance"], ["#/settings", "⚙️ Settings"]];

export function startApp() {
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
