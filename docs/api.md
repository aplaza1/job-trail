# Job Trail API Reference

This document describes every HTTP endpoint exposed by the Job Trail API.

**Base URL**: `https://<api-id>.execute-api.us-west-2.amazonaws.com`

The exact base URL is output by CDK as `JobTrailApiStack.ApiUrl` after deployment. In GitHub Actions it is available as the `VITE_API_URL` build variable.

---

## Authentication

All endpoints except `GET /public/:shareToken` require a Cognito ID token sent as a Bearer token:

```
Authorization: Bearer <id_token>
```

The token is obtained by authenticating with Amazon Cognito (User Pool). The frontend uses the Cognito JS SDK (`amazon-cognito-identity-js`) to sign in and retrieve the ID token, which is then included in every API request.

The API Gateway uses an HTTP JWT Authorizer backed by Cognito. Requests with a missing or invalid token receive `401 Unauthorized`.

---

## CORS

CORS is enabled for `https://jobtrail.dev`. Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`. Allowed headers: `Content-Type`, `Authorization`.

---

## Applications

Applications represent job postings you have applied to.

### `GET /applications`

Returns all applications for the authenticated user, ordered by DynamoDB sort key (insertion order).

**Request**

```
GET /applications
Authorization: Bearer <id_token>
```

**Response** `200 OK`

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": "us-west-2_abc123|sub-uuid",
    "company": "Acme Corp",
    "title": "Software Engineer",
    "status": "applied",
    "method": "LinkedIn",
    "dateApplied": "2024-03-01",
    "lastUpdated": "2024-03-01",
    "link": "https://acme.com/careers/123"
  }
]
```

Returns an empty array `[]` when no applications exist.

---

### `POST /applications`

Creates a new application. A UUID is generated server-side; `lastUpdated` is set to the current date.

**Request**

```
POST /applications
Authorization: Bearer <id_token>
Content-Type: application/json
```

```json
{
  "company": "Acme Corp",
  "title": "Software Engineer",
  "status": "applied",
  "method": "LinkedIn",
  "dateApplied": "2024-03-01",
  "link": "https://acme.com/careers/123"
}
```

**Required fields**: `company`, `title`, `status`, `method`, `dateApplied`

**Optional fields**: `link`

**`status` values**

| Value | Meaning |
|---|---|
| `applied` | Application submitted |
| `interviewing` | Active interview process |
| `waiting` | Awaiting a decision |
| `rejected` | Rejected by employer |
| `offer` | Offer received |

**`method` values**

`LinkedIn` | `Company Website` | `Referral` | `Indeed` | `Glassdoor` | `Recruiter` | `Other`

**Response** `201 Created`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userId": "us-west-2_abc123|sub-uuid",
  "company": "Acme Corp",
  "title": "Software Engineer",
  "status": "applied",
  "method": "LinkedIn",
  "dateApplied": "2024-03-01",
  "lastUpdated": "2024-03-01",
  "link": "https://acme.com/careers/123"
}
```

**Error responses**

- `400 Bad Request` — missing required fields
- `500 Internal Server Error` — unexpected error

---

### `PUT /applications/:id`

Updates an existing application. Any subset of fields may be included in the body; `lastUpdated` is always set to the current date on a successful update.

**Request**

```
PUT /applications/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer <id_token>
Content-Type: application/json
```

```json
{
  "status": "interviewing"
}
```

**Response** `200 OK`

Returns the full updated application object.

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userId": "us-west-2_abc123|sub-uuid",
  "company": "Acme Corp",
  "title": "Software Engineer",
  "status": "interviewing",
  "method": "LinkedIn",
  "dateApplied": "2024-03-01",
  "lastUpdated": "2024-03-10",
  "link": "https://acme.com/careers/123"
}
```

**Error responses**

- `404 Not Found` — application does not exist or belongs to a different user
- `500 Internal Server Error` — unexpected error

---

### `DELETE /applications/:id`

Permanently deletes an application.

**Request**

