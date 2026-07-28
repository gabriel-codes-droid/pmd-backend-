# PMD — Deploy guide

Frontend on **Vercel** (static), backend on **Render** (Node service), DB on **MongoDB Atlas** (free M0).

## 1. Database — MongoDB Atlas (free)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free M0 cluster
3. Database Access → add a user with read/write
4. Network Access → allow `0.0.0.0/0` (so Render can reach it)
5. Get the connection string, looks like:
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/pmd?retryWrites=true&w=majority`
6. Save it — this is `MONGO_URI` for the backend

## 2. Backend — Render

1. New → Web Service → connect `gabriel-codes-droid/pmd-backend-` repo
2. Render auto-detects `render.yaml`. Click "Apply".
3. Set env vars in the Render dashboard (not in .env):
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = a 32+ char random string (use `openssl rand -hex 32`)
   - `CORS_ORIGINS` = your Vercel frontend URL (you'll set this after step 3)
   - `ADMIN_PASSWORD` = something stronger than the dev default
4. Wait for deploy. Note the URL, e.g. `https://pmd-backend.onrender.com`
5. Seed admin: open Render Shell → run `npm run seed`
6. Test: `curl https://pmd-backend.onrender.com/api/health` → should return `{ok:true,...}`

## 3. Frontend — Vercel

1. New Project → import `gabriel-codes-droid/personal-management-dashboard-frontend`
2. Framework preset: **Vite**
3. Build command: `npm run build` (default)
4. Output directory: `dist` (default)
5. Environment Variables:
   - `VITE_API_URL` = `https://pmd-backend.onrender.com/api`
6. Deploy
7. Copy the vercel URL → go back to Render → set `CORS_ORIGINS=https://<your-vercel-app>.vercel.app` → redeploy

## 4. Verify end-to-end

- Open the Vercel URL in browser
- Sign up a new user
- Confirm the request hits Render (Render dashboard → Logs)
- Login, see dashboard, meals, finance, etc.
- If you see a CORS error in browser console: you forgot to set `CORS_ORIGINS` on Render, or it doesn't match the Vercel URL exactly (no trailing slash)

## Free tier caveats

- Render free tier sleeps after 15 min idle. First request takes ~30s to wake up.
- MongoDB Atlas M0 = 512MB storage. Plenty for a portfolio project.
- Vercel hobby = unlimited static deploys, 100GB bandwidth/mo.
