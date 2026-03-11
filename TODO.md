# Job Trail — Production Readiness TODO

Full audit of security, resilience, observability, and UX completeness before public launch.
Items are ordered by implementation priority within each severity tier.

---

## CRITICAL — Must fix before going public

### C1. CORS wildcard in Lambda responses overrides API Gateway policy
**File:** `backend/shared/middleware.ts` lines 13, 21, 29, 37, 45, 53
All 6 response helpers include `'Access-Control-Allow-Origin': '*'`. This means any origin
can read API responses, completely bypassing the `allowOrigins: ['https://jobtrail.dev']`
restriction set in `infra/lib/api-stack.ts:86`.
**Fix:** Remove the `Access-Control-Allow-Origin` header from all response helpers — API Gateway already handles CORS correctly.
**Estimate:** 15 min
**Status (2026-03-11): ✅ Completed** — wildcard CORS headers removed from all response helpers.

### C2. No 401 / session-expiry handling in the API client
**File:** `frontend/src/lib/api.ts`
When a Cognito JWT expires mid-session, the API returns 401 but the frontend shows a
generic "Request failed" error and the user stays stuck on the dashboard with stale data.
**Fix:** In the `request()` helper, detect `res.status === 401` and call `signOut()` + redirect to `/login`.
**Estimate:** 30 min
**Status (2026-03-11): ✅ Completed** — `request()` now signs out and redirects to `/login` on authenticated `401` responses.

### C3. No 404 catch-all route
**File:** `frontend/src/App.tsx`
Hitting any unknown URL (e.g. `/about`, `/typo`) renders a blank page. A `.not-found` CSS
class already exists in `index.css` but there is no `NotFound` component.
**Fix:** Add a `<Route path="*" element={<NotFound />} />` catch-all and create a simple `NotFound.tsx` page.
**Estimate:** 20 min
**Status (2026-03-11): ✅ Completed** — added `NotFound` page and catch-all route in `App.tsx`.

### C4. No DynamoDB Point-in-Time Recovery (PITR)
**File:** `infra/lib/data-stack.ts`
Table has `RETAIN` removal policy but no PITR and no backups. A runaway delete or
corruption event means permanent data loss.
**Fix:** Add `pointInTimeRecovery: true` to the Table construct.
**Estimate:** 5 min
**Status (2026-03-11): ✅ Completed** — table now has PITR enabled.

### C5. No monitoring or alerting
No CloudWatch alarms, dashboards, or SNS alerts exist anywhere in the CDK stacks.
Zero visibility into Lambda errors, API 5xx spikes, or DynamoDB throttles in production.
**Fix (minimum viable):** Add CloudWatch alarms in `infra/lib/api-stack.ts` for:
- Lambda error rate > 1% (all 4 functions)
- API Gateway 5xx count > 5/min
- DynamoDB throttled requests > 0
**Estimate:** 1–2 hrs
**Status (2026-03-11): ✅ Completed** — added CloudWatch alarms for all 4 Lambda error rates (>1%), HTTP API 5xx (>5/min), and DynamoDB throttles (>0), wired to an SNS alerts topic.

### C6. No API rate limiting
No throttling on API Gateway, no WAF, no per-user limits. The API is open to abuse and
brute-force on the Cognito auth endpoints.
**Fix:** Add `defaultThrottleSettings` to the `HttpApi` in `api-stack.ts`
(e.g. `burstLimit: 50, rateLimit: 20`). Optionally attach a WAF WebACL to CloudFront.
**Estimate:** 15 min
**Status (2026-03-11): ✅ Completed** — configured HTTP API `$default` stage throttling (`burstLimit: 50`, `rateLimit: 20`).

### C7. No account deletion (GDPR)
**File:** `frontend/src/pages/Settings.tsx`
Users have no way to delete their account or data. This is a legal requirement under GDPR
and CCPA for any site with EU/CA users.
**Fix:** Add a "Delete Account" section to Settings that calls a new `DELETE /profile`
Lambda endpoint which deletes all `USER#<id>` items from DynamoDB and calls
Cognito `AdminDeleteUser`.
**Estimate:** half day
**Status (2026-03-11): ✅ Completed** — added UI delete flow in Settings, `DELETE /profile` API client/hook route, backend data purge, and Cognito `AdminDeleteUser`.

### C8. No tests run in CI/CD
**File:** `.github/workflows/deploy.yml`
There is no `npm test` step. Every push to main deploys straight to production with no
automated validation. The backend has Jest configured (`backend/package.json`) but it's
never invoked.
**Fix:** Add a pre-deploy job that runs `npm test` for backend and `tsc --noEmit` + lint
for frontend. Fail the deploy if any step fails.
**Estimate:** 30 min
**Status (2026-03-11): ✅ Completed** — added `validate` CI job that runs backend tests, frontend typecheck, and frontend lint before deployment.

---

## MEDIUM — Fix soon after launch

### M1. No password reset flow
`frontend/src/pages/Login.tsx` has no "Forgot password?" link. Users who forget their
password are permanently locked out. AWS Amplify's `resetPassword` / `confirmResetPassword`
APIs are available and ready to use.
**Fix:** Add a `ForgotPassword.tsx` page and link to it from the Login form.
**Estimate:** half day
**Status (2026-03-11): ✅ Completed** — added forgot-password route and two-step reset flow using Amplify `resetPassword` + `confirmResetPassword`.

