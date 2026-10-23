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

Database migrations are run manually; the deploy workflow does not execute them.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
