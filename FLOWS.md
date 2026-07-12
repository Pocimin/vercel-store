# NZNT Platform Flows

## Customer Purchase

1. User registers or logs in on the web panel.
2. User opens `Purchase`.
3. User selects plan/method/amount and uploads payment proof.
4. API creates a `Payment` with status `PENDING`.
5. Discord admin webhook is notified if `DISCORD_ADMIN_WEBHOOK_URL` is set.
6. Admin opens `Admin -> Payment approvals`.
7. Admin approves the pending payment.
8. API creates a license, links it to the payment, marks payment `APPROVED`, and writes an audit log.
9. API emails the license key to the user if SMTP env vars are configured.
10. If SMTP is not configured, the email is printed to server logs as a fallback.

## Discord Approval

The bot can approve an existing pending payment:

```text
!approve <paymentId>
```

The Discord user must be linked in the database as `SUPPORT`, `ADMIN`, or `OWNER`.

## User Monitoring

The user dashboard shows:

- license status
- payment history
- recent script sessions
- script file
- executor
- Roblox username
- Roblox user id
- last heartbeat time

The Roblox username/user id comes from `nznt_script_monitor.lua` during script handshake.

## Admin Monitoring

The admin dashboard shows:

- active sessions
- queued obfuscation builds
- scripts/build statuses
- recent script events
- user identity
- Roblox account identity from device/session records

## Script Upload / Obfuscation

1. Admin uploads Lua source.
2. API stores raw source privately in `SCRIPT_RAW_ROOT`.
3. API queues `ScriptBuild`.
4. Worker runs Prometheus using `PROMETHEUS_PRESET`.
5. Worker publishes obfuscated output into `SCRIPT_ARTIFACT_ROOT`.
6. `scripts.nznt.store/raw.php?file=<file.lua>` serves the active artifact.

## Admin 2FA

Admin 2FA is TOTP-based:

- `POST /auth/admin/2fa/setup`
- `POST /auth/admin/2fa/enable`

After enabled, login requires a valid TOTP code.