### M2. Missing SEO and Open Graph meta tags
**File:** `frontend/index.html`
The `<head>` has only a title and viewport. No `<meta name="description">`,
`og:title`, `og:description`, `og:image`, `twitter:card`, or `<link rel="canonical">`.
This means poor search rankings and ugly link previews when shared.
**Fix:** Add standard meta tags to `index.html`.
**Estimate:** 30 min
**Status (2026-03-11): ✅ Completed** — added description, Open Graph, Twitter, and canonical meta tags.

### M3. No Privacy Policy or Terms of Service
No legal pages exist and no routes point to them. Required for any public-facing product
that collects user data (email + job search history).
**Fix:** Add `/privacy` and `/terms` routes with basic pages.
**Estimate:** depends on content
**Status (2026-03-11): ✅ Completed** — added Privacy and Terms pages, routes, and footer links.

### M4. Lambda memory defaults to 128 MB
**File:** `infra/lib/api-stack.ts` (`commonLambdaProps`)
Memory is not specified, so all 4 Lambdas run with Node.js 18 in 128 MB — this causes
slow cold starts and OOM risk. AWS recommends 512–1024 MB for typical Node.js workloads.
**Fix:** Add `memorySize: 512` to `commonLambdaProps`.
**Estimate:** 5 min
**Status (2026-03-11): ✅ Completed** — all API Lambdas now set to `memorySize: 512`.

### M5. Weak password policy
**File:** `infra/lib/auth-stack.ts` lines 20–26
Passwords only require 8 chars, lowercase, and digits. No uppercase or symbols required.
**Fix:** Set `requireUppercase: true, requireSymbols: true`.
**Estimate:** 5 min
**Status (2026-03-11): ✅ Completed** — Cognito password policy now requires uppercase and symbols.

### M6. No structured logging — hard to debug production issues
All Lambda error logging is bare `console.error(e)` with no request ID, user ID, or
operation context. Impossible to correlate errors across functions in CloudWatch.
**Fix:** Add a minimal log wrapper that includes `{ requestId, userId, operation, error }`
in each `catch` block.
**Estimate:** 1 hr
**Status (2026-03-11): ✅ Completed** — added shared structured error logger and integrated it in all Lambda handlers.

### M7. No global React error boundary
**File:** `frontend/src/main.tsx`
Unhandled render errors crash the entire app with a blank screen. No error boundary exists.
**Fix:** Wrap `<App />` in a simple `ErrorBoundary` component that shows a friendly
"Something went wrong" message.
**Estimate:** 30 min
**Status (2026-03-11): ✅ Completed** — app now renders inside a global `ErrorBoundary`.

---

## LOW — Polish before or shortly after launch

### L1. Icon-only buttons use `title` not `aria-label`
**Files:** `ApplicationsTable.tsx`, `InterviewCalendar.tsx`
`title` tooltips are not read by all screen readers. `aria-label` is the correct attribute
for icon-only buttons.

### L2. Error alert divs lack `role="alert"`
Dynamically injected error messages (`.alert--error`) are not announced by screen readers
because they lack `role="alert"` or `aria-live="polite"`.

### L3. Form inputs lack `aria-invalid` on error state
When a form shows an error, the relevant inputs should have `aria-invalid="true"` so screen
readers know which field is in error.

### L4. No max-length validation on text inputs
Company name, job title, and display name have no `maxLength` attribute. A user could
submit multi-KB strings that DynamoDB will happily store, degrading display quality.
**Fix:** Add `maxLength={100}` to company/title inputs, `maxLength={200}` to link.

### L5. No CSP / security headers on CloudFront
**File:** `infra/lib/hosting-stack.ts`
No `Content-Security-Policy`, `X-Frame-Options`, or `X-Content-Type-Options` headers are
set on CloudFront responses.
**Fix:** Add a CloudFront ResponseHeadersPolicy with standard security headers.

### L6. No data export
Users cannot download their data. Not strictly required but expected by privacy-conscious
users and is a good-faith GDPR measure alongside account deletion.

### L7. `backdrop-filter: blur()` not supported in all browsers
**File:** `frontend/src/index.css`
Used on the modal overlay. Falls back gracefully (modal still visible) but worth noting.

---

## Already Good ✓
- No hardcoded secrets or API keys in source
- DynamoDB queries are parameterized (no injection risk)
- All routes properly scoped to `USER#<userId>` — no cross-user data access
- JWT authorizer enforced on all private routes; public endpoint is read-only
- CloudFront enforces HTTPS, blocks public S3 access
- TypeScript strict mode on frontend, backend, and infra
- S3 bucket has `BlockPublicAccess.BLOCK_ALL`
- Error responses return generic messages (no stack traces leaked)
- SPA 404→200 rewrite in CloudFront for React Router
- www → apex 301 redirect at the edge

---

## Priority Order for Implementation
1. ✅ C1–C8 completed on 2026-03-11
2. ✅ M1–M7 completed on 2026-03-11
3. L1–L7 (polish) — 2–3 hrs total
