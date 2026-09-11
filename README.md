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
3. Note: Pages has no backend — but the app now works there anyway via **backend-free mode**: add your free Gemini key once in **Settings → My AI Key** (kept only in that browser, never uploaded). The published link then generates real quizzes straight from your browser, no server needed. For a shared backend instead, deploy on Render/HF and set repo secret `VITE_API_URL`.

**Alternative frontend hosts (Vercel or Netlify)**
1. Import the same repo; set root directory to `client`, build command `npm run build`, output `dist`.
2. Add env var `VITE_API_URL=https://ai-quiz-app.onrender.com` (your Render URL).
3. Deploy — full app live, keys stay on the backend where they belong.

## Avoiding Render's sleep delay (still free)
Render free sleeps after ~15 min idle. Easiest fix — keep it warm with a free pinger:
1. Deploy on Render as above.
2. Sign up free at https://uptimerobot.com → Add Monitor → Monitor Type HTTP(s) → URL `https://YOUR-APP.onrender.com/api/health` → interval 5 min → Create.
3. Done — pings keep the instance awake, quizzes start instantly. (This uses the built-in health endpoint; no code change needed.)

## Backend on Hugging Face Spaces (free, sleeps only after 48h idle)
1. Sign up at https://huggingface.co → **New Space** → name it `ai-quiz-app` → SDK **Docker** → Blank → Create.
2. Push this repo's code to the Space (in its page: **Files → Add file → Upload**, or `git push` to the Space remote).
3. Space **Settings → Repository secrets**: add `AI_API_KEY` and `GEMINI_API_KEY` (real keys, never in git).
4. The Space auto-builds (`Dockerfile` included) and goes live at `https://YOUR-USER-ai-quiz-app.hf.space` — full app + API together. Check `/api/health`.

## Other free backend options (no sleep)
- **Instant public link from your PC (free, no signup):** install `cloudflared` (`winget install cloudflare.cloudflared`), run `npm run dev` in one terminal and `cloudflared tunnel --url http://localhost:3001` in another — you get a public `https://…trycloudflare.com` link to the full app. Stays up while your PC is on; URL changes on restart.
- **Hugging Face Spaces (free, Docker):** New Space → Docker SDK → upload repo (`Dockerfile` included; set `AI_API_KEY`/`GEMINI_API_KEY` as Space secrets). Sleeps only after 48h idle.
- **Oracle Cloud Always-Free VM (free forever, never sleeps):** needs a cloud account + basic Linux setup — most work, but a real always-on server at zero cost.
- **Your own repo + `Dockerfile`/`render.yaml` included** work on Fly.io, Railway, Koyeb too if you ever outgrow free tiers.
