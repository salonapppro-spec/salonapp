This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cron Jobs

The cron endpoints are locked with `CRON_SECRET`. Vercel automatically sends this value as an `Authorization` header when invoking cron jobs, as long as `CRON_SECRET` is configured in the project environment.

Required production env:

```env
CRON_SECRET=<random-long-secret>
```

Manual test:

```bash
curl -i https://salonapp.pro/api/cron/reminders
curl -i -H "x-vercel-cron: 1" https://salonapp.pro/api/cron/reminders
curl -i -H "Authorization: Bearer $CRON_SECRET" https://salonapp.pro/api/cron/reminders

curl -i https://salonapp.pro/api/cron/billing-expiry
curl -i -H "x-vercel-cron: 1" https://salonapp.pro/api/cron/billing-expiry
curl -i -H "Authorization: Bearer $CRON_SECRET" https://salonapp.pro/api/cron/billing-expiry
```

Expected behavior:

- Missing `Authorization: Bearer <CRON_SECRET>` returns `401`.
- `x-vercel-cron: 1` alone returns `401`.
- A valid Bearer token returns `200` and runs the job.
