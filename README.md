# Apotec Patient API

NestJS REST API for patient CRUD, Cognito authentication, and DynamoDB-backed search. Can run as a standard Node server or locally via AWS Lambda + API Gateway emulation (Serverless Offline).

## Prerequisites

- **Node.js 24+** (matches `serverless.yml` runtime)
- **npm**
- AWS resources configured in `.env`:
    - DynamoDB patients table
    - Cognito User Pool + App Client
    - (Optional) OpenSearch domain

## Initial setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.dev .env

# 3. Edit .env with your AWS region, credentials, DynamoDB table, and Cognito values

# 4. Create the DynamoDB patients table (first time only)
npm run dynamodb:create-table

# 5. (Optional) OpenSearch setup(it's not working perfect)
npm run opensearch:create-index
npm run opensearch:reindex-patients
```

---

## 1. Normal run (NestJS dev server)

Use this for local development with the standard Express server (`src/main.ts`).

```bash
# Development with hot reload
npm run start:dev
```

Other useful commands:

```bash
# One-off start (no watch)
npm run start

# Production build + run
npm run build
npm run start:prod
```

**URLs**

| Resource     | URL                              |
| ------------ | -------------------------------- |
| API base     | `http://localhost:3000/api/v1`   |
| Swagger docs | `http://localhost:3000/api/docs` |

**Quick test**

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"YourPassword@123"}'

# List patients (requires access token)
curl http://localhost:3000/api/v1/patients?page=1&limit=20 \
  -H "Authorization: Bearer <access_token>"
```

---

## 2. Run with Serverless Offline

Use this to test the **Lambda + API Gateway** deployment path locally before deploying to AWS.

```bash
# Builds the app and starts serverless-offline
npm run serverless:offline
```

This runs `npm run build` then `npx serverless offline start`.

**Optional:** copy serverless-specific env defaults:

```bash
cp .env.serverless.example .env
```

Relevant `.env` variables for offline mode:

```env
SERVERLESS_HTTP_PORT=3000
SERVERLESS_LAMBDA_PORT=3002
ENABLE_SWAGGER=true
```

**URLs**

| Resource     | URL                              |
| ------------ | -------------------------------- |
| API base     | `http://localhost:3000/api/v1`   |
| Swagger docs | `http://localhost:3000/api/docs` |

**Quick test**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"YourPassword@123"}'
```

**Troubleshooting**

| Issue                                | Fix                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `EADDRINUSE` on port 3000 or 3002    | Stop the other process or change `SERVERLESS_HTTP_PORT` / `SERVERLESS_LAMBDA_PORT` in `.env` |
| Login returns body validation errors | Ensure `Content-Type: application/json` header is set                                        |
| Refresh token fails                  | Send both `refreshToken` and `idToken` in the request body                                   |

**Deploy to AWS** (when ready):

```bash
npm run build
npx serverless deploy --stage dev --region ap-south-1
```

See [docs/SERVERLESS_DEPLOYMENT.md](docs/SERVERLESS_DEPLOYMENT.md) for full deployment details.

---

## Scripts

| Command                               | Description                      |
| ------------------------------------- | -------------------------------- |
| `npm run start:dev`                   | NestJS dev server with watch     |
| `npm run serverless:offline`          | Local Lambda + API Gateway       |
| `npm run build`                       | Compile TypeScript               |
| `npm run test`                        | Unit tests                       |
| `npm run lint`                        | ESLint                           |
| `npm run dynamodb:create-table`       | Create DynamoDB patients table   |
| `npm run opensearch:create-index`     | Create OpenSearch patients index |
| `npm run opensearch:reindex-patients` | Reindex patients into OpenSearch |

## API overview

| Module   | Base path          | Auth                   |
| -------- | ------------------ | ---------------------- |
| Auth     | `/api/v1/auth`     | Public                 |
| Patients | `/api/v1/patients` | Bearer token (Cognito) |

Auth endpoints include `login`, `register`, `refresh-token`, `forgot-password`, `confirm-forgot-password`, and `activate-user`.

Patients support CRUD, pagination (`page`, `limit`), and search by address or condition.
