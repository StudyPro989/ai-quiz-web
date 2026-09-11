# AI Quiz & Self-Training App

Self-paced (no timer) quiz trainer. Frontend → Express backend → Groq AI → validated JSON → interactive practice.

## Setup
```powershell
cd quiz-app
cp .env.example .env   # then edit AI_API_KEY (or copy key from Practice/Groq.txt into server .env)
npm run install:all
```
Copy the key into `server/.env` too (server reads `server/.env`? No — root `.env` is loaded via dotenv cwd; simplest: put `.env` in BOTH root and `server/` or set env var). Easiest:
```powershell
Copy-Item .env.example server\.env
# edit server\.env -> AI_API_KEY=...
```

## Run (one command)
```powershell
cd quiz-app
npm run dev     # builds frontend + serves everything at http://localhost:3001
```
Open **http://localhost:3001** — frontend and API run from this single server.

Hot-reload dev (two terminals) instead:
```powershell
npm run dev:server   # http://localhost:3001 (/api/health)
npm run dev:client   # http://localhost:5173 (proxies /api to :3001)
```
Vite proxies `/api` → `localhost:3001`. Or set `VITE_API_URL=http://localhost:3001` in `client/.env`.

If the AI is unreachable the server returns a clear error (no demo content — every quiz is real AI-generated).

## Config
- Classes/subjects/chapters: `client/src/data/curriculum.js`
- Models: `ALLOWED_MODELS` in `server/.env`, dropdown in Create + Settings
- Storage: `localStorage` (`quizapp.*`), ready to swap for Firebase later

## Pushing to GitHub safely
Secrets stay out of git automatically: `.gitignore` blocks `*.env`, `Groq.txt`, `node_modules/`, `dist/`. Only `.env.example` (no real key) is committed.
```powershell
cd quiz-app
git init; git add .; git status      # confirm NO .env file is listed
git commit -m "AI quiz app"
gh repo create ai-quiz-app --private --source=. --push   # or push to your remote
```
After cloning elsewhere: `Copy-Item .env.example server\.env`, add your key, `npm run install:all`, `npm run dev`.
API protections: key server-side only, per-IP rate limit (`GEN_LIMIT_PER_HOUR`), optional origin lock (`ALLOWED_ORIGINS`), small JSON body cap, no `X-Powered-By` header.

## Publishing online (why GitHub Pages alone shows only the README)
GitHub Pages hosts **static files only** — it cannot run the Node backend, and `client/dist/` isn't even pushed (it's git-ignored). So a Pages site from this repo just renders the README. Publish properly instead:

**Backend (1 click, free): Render**
1. Push `quiz-app/` contents to GitHub (see above).
2. Go to https://dashboard.render.com → New → Blueprint → select your repo (`render.yaml` is included).
3. Add secret env vars when prompted: `AI_API_KEY`, `GEMINI_API_KEY`.
4. You get a live API, e.g. `https://ai-quiz-app.onrender.com` (`/api/health` to check).

**Frontend on GitHub Pages (app UI on a public link)**
A workflow (`.github/workflows/pages.yml`) is included — push to `main` and it builds `client/` automatically.
1. On GitHub: repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Your app link becomes `https://YOUR-USERNAME.github.io/REPO-NAME/` (no README — the real UI).
3. Note: Pages has no backend, so generating shows a clear "AI server not connected" notice until you connect one: deploy the backend on Render, then add repo secret `VITE_API_URL` = your Render URL (**Settings → Secrets → Actions**) and re-run the workflow — the same public link then generates real quizzes.

**Alternative frontend hosts (Vercel or Netlify)**
1. Import the same repo; set root directory to `client`, build command `npm run build`, output `dist`.
2. Add env var `VITE_API_URL=https://ai-quiz-app.onrender.com` (your Render URL).
3. Deploy — full app live, keys stay on the backend where they belong.
