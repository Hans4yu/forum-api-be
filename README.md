# Forum API

Forum API is an Express 5, PostgreSQL, and JWT-based backend for the Dicoding forum API submission. It implements users, authentication, threads, comments, replies, and comment likes with migrations, automated tests, CI, CD scaffolding, and an NGINX HTTPS/rate-limit example.

## Prerequisites

- Node.js 22 or a compatible current LTS release.
- npm with lockfile support (`npm ci` is used in CI/CD).
- PostgreSQL for local development and tests.
- Newman only through the project npm script; no global install is required.

## Install

```bash
npm ci
```

Use `npm install` only when intentionally changing dependencies and updating `package-lock.json`.

## Environment Variables

Create local `.env` and `.test.env` files outside version control. Both files are ignored by `.gitignore` and must not be included in ZIP submissions.

Required app runtime values:

- `NODE_ENV`: `development`, `test`, or `production`.
- `PORT`: HTTP port used by the app.
- `PGHOST`: PostgreSQL host.
- `PGPORT`: PostgreSQL port.
- `PGUSER`: PostgreSQL username.
- `PGPASSWORD`: PostgreSQL password.
- `PGDATABASE`: PostgreSQL database name.
- `ACCESS_TOKEN_KEY`: JWT access-token signing key.
- `REFRESH_TOKEN_KEY`: JWT refresh-token signing key.
- `ACCESS_TOKEN_AGE`: Access-token age in seconds.

For GitHub Actions CD, store the production runtime values above inside the `APP_ENV` secret as newline-separated `.env` content. Do not commit those values.

Required GitHub Actions CD secrets:

- `SSH_HOST`
- `SSH_USER`
- `SSH_KEY`
- `SSH_PORT`
- `SSH_KNOWN_HOSTS`
- `DEPLOY_PATH`
- `APP_ENV`
- `HEALTHCHECK_URL`

## Database Migrations

Run development migrations with the default environment:

```bash
npm run migrate up
```

Run test migrations with `.test.env`:

```bash
npm run migrate:test up
```

Migration files create the users, authentications, threads, comments/replies, and comment-likes tables.

## Local Verification

Primary commands:

```bash
npm run lint
npm run migrate:test up
npm test
npm run test:coverage
npm run test:postman
```

Recorded local verification from prior task evidence: `npm run lint`, `npm run migrate:test up`, `npm test`, `npm run test:coverage`, and `npm run test:postman` passed locally when the test server was running on port `3000` with `NODE_ENV=test`.

For Newman, start the API in test mode on port `3000` before running `npm run test:postman`, or use the CI workflow pattern that starts the server and then executes the collection.

## Implemented API Scope

- Users: registration through `/users`.
- Auth: login, refresh token, and logout through `/authentications`.
- Threads: create and detail read through `/threads` and `/threads/{threadId}`.
- Comments: create and soft-delete top-level comments under a thread.
- Replies: create and soft-delete replies under a thread comment.
- Likes: toggle comment likes and expose `likeCount` in thread detail.

## CI Workflow

`.github/workflows/ci.yml` runs on pull requests to `main` and `master`. It uses a PostgreSQL service, installs dependencies with `npm ci`, writes a safe job-local `.test.env`, runs lint, applies test migrations, runs Vitest, runs coverage, starts the app on port `3000`, and runs Newman.

Safe failed-to-passed CI PR procedure:

1. Open a PR with the intended change and let CI run.
2. If CI fails, keep the PR open and inspect the failing job logs.
3. Fix the source, tests, migration, or documentation issue in a new commit on the same PR branch.
4. Re-run CI or push the fix so GitHub Actions runs again.
5. Merge only after the latest CI run passes; do not leave intentionally failing code, disabled tests, skipped checks, or fake status evidence in the branch.

## CD Workflow

`.github/workflows/cd.yml` runs on pushes to `main` and `master`. It uses SSH secrets only, pins `SSH_KNOWN_HOSTS`, uploads `APP_ENV` without printing it, pulls code at `DEPLOY_PATH`, runs `npm ci --omit=dev`, runs production migrations, restarts or starts PM2 process `forum-api`, and checks `HEALTHCHECK_URL` over HTTPS.

Real GitHub CI runs, real CD runs, public repository URL, production deployment, HTTPS API URL, and health-check success are not claimed by this repository until real GitHub/server/domain/certificate evidence exists.

## Deployment, NGINX, HTTPS, and Rate Limit

Deployment details are in `DEPLOYMENT.md`. The root `nginx.conf` is an example config for HTTPS termination, ACME challenge handling, and rate limiting only these endpoints:

- `/threads`
- `/threads/`

The configured `/threads` rate limit is `rate=90r/m`, `burst=20`, and `limit_req_status 429`. Other routes such as `/users` and `/authentications` are not rate-limited by this NGINX example.

Server `nginx -t`, Certbot issuance, live HTTPS validation, and live curl rate-limit checks are blocked until an actual server, domain, and certificate are available. Do not claim these checks as passed without real evidence.

## Blocked External Checks

The following are intentionally documented as blocked in this workspace:

- Public repository URL.
- Real GitHub CI run status.
- Real GitHub CD run status.
- Real deployment success.
- HTTPS API URL.
- Server `nginx -t` result.
- Certbot certificate issuance and renewal result.
- Live `/threads` rate-limit curl evidence.

Use `STUDENT_NOTES_TEMPLATE.md` to fill these only after real evidence is available.
