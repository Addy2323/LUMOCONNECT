# Deploy LUMO Connect to Netlify from GitHub

The repository is configured for Netlify's current OpenNext integration. Do not add or pin the legacy `@netlify/plugin-nextjs` package.

## 1. Protect production secrets

The real `.env` file must stay local and must not be committed. Add production values in Netlify under **Project configuration → Environment variables**.

At minimum, configure:

- `DATABASE_URL`: pooled production PostgreSQL connection URL
- `BETTER_AUTH_SECRET`: a new, strong production-only secret
- `BETTER_AUTH_URL`: the final Netlify URL, such as `https://your-site.netlify.app`
- `ENABLE_ROLE_SIMULATOR`: `false`
- `NEXT_PUBLIC_ENABLE_ROLE_SIMULATOR`: `false`

Add the Redis, S3, SMTP, Mongike, Meseji, and Sentry variables from `.env.example` when those integrations are enabled. Never reuse secrets that have previously been committed to Git.

For serverless PostgreSQL, use a pooled connection string to avoid exhausting database connections. Prisma Postgres can be connected through Netlify's Prisma extension and supplies `DATABASE_URL` automatically.

## 2. Prepare the production database

Create or select the production PostgreSQL database, set `DATABASE_URL` locally to that database, and apply the checked-in schema before the first public deployment:

```powershell
pnpm exec prisma migrate deploy
pnpm run prisma:seed
```

Only run the seed command if production should contain the bundled initial data.

## 3. Push the repository to GitHub

The configured remote is `https://github.com/Addy2323/LUMOCONNECT.git` and the production branch is `main`.

```powershell
git add .
git commit -m "Prepare LUMO Connect for Netlify deployment"
git push origin main
```

Review the changes before committing because this working tree may contain other in-progress work.

## 4. Connect GitHub to Netlify

1. Sign in at `https://app.netlify.com`.
2. Select **Add new project → Import an existing project**.
3. Choose GitHub and authorize access to `Addy2323/LUMOCONNECT`.
4. Select the `main` branch.
5. Netlify will read `netlify.toml`; confirm build command `pnpm run build` and publish directory `.next`.
6. Add the environment variables listed above.
7. Select **Deploy**.

Every later push to `main` will trigger a production deployment. Pull requests will receive Deploy Previews.

## 5. After the first deployment

1. Copy the assigned `https://...netlify.app` URL into `BETTER_AUTH_URL`.
2. Trigger **Deploys → Trigger deploy → Clear cache and deploy site**.
3. Test registration, login, marketplace APIs, database writes, and external integrations.
4. Add a custom domain under **Domain management** when ready.

## Build behavior

- Node.js 22 and pnpm 10.15.1 are pinned in `netlify.toml`.
- `postinstall` generates Prisma Client on every dependency installation.
- Netlify automatically provisions functions for Next.js route handlers and server rendering.
- Skew protection is enabled to reduce stale-client errors during new deployments.
