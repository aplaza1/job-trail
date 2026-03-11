# CLAUDE.md — AI Assistant Context for Job Trail

This file gives Claude (and other AI assistants) context about this project's conventions, architecture, and working patterns. **Update this file whenever you make architectural changes, add features, or establish new conventions.**

## Project Overview

Job Trail is a serverless job application tracker. Stack: React + Vite (frontend), AWS Lambda + Node.js 18 (backend), DynamoDB (database), API Gateway HTTP API, Cognito (auth), CloudFront (CDN), Route 53 (DNS), ACM (TLS), CDK v2 TypeScript (IaC).

Live at: https://jobtrail.dev

## Repository Structure

```
job-trail/
├── frontend/        React SPA (Vite, TypeScript)
├── backend/         Lambda handlers (esbuild-bundled)
├── infra/           CDK stacks (TypeScript)
└── .github/         GitHub Actions CI/CD
```

## Architecture Decisions

- **Single-table DynamoDB**: PK=`USER#<userId>`, SK prefixes: `APP#` (applications), `INT#` (interviews), `PROFILE`
- **Lambda bundling**: esbuild with `--external:@aws-sdk/*` (SDK is in Node 18 runtime). Bundles are ~4KB.
- **Cross-region**: ACM cert must be in `us-east-1` for CloudFront. Uses CDK `crossRegionReferences: true`.
- **Auth**: Cognito JWT tokens sent as `Authorization: Bearer <token>`. API Gateway validates via HTTP JWT Authorizer.
- **CORS**: API Gateway allows `https://jobtrail.dev`. Lambda responses return `Access-Control-Allow-Origin: *`.
- **No REST API**: Uses HTTP API (API Gateway v2) — cheaper, faster.

## Development Conventions

### Backend
- All Lambda handlers live in `backend/functions/`
- Shared utilities (DynamoDB helpers, response formatters) in `backend/shared/`
- Build command: `npm run build` in `backend/` (runs esbuild, outputs to `backend/dist/functions/`)
- Never use `tsc` alone for build — it doesn't bundle dependencies
- Runtime: Node.js 18 (`NODEJS_18_X`). AWS SDK v3 is provided by the runtime, do not bundle it.

### Frontend
- API calls go through `frontend/src/lib/api.ts` — the `request()` function handles auth tokens
- Auth is abstracted in `frontend/src/lib/auth.ts` — supports dev mode (`VITE_DEV_MODE=true`) to bypass Cognito
- Types live in `frontend/src/types.ts` — keep in sync with backend handler shapes
- 204 responses (DELETE) return no body — `request()` skips `res.json()` for status 204

### Infrastructure
- All infra is CDK — no manual console changes
- Stack deployment order: DataStack → AuthStack → ApiStack → HostedZoneStack → CertStack (us-east-1) → HostingStack → DnsStack
- CI bootstraps both `us-west-2` and `us-east-1` before deploying

## CI/CD

Push to `main` → GitHub Actions → CDK deploy → Vite build → S3 sync → CloudFront invalidate.
Required secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.

## Documentation Policy

**When to update docs**:
- `README.md` — update when features are added/removed, setup steps change, or architecture changes
- `docs/api.md` — update with every API endpoint change (new routes, changed request/response shapes, new status codes)
- `CLAUDE.md` — update when architectural decisions are made, conventions change, or new patterns are established
- Do not let docs drift from the actual implementation

## Common Pitfalls

- `deleteApplication` / `deleteInterview` return 204 No Content — do not call `.json()` on the response
- Lambda functions are deployed from `backend/dist/` — always run `npm run build` in `backend/` before testing locally
- The ACM certificate stack deploys to `us-east-1` — `crossRegionReferences: true` must be set on both CertStack and HostingStack
- After changing Route 53 NS records, DNS propagation takes up to 48h before ACM cert validates
- `HostedZone.fromLookup()` fails at synthesis time if the zone doesn't exist yet — use explicit zone creation instead
