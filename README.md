# NZNT Platform

Clean rebuild workspace for the website, API, bot, script monitoring, and obfuscation pipeline.

## Apps

- `apps/api` - Fastify API for auth, licenses, scripts, admin, monitoring.
- `apps/web` - new customer/admin frontend.
- `apps/bot` - Discord bot integration against the same database.
- `apps/worker` - background jobs such as obfuscation and publishing.

## Packages

- `packages/db` - Prisma schema and shared database client.
- `packages/auth` - password, sessions, roles, and service-token helpers.
- `packages/contracts` - shared API types.
- `packages/script-protocol` - script handshake, heartbeat, and command contracts.

## First-Time Local Setup

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm db:generate
pnpm db:migrate
pnpm --filter @nznt/api dev
```

Do not deploy with the current VPS password that was pasted in chat. Rotate it, create a deploy user, add SSH keys, then disable password login.
