# Perizia-Crux Voting Platform

Official voting platform for **Perizia-Crux Batch 2023**.

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

## Project Structure

```
src/
  app/
    api/          # API routes
    admin/        # Admin panel (future)
    committee/    # Committee applications (future)
    results/      # Voting results (future)
    vote/         # Voting session (future)
  components/     # Shared UI components (future)
  lib/            # Shared utilities (future)
  server/         # Server-only logic, DB access (future)
  types/          # Shared TypeScript types (future)
```

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/) *(future)*
- Deployed on [Vercel](https://vercel.com/)
