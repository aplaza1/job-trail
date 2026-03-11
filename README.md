# Job Trail 🛤️

A self-hosted job application tracker built with React, AWS Lambda, DynamoDB, and CloudFront. Track applications, schedule interviews, and share your job search progress — all on your own infrastructure.

**Live demo**: https://jobtrail.dev

---

## Features

- **Application tracking** — log jobs with status, method, date, and link
- **Interview calendar** — 5-day business-week view with confirmed/tentative states
- **Interview ↔ Job linking** — link interviews to specific applications
- **Public share page** — generate a shareable link to your dashboard
- **Custom domain** — served via CloudFront with ACM certificate
- **Fully serverless** — Lambda + DynamoDB, no servers to manage

## Architecture

```
Browser → CloudFront (jobtrail.dev)
             ├── /           → S3 static site (React SPA)
             └── /api/*      → API Gateway HTTP API
                               └── Lambda functions (Node.js 18)
                                     └── DynamoDB (single-table design)

Auth: Amazon Cognito User Pools (JWT tokens)
DNS:  Route 53 hosted zone
TLS:  ACM certificate (us-east-1, CloudFront requirement)
IaC:  AWS CDK v2 (TypeScript)
CI:   GitHub Actions
```

## CDK Stacks

| Stack | Region | Purpose |
|---|---|---|
| `JobTrailDataStack` | us-west-2 | DynamoDB table |
| `JobTrailAuthStack` | us-west-2 | Cognito User Pool |
| `JobTrailApiStack` | us-west-2 | API Gateway + Lambda functions |
| `JobTrailHostedZoneStack` | us-west-2 | Route 53 hosted zone |
| `JobTrailCertStack` | us-east-1 | ACM certificate (CloudFront requirement) |
| `JobTrailHostingStack` | us-west-2 | S3 + CloudFront distribution |
| `JobTrailDnsStack` | us-west-2 | Route 53 A/AAAA records |

## API Reference

All endpoints require `Authorization: Bearer <id_token>` except `GET /public/:shareToken`.

Base URL: `https://<api-id>.execute-api.us-west-2.amazonaws.com`

### Applications

| Method | Path | Description |
|---|---|---|
| `GET` | `/applications` | List all applications |
| `POST` | `/applications` | Create application |
| `PUT` | `/applications/:id` | Update application |
| `DELETE` | `/applications/:id` | Delete application |

**Application object**:
```json
{
  "id": "uuid",
  "company": "Acme Corp",
  "title": "Software Engineer",
  "status": "applied | interviewing | waiting | rejected | offer",
  "method": "LinkedIn | Company Website | Referral | Indeed | Glassdoor | Recruiter | Other",
  "dateApplied": "YYYY-MM-DD",
  "lastUpdated": "YYYY-MM-DD",
  "link": "https://...",
  "notes": "Optional notes"
}
```

### Interviews

| Method | Path | Description |
|---|---|---|
| `GET` | `/interviews` | List all interviews |
| `POST` | `/interviews` | Create interview |
| `PUT` | `/interviews/:id` | Update interview |
| `DELETE` | `/interviews/:id` | Delete interview |

**Interview object**:
```json
{
  "id": "uuid",
  "company": "Acme Corp",
  "title": "Software Engineer",
  "type": "Recruiter Call | Phone Screen | Tech Screen | ...",
  "date": "YYYY-MM-DD",
  "time": "HH:MM AM/PM | TBD",
  "tentative": false,
  "notes": "Optional notes"
}
```

### Profile

| Method | Path | Description |
|---|---|---|
| `GET` | `/profile` | Get profile (auto-created on first access) |
| `PUT` | `/profile` | Update profile |

**Profile object**:
```json
{
  "userId": "uuid",
  "displayName": "Jane Doe",
  "isPublic": true,
  "shareToken": "uuid"
}
```

### Public

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/public/:shareToken` | None | Public dashboard view |

See [`docs/api.md`](docs/api.md) for the full API reference with request/response examples.

## DynamoDB Schema (Single-Table)

| PK | SK | Entity |
|---|---|---|
| `USER#<userId>` | `APP#<id>` | Application |
| `USER#<userId>` | `INT#<id>` | Interview |
| `USER#<userId>` | `PROFILE` | Profile |
| `SHARE#<token>` | `PROFILE` | Share token lookup |

The table uses pay-per-request billing and has a `RETAIN` removal policy so your data is preserved if the stack is torn down.

## Local Development

### Prerequisites

- Node.js 18+
- AWS CLI configured with an account
- AWS CDK CLI: `npm install -g aws-cdk`

### Setup

```bash
git clone https://github.com/aplaza1/job-trail.git
cd job-trail
npm install
```

### Run locally (dev mode)

The frontend has a dev mode that bypasses Cognito and uses a local Express API server:

```bash
# Terminal 1 — backend API server
npm run dev:api

# Terminal 2 — frontend
VITE_DEV_MODE=true npm run dev:ui
```

Or run both together with:

```bash
npm run dev
```

The local server runs on `http://localhost:3001` and the frontend on `http://localhost:5173`.

### Deploy to AWS

1. **Bootstrap CDK** (first time only):
   ```bash
   cd infra
   npx cdk bootstrap aws://<account-id>/us-west-2
   npx cdk bootstrap aws://<account-id>/us-east-1
   ```
   CDK must be bootstrapped in both regions because the ACM certificate is provisioned in `us-east-1` (required by CloudFront) while all other resources deploy to `us-west-2`.

2. **Deploy all stacks**:
   ```bash
   npx cdk deploy --all --require-approval never
   ```
   Or from the repo root:
   ```bash
   npm run infra:deploy
   ```

3. **Custom domain** (optional): After deploying `JobTrailHostedZoneStack`, update your domain registrar's nameservers to the 4 NS records output from that stack. DNS propagation may take up to 48 hours.

### CI/CD

Push to `main` triggers GitHub Actions (`.github/workflows/deploy.yml`):

1. **deploy-infra**: Bootstraps CDK, builds backend, deploys all CDK stacks, and captures outputs (API URL, Cognito IDs, S3 bucket, CloudFront distribution ID).
2. **deploy-frontend**: Builds the React app with the CDK-output env vars baked in, syncs to S3 with correct cache headers, and invalidates CloudFront.

Required GitHub secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Frontend environment variables are derived from CDK stack outputs automatically — no manual env var management needed in CI.

## Project Structure

```
job-trail/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/       # API client, auth helpers
│       ├── pages/
│       └── types.ts
├── backend/           # Lambda functions
│   ├── functions/     # applications.ts, interviews.ts, profile.ts, public.ts
│   ├── shared/        # db.ts, middleware.ts
│   └── local-server.ts  # Express dev server
├── infra/             # AWS CDK stacks
│   ├── bin/app.ts     # CDK app entry point
│   └── lib/           # Stack definitions
├── docs/
│   └── api.md         # Full API reference
└── .github/workflows/
    └── deploy.yml
```

## Contributing

Contributions are welcome! Fork the repo and open a PR.

- Keep Lambda functions thin — business logic in handlers, shared utilities in `backend/shared/`
- All infra changes go through CDK stacks — no manual console changes
- Update `docs/` when adding or changing API endpoints or features

## License

MIT
