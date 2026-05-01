# Security Features

This application implements multiple layers of security to prevent abuse and DDoS attacks.

## Rate Limiting

All API endpoints are protected with rate limiting:

- **Registration**: 5 attempts per hour per IP
- **Payment Submission**: 3 submissions per hour per IP
- **Key Redemption**: 5 redemptions per hour per IP
- **HWID Reset**: 10 resets per hour per IP
- **Admin Operations**: 30 operations per minute per IP

Rate limits return HTTP 429 with `Retry-After` headers when exceeded.

## Input Validation

### Registration
- Email: Max 255 chars, valid email format
- Username: Max 50 chars, alphanumeric + underscore/hyphen only
- Password: 6-128 chars

### Payment Submission
- Plan: Must be one of: weekly, monthly, lifetime
- Payment Method: Must be one of: qris, paypal, robux
- Proof File: Max 10MB, images only

### Key Redemption
- Key Format: Must match `KEY_[128 hex chars]`
- One license per account

## Authentication

### User Endpoints
- Protected with NextAuth JWT tokens
- Session-based authentication
- Automatic token refresh

### Admin Endpoints
- Dual authentication: JWT OR Admin API Key
- Admin API Key via `x-admin-api-key` header
- Used for Discord webhook button actions

## Environment Variables

**Required for production:**
```bash
# Generate strong random keys
NEXTAUTH_SECRET="<random-64-char-string>"
ADMIN_API_KEY="<random-64-char-string>"

# Never commit these to git
VONALIA_API_KEY="<your-vonalia-key>"
DISCORD_WEBHOOK_URL="<your-webhook-url>"
DATABASE_URL="<your-database-url>"
```

## Best Practices

1. **Never expose API keys** in client-side code
2. **Use environment variables** for all secrets
3. **Enable HTTPS** in production (Vercel does this automatically)
4. **Monitor rate limit logs** for suspicious activity
5. **Rotate admin API key** periodically
6. **Use Supabase connection pooler** for serverless (not direct connection)

## Deployment Checklist

- [ ] Set all environment variables in Vercel
- [ ] Generate strong random NEXTAUTH_SECRET
- [ ] Generate strong random ADMIN_API_KEY
- [ ] Configure Discord webhook URL
- [ ] Test rate limiting works
- [ ] Verify admin authentication
- [ ] Check database connection pooling
- [ ] Enable Vercel Analytics (optional)

## Reporting Security Issues

If you discover a security vulnerability, please email: [your-email]

Do not create public GitHub issues for security vulnerabilities.
