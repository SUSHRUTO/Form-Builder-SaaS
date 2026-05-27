# PokeForms

Production-style Typeform-inspired form builder SaaS built from the required `piyushgarg-dev/trpc-monorepo` starter.

PokeForms lets creators build dynamic Pokemon-world forms, publish public or unlisted links, collect unauthenticated responses, inspect analytics, export CSVs, and browse generated API documentation through Scalar.

## Demo

- Web app: `http://localhost:3000`
- API: `http://localhost:8000`
- Scalar API docs: `http://localhost:8000/docs`
- Demo creator email: `demo@pokebuilder.dev`
- Demo creator password: `Pikachu@2026`
- Pokemon journey atlas: `http://localhost:3000/journey`

The demo login now bootstraps the demo account automatically after the database is migrated. The seed data includes public and unlisted Ash journey forms, 550+ Pokemon catalog entries, theme gallery records, sample responses, analytics and queued email events.

## Stack

- Turborepo monorepo with separate `apps/web` and `apps/api`
- Next.js 16 frontend
- Express API server
- tRPC for type-safe APIs
- Zod for shared form, auth and response validation
- Drizzle ORM with PostgreSQL
- Scalar API reference generated from `trpc-to-openapi`
- Shared package `@repo/forms` for schemas, types, validators and Pokemon demo data

## Features

- Email/password authentication with database sessions
- Forgot password, reset password and change password flows
- Creator dashboard for form creation and management
- Dynamic fields: short text, long text, email, number, single select, multi select, checkbox, rating and date
- Field-level required flags, options and validation rules
- Publish, unpublish, clone and archive forms
- Public visibility: shown in Explore
- Unlisted visibility: published but hidden from public listings
- Graceful handling for invalid, unpublished, expired and response-limited links
- Public submission flow without login
- Rate limiting and honeypot spam protection for public response submissions
- Response inbox, analytics, daily response bars, choice breakdowns and CSV export
- Pokemon theme gallery, custom slugs, password-protected forms and QR-style share panel
- Ash Ketchum 25-season journey page with 550+ Pokemon, images, types, regions, powers and form templates
- Email event outbox for password reset, creator notification and respondent confirmation flows

## Project Structure

```txt
apps/
  api/      Express + tRPC + Scalar
  web/      Next.js creator and respondent UI
packages/
  database/ Drizzle schema and migrations
  forms/    Shared Zod schemas, dynamic validators and seed constants
  services/ Auth, form, seed and business logic
  trpc/     Routers, context and typed client exports
```

## Local Setup

1. Install dependencies:

```sh
corepack pnpm install
```

2. Create env:

```sh
cp .env.example .env
```

3. Start Postgres:

```sh
docker compose up -d
```

If this fails on Windows, open Docker Desktop first, wait until the engine is running, then retry the command.

4. Apply migrations and seed the demo:

```sh
corepack pnpm --filter @repo/database db:migrate
corepack pnpm db:seed
```

Seeding is also triggered by logging in with `demo@pokebuilder.dev` / `Pikachu@2026`, but migrations still need a running Postgres database.

5. Run the apps:

```sh
corepack pnpm dev
```

Frontend runs on `http://localhost:3000`; API and Scalar docs run on `http://localhost:8000`.

## Useful Scripts

```sh
corepack pnpm --filter web build
corepack pnpm --filter @repo/api build
corepack pnpm --filter web check-types
corepack pnpm --filter @repo/trpc exec tsc --noEmit
corepack pnpm --filter @repo/database db:generate
corepack pnpm --filter @repo/database db:migrate
corepack pnpm db:seed
```

The web build script uses `next build --webpack` because the current Next/Turbopack Windows + pnpm symlink combination can fail to resolve Radix transitive packages even when they are installed.

## API Documentation

Scalar is served by the API app:

- Local docs: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

Documented route groups include authentication, creator forms, public listings, public form retrieval and public response submission.

## Visibility Rules

- `public`: form must be `published`; appears on `/explore` and can be submitted by anyone.
- `unlisted`: form must be `published`; does not appear on `/explore`; direct `/f/:slug` link works.
- `draft` or `archived`: hidden publicly and rejects submissions.
- Expired forms and forms past response limit reject submissions with a clear API/UI error.

## Deployment Notes

Deploy `apps/web` and `apps/api` as separate services. Set these environment variables in both places as needed:

```env
DATABASE_URL=postgres://...
BASE_URL=https://your-api.example.com
APP_URL=https://your-web.example.com
NEXT_PUBLIC_API_URL=https://your-api.example.com/trpc
NEXT_PUBLIC_API_DOCS_URL=https://your-api.example.com/docs
NODE_ENV=production
```

Run `corepack pnpm --filter @repo/database db:migrate` and `corepack pnpm db:seed` against the production database before demo judging.
