# Environment Setup (Local + Render)

## 1) Local development

### Server (`server/.env`)
- `PORT=5000`
- `NODE_ENV=development`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `CORS_ORIGINS=http://localhost:5173`

### Client (`client/.env`)
- `VITE_API_URL=http://localhost:5000`

## 2) Render backend service env vars

Set these in Render for your backend service:
- `PORT=10000` (or Render default)
- `NODE_ENV=production`
- `MONGO_URI=<your atlas connection string>`
- `JWT_SECRET=<long random secret>`
- `CORS_ORIGINS=http://localhost:5173,https://<your-frontend-domain>`
- `ENABLE_CUSTOM_DNS=false`
- `DNS_SERVERS=8.8.8.8,1.1.1.1`
- `MONGO_SERVER_SELECTION_TIMEOUT_MS=10000`
- `MONGO_RETRY_DELAY_MS=2000`
- `MONGO_MAX_RETRY_DELAY_MS=30000`
- `MONGO_CONNECT_MAX_RETRIES=10`

## 3) Frontend deployment env var

Wherever frontend is deployed, set:
- `VITE_API_URL=https://<your-render-backend>.onrender.com`

## 4) Quick verification

After deploying backend:
1. `GET https://<backend>/health` should return JSON.
2. `POST https://<backend>/auth/login` should return JSON (not HTML).
3. Frontend console should log `Using API base URL: ...` with the correct backend URL.
