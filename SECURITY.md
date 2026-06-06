# Security Model

Mindful Prep is designed with defense in depth. Below is the threat model
and the mitigations we apply.

## Threat model

| Threat | Mitigation |
| --- | --- |
| Account takeover | No accounts — open access, no passwords, no sessions |
| Cross-site scripting (XSS) | Input sanitisation (`sanitizeText`), `react` auto-escapes, CSP `script-src 'self'` |
| Cross-site request forgery (CSRF) | All `/api/*` mutations are JSON `POST` with a same-origin policy enforced by CSP `form-action 'self'` |
| Clickjacking | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| Man-in-the-middle | HSTS `max-age=63072000; includeSubDomains; preload` + `upgrade-insecure-requests` |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| Information leakage | `Referrer-Policy: strict-origin-when-cross-origin`, COOP/COEP |
| Denial of service | Per-IP rate limit on every API route, `bodySizeLimit: 1mb` |
| Sensitive data exposure | No PII collected, no analytics, no third-party trackers |
| Process injection | No `eval`, no remote code, Zod-validated inputs |

## Headers applied to every response

```text
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
X-DNS-Prefetch-Control: on
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
```

## Rate limits

| Endpoint | Window | Max requests |
| --- | --- | --- |
| `/api/mood` GET | 60s | 30 |
| `/api/mood` POST | 60s | 20 |
| `/api/stress` GET | 60s | 30 |
| `/api/stress` POST | 60s | 30 |
| `/api/journal` GET | 60s | 30 |
| `/api/journal` POST | 60s | 10 |
| `/api/wellness` GET | 60s | 30 |
| `/api/analytics` GET | 60s | 30 |
| `/api/suggestions` GET | 60s | 30 |
| Global per-IP | 60s | 60 |

When the limit is exceeded the API returns `429 Too Many Requests` with
`Retry-After` and `X-RateLimit-Reset` headers.

## Input validation

Every API route uses a Zod schema to validate the body. Unknown fields
are stripped, type mismatches return `400 Bad Request` with a structured
error payload. The same Zod schemas power both server-side validation
and the inferred TypeScript types for the response.

## Sanitisation

The `sanitizeText` helper strips:

- `<script>…</script>` blocks
- `<style>…</style>` blocks
- All remaining HTML tags
- `javascript:` / `vbscript:` / `data:text/html` URI protocols
- Inline event handlers like `onclick="…"`
- Decodes common HTML entities to their literal characters

## Data storage

- **In-memory store** (default for the open-access demo). Data resets on
  cold start. The store is namespaced under `globalThis.__mwMemoryStore`
  and is never written to disk.
- **SQLite (optional)** for local development via Prisma.
- **localStorage** on the client mirrors the most recent entries so the
  demo feels persistent between cold starts.

No analytics, no third-party tracking, no cookies, no fingerprinting.

## Responsible disclosure

If you find a security issue, please email `security@mindfulprep.app`
(demo address). We will respond within 48 hours.
