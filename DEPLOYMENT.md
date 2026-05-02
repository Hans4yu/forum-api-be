# Deployment

This project includes a root `nginx.conf` example for HTTPS termination, ACME challenge handling, and `/threads` rate limiting. This document is a deployment checklist and evidence guide; it does not claim that a real server or domain has already been deployed.

## GitHub Actions CD

The CD workflow is defined in `.github/workflows/cd.yml` and runs on pushes to `main` and `master`. It connects to the target server over SSH, writes the production `.env` from a GitHub secret without printing it, pulls the latest code in the deploy directory, installs production dependencies, runs migrations, restarts or starts the PM2 process, and verifies the HTTPS health check URL.

Required GitHub Actions secrets:

- `SSH_HOST`: SSH server host value stored only in GitHub secrets.
- `SSH_USER`: SSH username stored only in GitHub secrets.
- `SSH_KEY`: Private SSH key consumed by `webfactory/ssh-agent@v0.9.0`; never commit this value.
- `SSH_PORT`: SSH port stored only in GitHub secrets.
- `SSH_KNOWN_HOSTS`: Pinned server host key entry written to `~/.ssh/known_hosts`.
- `DEPLOY_PATH`: Existing server path containing the deployed repository.
- `APP_ENV`: Full production `.env` file content for app runtime values.
- `HEALTHCHECK_URL`: HTTPS URL checked after deployment.

`APP_ENV` must contain the production runtime values required by `src/Commons/config.js`:

- `NODE_ENV`
- `PORT`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`
- `ACCESS_TOKEN_KEY`
- `REFRESH_TOKEN_KEY`
- `ACCESS_TOKEN_AGE`

Server prerequisites:

- The repository already exists at `DEPLOY_PATH` and can run `git pull`.
- Node.js, npm, PM2, and database access are configured on the server.
- The server has production `.env` write permission in `DEPLOY_PATH`.
- The database user can run migrations with `npm run migrate up`.
- PM2 process name is `forum-api`; the workflow falls back to `pm2 start src/app.js --name forum-api` if restart fails because the process does not exist yet.
- `HEALTHCHECK_URL` must start with `https://`.

The workflow intentionally uses pinned known hosts and does not disable SSH host-key checking.

## CD Verification

After real secrets, server, domain, and certificate are configured, verify CD with real GitHub evidence:

1. Push a normal, non-breaking change to `main` or `master`.
2. Confirm the CD workflow run reaches the deploy, migration, PM2 restart/start, and HTTPS health-check steps.
3. Confirm `HEALTHCHECK_URL` uses HTTPS and returns a successful response in the workflow.
4. Save the real workflow URL or screenshot in student notes only after it exists.
5. Do not create fake workflow run IDs, fake badges, or fake screenshots.

Real CD and HTTPS deployment verification are **BLOCKED** until a real server, domain/HTTPS health check URL, SSH secrets, deploy path, and production app environment are supplied. The workflow is prepared for those inputs, but deployment success cannot be claimed from this workspace.

## NGINX / Certbot Setup

The root `nginx.conf` uses placeholder domain values and should be adapted on the server before activation.

1. Copy the config to the server's NGINX configuration location and replace placeholder domain values.

2. Validate the config:

   ```bash
   sudo nginx -t
   ```

3. Issue or install the certificate with Certbot:

   ```bash
   sudo certbot --nginx -d <domain>
   ```

4. Verify renewal behavior:

   ```bash
   sudo certbot renew --dry-run
   ```

5. Reload NGINX only after validation passes:

   ```bash
   sudo systemctl reload nginx
   ```

Server-side HTTPS, Certbot issuance, renewal, and `nginx -t` are **BLOCKED** in this workspace until a real server, domain, and certificate are available. The config and commands are prepared, but live validation cannot be claimed here.

## Rate-Limit Checks

The example NGINX config rate-limits only these locations:

- `/threads`
- `/threads/`

The configured limit is `rate=90r/m` with `burst=20` and `limit_req_status 429`. Other routes, including `/users` and `/authentications`, are not rate-limited by this config.

Use curl against the HTTPS endpoint after NGINX is live:

```bash
curl -I https://<domain>/threads
curl -I https://<domain>/threads/
curl -I https://<domain>/users
curl -I https://<domain>/authentications
```

Expected behavior:

- `/threads` and `/threads/` are rate-limited and return `429` when the burst is exceeded.
- `/users` and `/authentications` are not rate-limited by this config.
- HTTP redirects to HTTPS except for `/.well-known/acme-challenge/`.

Live curl verification is **BLOCKED** in this workspace until a real server, domain, and certificate are available. Do not report live rate-limit success without real command output from the target server/domain.

## Safe CI Failed-To-Passed PR Procedure

1. Open or update a PR targeting `main` or `master`.
2. Let `.github/workflows/ci.yml` run without disabling lint, tests, coverage, migrations, or Newman.
3. If CI fails, inspect the failing log and fix the underlying source, test, migration, or documentation issue.
4. Push the fix to the same PR branch and wait for a new CI run.
5. Merge only after the latest CI run passes; do not leave intentionally failing code, skipped checks, removed assertions, or fake pass evidence.

## ZIP / Submission Safety

Include these files and directories in the ZIP submission:

- `package.json`
- `package-lock.json`
- `src/`
- `migrations/`
- `tests/` and colocated `_test/` files
- `.github/workflows/`
- `nginx.conf`
- `README.md`
- `DEPLOYMENT.md`
- `STUDENT_NOTES_TEMPLATE.md`
- Postman collection and environment under `forum-api-v2/` if required by the reviewer

Exclude these files and values from the ZIP submission:

- `.env`
- `.test.env`
- `node_modules/`
- coverage output such as `coverage/`
- credentials and private keys
- generated tokens and JWTs
- database credentials
- fake evidence, fake screenshots, fake badges, and fake workflow statuses

Before zipping, verify `.gitignore` excludes local environment files, dependency output, and coverage output. `package-lock.json` is intentionally not ignored and should be included.

## Blocked Verification Note

Server-side HTTPS, Certbot issuance, renewal, server `nginx -t`, and live curl verification are **BLOCKED** in this workspace until a real server, domain, and certificate are available. The config and commands are prepared, but live validation cannot be claimed here.

Real GitHub CI/CD runs, public repository URL, HTTPS API URL, and deployment success are also **BLOCKED** until real GitHub/server/domain/certificate evidence exists. Use placeholders in student notes until that evidence is available.
