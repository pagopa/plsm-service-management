This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
#
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom Google Font.

## Database

Database access uses Drizzle with a shared `pg` pool, created lazily by `getDb()`
in `db/index.ts`. The schema and relations live in `db/schema.ts` and
`db/relations.ts`.

Set `DATABASE_URL` in `apps/sm-fe-smcr/.env` (see `env.example`). The application,
Drizzle migrations, and permission seed all use this URL. Percent-encode special
characters in the username and password and configure SSL through the URL.
The application no longer reads the legacy `DB_*` connection variables.

From the repository root:

```bash
yarn workspace sm-fe-smcr db:generate
yarn workspace sm-fe-smcr db:migrate
yarn workspace sm-fe-smcr db:seed
```

To apply migrations through GitHub Actions, run **SM-FE-SMCR - Migrate**, select
`app-dev` or `app-prod`, and enter `migrate` to confirm. The workflow uses the
private runner for the selected environment and runs the existing `db:migrate`
command. Configure the `DATABASE_URL` secret in the corresponding GitHub
environment (`app-dev-cd` or `app-prod-cd`) with the same connection URL as the app.
Runs targeting the same environment are serialized.

For `app-prod`, select the `main` branch: other branches and tags are rejected
before checkout. For `app-dev`, any branch or tag can be selected.

Run migrations before deploying code that depends on them. The deploy workflow
does not execute migrations.

### Log retention (pg_cron)

The `smcr-log-retention` job runs daily at **03:00 UTC**. It deletes rows from
`public.logs` whose event `timestamp` is strictly older than 30 days at the start
of the run, across all services and levels. Each batch of up to 5,000 deletions
is committed separately. Rows that expire between runs remain until the next run.

**One-time setup per environment**, separate from app deployments and Drizzle
migrations:

1. On the Azure PostgreSQL Flexible Server, verify that `pg_cron` is allowed in
   `azure.extensions` and loaded via `shared_preload_libraries`. Preserve existing
   entries if changing either setting; a preload change requires a server restart.
   Verify that the cron scheduler uses UTC/GMT (`cron.timezone` on versions that
   expose it).
2. As a database administrator, run `CREATE EXTENSION IF NOT EXISTS pg_cron;` in
   the cron metadata database (`postgres` by default), **not** in the SMCR DB.
3. From the repo root, set `CRON_DATABASE_URL` to a connection URL for that
   metadata database. Use a job owner with permission to schedule jobs there
   and to connect to the target DB and `SELECT`/`DELETE` on `public.logs`.
   Confirm that `logs_db` is the database named in the app's `DATABASE_URL`:

   ```sh
   psql "$CRON_DATABASE_URL" -X -v ON_ERROR_STOP=1 -v logs_db=dbsmcr \
     -f apps/sm-fe-smcr/scripts/schedule-log-retention.sql
   ```

Registration does not delete rows immediately. Re-running the script as the
same owner updates the named job rather than creating a duplicate. To check the
schedule and recent outcomes in the metadata database:

```sql
SELECT jobid, schedule, database, active FROM cron.job WHERE jobname = 'smcr-log-retention';
SELECT start_time, end_time, status, return_message FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'smcr-log-retention')
ORDER BY start_time DESC LIMIT 5;
```

To stop future runs, execute `SELECT cron.unschedule('smcr-log-retention');`
there as the job owner. This does not restore previously deleted logs.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
