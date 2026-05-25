# StudentOS AI — Security & Performance

Production-oriented practices implemented in this codebase.

## Security

### Authentication

| Control | Implementation |
|---------|----------------|
| Password hashing | bcrypt via passlib (72-byte safe truncation) |
| JWT | HS256 with `sub`, `exp`, `iat`, `type: access` |
| Token validation | Algorithm allowlist, max token length, UUID validation |
| Brute-force mitigation | Rate limit `10/minute` on login & signup per IP |

### API hardening

| Control | Implementation |
|---------|----------------|
| Rate limiting | SlowAPI middleware + per-route limits (auth, chat, upload, AI plan) |
| CORS | Explicit origins from env; restricted methods/headers |
| Security headers | `X-Frame-Options`, `nosniff`, `Referrer-Policy`, HSTS in production |
| Trusted hosts | `TrustedHostMiddleware` when `ALLOWED_HOSTS` set in production |
| Error handling | Generic 500 messages in production; no stack traces to clients |
| OpenAPI | Disabled in production (`ENVIRONMENT=production`) |
| Upload safety | Extension allowlist, max size, filename sanitization |
| SQL injection | SQLAlchemy parameterized queries only |
| AI errors | Sanitized via `safe_error_message()` |

### AI / content security

| Control | Implementation |
|---------|----------------|
| Prompt injection | Phrase filtering in `sanitize_user_input()` |
| Markdown XSS | `rehype-sanitize` strict schema (no script/iframe) |
| Mermaid | `securityLevel: strict`, max chart length |
| RAG isolation | User-scoped document search only |

### Frontend

| Control | Implementation |
|---------|----------------|
| CSP | Content-Security-Policy in `next.config.ts` |
| Token storage | localStorage via Zustand persist — **mitigate XSS** via CSP + sanitization |
| Fetch timeouts | 30s API / 120s stream via `AbortSignal.timeout` |
| `poweredByHeader` | Disabled |

### Production checklist

```env
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<64+ char random string>
GEMINI_API_KEY=<key>
CORS_ORIGINS=https://your-app.vercel.app
ALLOWED_HOSTS=api.yourdomain.com
AUTO_CREATE_TABLES=false
```

Run DB migrations via `supabase/schema*.sql` instead of auto-create in production.

---

## Performance

### Backend

| Optimization | Implementation |
|--------------|----------------|
| Connection pooling | `pool_size=5`, `max_overflow=10`, `pool_recycle=1800` |
| Pool health | `pool_pre_ping=True` |
| GZip | Responses > 1KB compressed |
| SQL echo | Off in production |
| Async I/O | FastAPI + async SQLAlchemy throughout |
| SSE streaming | No buffering header `X-Accel-Buffering: no` |
| Embeddings | Lazy-loaded model, thread pool execution |

### Frontend

| Optimization | Implementation |
|--------------|----------------|
| Code splitting | Dynamic import for Mermaid diagrams |
| React Strict Mode | Enabled |
| Image formats | AVIF/WebP preference |
| Compression | Next.js `compress: true` |
| TanStack Query | 60s stale time, minimal refetch |
| Build | Static pages where possible |

### Recommended production tuning

- **Supabase**: Use connection pooler URL for serverless (port 6543)
- **Render/Railway**: Set `WEB_CONCURRENCY=1` on free tier; scale pool accordingly
- **Vercel**: Use edge only for static assets; API on separate backend
- **pgvector**: Add IVFFlat index after 100+ chunks (see `schema.sql`)

---

## Threat model notes

**Not in scope for MVP** (future improvements):

- HttpOnly cookie sessions (requires BFF or same-domain proxy)
- Refresh tokens / token rotation
- 2FA
- WAF / DDoS protection (use Cloudflare or platform edge)
- Audit logging to external SIEM

**Student responsibility**: Never commit `.env` files; rotate `SECRET_KEY` if leaked.