```
DELETE /applications/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer <id_token>
```

**Response** `204 No Content`

No response body.

**Error responses**

- `404 Not Found` — application does not exist or belongs to a different user
- `500 Internal Server Error` — unexpected error

---

## Interviews

Interviews represent scheduled or tentative interview events associated with your job search.

### `GET /interviews`

Returns all interviews for the authenticated user.

**Request**

```
GET /interviews
Authorization: Bearer <id_token>
```

**Response** `200 OK`

```json
[
  {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "userId": "us-west-2_abc123|sub-uuid",
    "company": "Acme Corp",
    "title": "Software Engineer",
    "type": "Phone Screen",
    "date": "2024-03-15",
    "time": "10:00 AM",
    "tentative": false,
    "applicationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
]
```

Returns an empty array `[]` when no interviews exist.

---

### `POST /interviews`

Creates a new interview. A UUID is generated server-side.

**Request**

```
POST /interviews
Authorization: Bearer <id_token>
Content-Type: application/json
```

```json
{
  "company": "Acme Corp",
  "title": "Software Engineer",
  "type": "Phone Screen",
  "date": "2024-03-15",
  "time": "10:00 AM",
  "tentative": false,
  "applicationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Required fields**: `company`, `type`, `date`, `time`, `tentative`

**Optional fields**: `title`, `applicationId`

**`type` values**

`Recruiter Call` | `Phone Screen` | `Tech Screen` | `2nd Tech Screen` | `Hiring Manager` | `System Design` | `Take-Home Project` | `Onsite` | `Panel` | `Final Round` | `Other`

**`time` format**

Either a 24-hour time string (`"10:00"`, `"14:30"`) or the literal string `"TBD"` when the time has not been confirmed.

**`tentative`**

`true` when the interview is not yet confirmed; `false` when confirmed.

**`applicationId`**

Optional UUID of a job application to link this interview to. When set, the interview appears in the job's interview history.

**Response** `201 Created`

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "userId": "us-west-2_abc123|sub-uuid",
  "company": "Acme Corp",
  "title": "Software Engineer",
  "type": "Phone Screen",
  "date": "2024-03-15",
  "time": "10:00",
  "tentative": false,
  "applicationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Error responses**

- `400 Bad Request` — missing required fields (`company`, `type`, `date`, `time`, or `tentative`)
- `500 Internal Server Error` — unexpected error

---

### `PUT /interviews/:id`

Updates an existing interview. Any subset of fields may be provided.

**Request**

```
PUT /interviews/7c9e6679-7425-40de-944b-e07fc1f90ae7
Authorization: Bearer <id_token>
Content-Type: application/json
```

```json
{
  "tentative": false,
  "time": "14:00"
}
```

**Response** `200 OK`

Returns the full updated interview object.

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "userId": "us-west-2_abc123|sub-uuid",
  "company": "Acme Corp",
  "title": "Software Engineer",
  "type": "Phone Screen",
  "date": "2024-03-15",
  "time": "14:00",
  "tentative": false
}
```

**Error responses**

- `404 Not Found` — interview does not exist or belongs to a different user
- `500 Internal Server Error` — unexpected error

---

### `DELETE /interviews/:id`

Permanently deletes an interview.

**Request**

```
DELETE /interviews/7c9e6679-7425-40de-944b-e07fc1f90ae7
Authorization: Bearer <id_token>
```

**Response** `204 No Content`

No response body.

**Error responses**

- `404 Not Found` — interview does not exist or belongs to a different user
- `500 Internal Server Error` — unexpected error

---

## Profile

A profile is created automatically on first `GET /profile`. It holds your display name, public visibility toggle, and a stable share token.

### `GET /profile`

Returns the authenticated user's profile, creating a default one if it does not exist yet. Default values: `displayName: ""`, `isPublic: false`, `shareToken: <generated UUID>`.

**Request**

```
GET /profile
Authorization: Bearer <id_token>
```

**Response** `200 OK`

