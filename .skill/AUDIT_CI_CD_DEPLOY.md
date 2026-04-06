# Skill: CI/CD Pipeline - Railway + Cloudflare Pages

> **Project:** TransporteRioLavayen TMS  
> **Created:** 2026-04-06  
> **Stack:** React + Vite (Frontend) | Express.js + TypeScript (Backend) | Railway + Cloudflare Pages (Deploy)

---

## Overview

This skill defines the CI/CD pipeline for deploying a full-stack application with:
- **Backend** → Railway (Node.js/Express)
- **Frontend** → Cloudflare Pages (React/Vite)
- **CI/CD** → GitHub Actions with approval gates

---

## Branch Strategy

| Branch | Environment | Auto-Deploy | Requires Approval |
|--------|-------------|-------------|-------------------|
| `desarrollo` | Staging | ✅ Yes | ❌ No |
| `main` | Production | ✅ Yes | ✅ Yes |
| `produccion` | Production | ✅ Yes | ✅ Yes |

---

## Architecture

```
┌─────────────┐     ┌─────────────┐
│   GitHub    │     │   GitHub    │
│   Backend   │     │   Frontend  │
│  Workflow   │     │  Workflow   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   Railway   │     │  Cloudflare │
│  (Backend)  │     │   Pages     │
└─────────────┘     └─────────────┘
```

---

## Backend Deployment (Railway)

### Configuration Files

| File | Purpose |
|------|---------|
| `railway.json` | Railway project config |
| `backend/.nvmrc` | Node.js version (18) |
| `backend/package.json` | Scripts: build, start |

### Railway Config

```json
{
  "$schema": "https://railway.app/schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install && npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "startCommand": "cd backend && npm start"
  }
}
```

### Environment Variables (Railway)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `CLERK_SECRET_KEY` | Clerk secret key (sk_live_...) |
| `NODE_ENV` | production |

### Root Directory

Set `Root Directory` to `backend` in Railway dashboard.

---

## Frontend Deployment (Cloudflare Pages)

### Configuration Files

| File | Purpose |
|------|---------|
| `frontend/public/_headers` | Security headers |
| `frontend/public/_redirects` | SPA routing |
| `frontend/vite.config.ts` | Vite configuration |

### Cloudflare Pages Settings

| Setting | Value |
|---------|-------|
| Framework preset | None |
| Build command | `npm run build` |
| Build output | `dist` |
| Root directory | `frontend` |

### Environment Variables (Cloudflare Pages)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Railway backend URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (pk_live_...) |

---

## GitHub Actions Workflows

### Backend Workflow

**File:** `.github/workflows/backend-railway.yml`

```yaml
name: Deploy Backend to Railway

on:
  push:
    branches: [main, produccion, desarrollo]
    paths: [backend/**]

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/desarrollo'
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: railway deploy

  deploy-production:
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/produccion'
    environment: production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: railway deploy
```

### Frontend Workflow

**File:** `.github/workflows/frontend-cloudflare.yml`

```yaml
name: Deploy Frontend to Cloudflare Pages

on:
  push:
    branches: [main, produccion, desarrollo]
    paths: [frontend/**]

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/desarrollo'
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ vars.VITE_API_URL }}
      - name: Deploy
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-production:
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/produccion'
    environment: production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: npm run build
      - name: Deploy
        uses: cloudflare/pages-action@v1
```

---

## Required Secrets & Variables

### GitHub Secrets

| Secret | Service | Where to Find |
|--------|---------|---------------|
| `RAILWAY_TOKEN` | Railway | Account Settings → Tokens |
| `RAILWAY_PROJECT_ID` | Railway | Project Settings |
| `CLOUDFLARE_API_TOKEN` | Cloudflare | Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | Dashboard → Overview |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk | Dashboard → API Keys |

### GitHub Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://transporteriolavayen.up.railway.app` |
| `CLOUDFLARE_PAGES_PROJECT` | Pages project name |

---

## GitHub Environments Setup

### Production Environment
1. Go to **Repository Settings → Environments**
2. Create `production`
3. Set branches: `main`, `produccion`
4. Add required reviewers (1+)

### Staging Environment
1. Create `staging`
2. Set branch: `desarrollo`
3. No reviewers required

---

## Deployment Flow

### Development Flow (no approval)
```
push to desarrollo → deploys to Railway Staging + Cloudflare Preview
```

### Production Flow (requires approval)
```
push to main/produccion → requires approval → deploys to Railway Production + Cloudflare Production
```

---

## Troubleshooting

### Backend not deploying to Railway
- Check Root Directory is set to `backend`
- Verify `railway.json` is in project root
- Ensure `npm run build` doesn't have TypeScript errors (use `--noEmitOnError false`)

### Frontend not deploying to Cloudflare Pages
- Check Root Directory is set to `frontend`
- Verify `VITE_API_URL` is set correctly
- Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set (with VITE_ prefix)

### API not working in production
- Verify CORS allows the Cloudflare Pages domain
- Check Railway environment variables are set
- Verify backend is responding to `/api/health`

---

## Related Files

- `.github/workflows/backend-railway.yml`
- `.github/workflows/frontend-cloudflare.yml`
- `.github/CI-CD.md`
- `backend/railway.json`
- `backend/package.json`
- `frontend/vite.config.ts`
- `frontend/public/_headers`
- `frontend/public/_redirects`
