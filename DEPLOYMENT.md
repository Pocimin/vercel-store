# Deployment

This project is intended to run on the VPS as:

- `web` - admin/customer panel
- `api` - auth, admin, script monitoring, script raw endpoints
- `worker` - script obfuscation and publishing
- `bot` - Discord bot process
- `postgres`
- `redis`
- `nginx`

## Security First

The old root password was pasted into chat and must be rotated before production. Create a deploy user, use SSH keys, and disable password login/root login before public launch.

## Expected VPS Layout

```text
/opt/nznt/
  nznt-platform/
  Prometheus-master/
```

`docker-compose.prod.yml` mounts `../Prometheus-master` into the worker container so uploads can be obfuscated with the local Prometheus source.

## Required `.env`

Copy `.env.example` to `.env` and set strong secrets:

```bash
POSTGRES_PASSWORD=
DATABASE_URL=postgresql://nznt:<password>@postgres:5432/nznt_platform?schema=public
REDIS_URL=redis://redis:6379
PUBLIC_WEB_URL=https://nznt.store
PUBLIC_API_URL=https://api.nznt.store
SESSION_SECRET=
INTERNAL_SERVICE_TOKEN=
SCRIPT_SIGNING_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://api.nznt.store/auth/discord/callback
PROMETHEUS_PRESET=Medium
PUBLIC_TURNSTILE_SITE_KEY=
VITE_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

## Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api pnpm db:deploy
docker compose -f docker-compose.prod.yml exec api env ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='change-me' pnpm seed:admin
docker compose -f docker-compose.prod.yml ps
curl http://127.0.0.1/health
```

## One-Time VPS Bootstrap

After rotating the exposed root password, SSH into the VPS once and run:

```bash
cd /opt/nznt/nznt-platform
bash scripts/bootstrap-vps.sh
```

Install the Mac deploy public key into the deploy user:

```bash
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
echo '<paste ~/.ssh/nznt_vps_ed25519.pub here>' >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

Then deploy from the Mac:

```bash
cd "/Users/mac/untitled folder/nznt-platform"
NZNT_VPS_USER=deploy NZNT_VPS_KEY="$HOME/.ssh/nznt_vps_ed25519" bash scripts/deploy-vps.sh
```

## Script Upload Flow

1. Open the web panel.
2. Paste `INTERNAL_SERVICE_TOKEN`.
3. Upload a `.lua` file with a version.
4. API writes raw source to private storage.
5. Worker runs Prometheus with the configured preset.
6. Worker publishes the obfuscated result to `storage/builds/<fileName>`.
7. `https://scripts.nznt.store/raw.php?file=<fileName>` serves the published build.