```json
{
  "userId": "us-west-2_abc123|sub-uuid",
  "displayName": "Jane Doe",
  "isPublic": true,
  "shareToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

### `PUT /profile`

Updates the authenticated user's profile. Accepted fields: `displayName` and `isPublic`.

When `isPublic` is toggled **from `false` to `true`**, a `SHARE#<shareToken>` entry is written to DynamoDB to enable public lookups. When toggled **from `true` to `false`**, that entry is deleted, effectively revoking public access immediately.

The `shareToken` itself is immutable and generated once at profile creation.

**Request**

```
PUT /profile
Authorization: Bearer <id_token>
Content-Type: application/json
```

```json
{
  "displayName": "Jane Doe",
  "isPublic": true
}
```

**Optional fields**: `displayName`, `isPublic`

**Response** `200 OK`

Returns the full updated profile object.

```json
{
  "userId": "us-west-2_abc123|sub-uuid",
  "displayName": "Jane Doe",
  "isPublic": true,
  "shareToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Error responses**

- `500 Internal Server Error` — unexpected error

---

## Public Dashboard

### `GET /public/:shareToken`

Returns a read-only view of a user's applications and interviews. This endpoint requires **no authentication**.

The endpoint only returns data if the user has set `isPublic: true` in their profile. If the share token does not exist or the profile is not public, `404` is returned.

**Request**

```
GET /public/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Response** `200 OK`

```json
{
  "displayName": "Jane Doe",
  "applications": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "userId": "us-west-2_abc123|sub-uuid",
      "company": "Acme Corp",
      "title": "Software Engineer",
      "status": "interviewing",
      "method": "LinkedIn",
      "dateApplied": "2024-03-01",
      "lastUpdated": "2024-03-10"
    }
  ],
  "interviews": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "userId": "us-west-2_abc123|sub-uuid",
      "company": "Acme Corp",
      "type": "Phone Screen",
      "date": "2024-03-15",
      "time": "10:00 AM",
      "tentative": false
    }
  ]
}
```

**Error responses**

- `404 Not Found` — share token does not exist, or the profile's `isPublic` is `false`
- `500 Internal Server Error` — unexpected error

---

## Error Response Format

All error responses return a JSON body in this shape:

```json
{
  "message": "Human-readable error description"
}
```

Standard HTTP status codes used:

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `204` | No Content (delete success) |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing/invalid JWT) |
| `404` | Not Found |
| `500` | Internal Server Error |

---

## DynamoDB Access Patterns

The API uses a single DynamoDB table (`job-trail`) with the following access patterns:

| Operation | PK | SK / prefix |
|---|---|---|
| List applications | `USER#<userId>` | `begins_with(SK, "APP#")` |
| Get application | `USER#<userId>` | `APP#<id>` |
| List interviews | `USER#<userId>` | `begins_with(SK, "INT#")` |
| Get interview | `USER#<userId>` | `INT#<id>` |
| Get profile | `USER#<userId>` | `PROFILE` |
| Resolve share token | `SHARE#<token>` | `PROFILE` |

All user data is scoped to `USER#<userId>` as the partition key, so a single user's entire dataset can be queried in one DynamoDB call per entity type. The `SHARE#<token>` partition provides O(1) share token lookups without requiring a Global Secondary Index.

---

## Lambda Functions

Each resource group is handled by a dedicated Lambda function deployed from `backend/dist/`:

| Function name | Handler | Routes |
|---|---|---|
| `job-trail-applications` | `functions/applications.handler` | `GET/POST /applications`, `PUT/DELETE /applications/{id}` |
| `job-trail-interviews` | `functions/interviews.handler` | `GET/POST /interviews`, `PUT/DELETE /interviews/{id}` |
| `job-trail-profile` | `functions/profile.handler` | `GET/PUT /profile` |
| `job-trail-public` | `functions/public.handler` | `GET /public/{shareToken}` |

All functions run on Node.js 18.x with a 30-second timeout. The `public` function is granted read-only DynamoDB access; all others have read-write access.
