# Vercel Deployment Guide

## Prerequisites
- Neon PostgreSQL project with the schema migrated
- Vercel account linked to this repository

## Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Neon connection string (pooled) | `postgresql://...` |
| `NEXTAUTH_SECRET` | Random 32-byte base64 secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL of the app | `https://alma.vercel.app` |

## Steps

1. Push code to `main` branch — Vercel auto-deploys
2. Go to Vercel → Project → Settings → Environment Variables and add all three above
3. Redeploy once if variables were added after the initial deploy

## Local development

```bash
cp .env.example .env.local
# fill in values, then:
npm run dev -- -p 3001
```

## Database migration

```bash
npx drizzle-kit push
```
