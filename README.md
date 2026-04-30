<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/47db1037-e64d-4f3b-9a27-9936643c7d75

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy the Cloudflare Worker (sync + Visa rate proxy)

The worker in `cloudflare-worker.js` exposes:
- `GET  /?from=TWD&to=KRW` → Visa exchange-rate proxy
- `POST /sync` → save a trip `{ code, data }`
- `GET  /sync/:code` → load a trip

Setup (one-time):
1. `npm i -g wrangler`
2. On Cloudflare dashboard → Workers → KV: create a namespace named `travel-trips`, copy its ID into `wrangler.toml` (`kv_namespaces.id`).
3. `wrangler login`
4. `wrangler deploy`

Tail logs while debugging: `wrangler tail`.
