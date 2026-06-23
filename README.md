# XenDesk

Internal customer support & ticketing system for XenFi Systems. Customers raise
and track tickets; support agents triage, assign, prioritize, and resolve them —
all with role-based access control, a threaded conversation per ticket, and a
real-time-feeling agent dashboard.

- **Live demo:** _add your Vercel URL here_
- **Repository:** https://github.com/ekumamait/xendesk

---

## Features

- **Authentication & RBAC** — email/password sign-in with two roles:
  - **Customer** — create tickets, view only their own, and comment on them.
  - **Agent** — view/search/filter all tickets, assign agents, change status and
    priority, manage tags, and comment.
- **Tickets** — full CRUD with `title`, `description`, `status`
  (`OPEN`/`IN_PROGRESS`/`RESOLVED`), `priority` (`LOW`/`MEDIUM`/`HIGH`),
  `customer`, optional assigned `agent`, and tags.
- **Comments** — a chronological message thread per ticket with short-interval
  polling for near real-time updates.
- **Tags** — many-to-many tagging of tickets, plus filtering by tag.
- **Dashboards**
  - **Customer** — status summary and a list of their own tickets.
  - **Agent** — overview metrics (open, unassigned, high priority, total) and a
    searchable, filterable list of every ticket.
- **Seeding** — idempotent demo data via a CLI script or a one-click button on
  the sign-in page.
- **Quality** — Zod validation, ESLint + Prettier, Vitest unit tests, and a
  GitHub Actions CI pipeline.

---

## Tech stack & rationale

| Area       | Choice                              | Why                                                                                   |
| ---------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| Framework  | **Next.js (App Router) + TS**       | One codebase for UI, server components, and the API; great DX and Vercel deploys.     |
| Database   | **PostgreSQL (Neon)**               | Relational data (users ↔ tickets ↔ comments/tags) fits SQL; Neon is serverless.       |
| ORM        | **Prisma**                          | Type-safe queries, first-class migrations, and a clear schema as the source of truth. |
| Auth       | **Auth.js (NextAuth v5)**           | Credentials provider + JWT sessions; role is carried on the token and session.        |
| Validation | **Zod**                             | Single source of truth for input validation, shared across API routes.                |
| UI         | **Tailwind CSS + custom primitives**| Fast, consistent styling without a heavy component dependency.                         |
| Tests      | **Vitest**                          | Fast, ESM-native, minimal config.                                                     |
| CI/CD      | **GitHub Actions + Vercel**         | Automated checks on every push/PR; zero-config hosting.                               |

---

## Architecture

```
Browser
  │  (server components render initial data; client components mutate + poll)
  ▼
Next.js App Router
  ├─ app/(app)/*          Protected pages (guarded by requireUser)
  ├─ app/signin           Public sign-in + demo seeding
  ├─ app/api/*            Route handlers (REST) — auth, tickets, comments, tags, agents, seed
  ├─ lib/services/*       Authorization-aware data access (the only place that touches Prisma)
  ├─ lib/auth-helpers.ts  RBAC guards (page redirects + API HttpErrors)
  └─ lib/validations.ts   Zod schemas
  ▼
Prisma Client (pg driver adapter) ──► Neon PostgreSQL
```

**Read/write split:** server components read through the service layer for fast
initial render, while interactive client components (new ticket, comments,
agent controls) call the REST API. This exercises both paths and keeps
authorization centralized in the service layer.

**RBAC is enforced in depth:**

1. Route-group layout (`app/(app)/layout.tsx`) redirects unauthenticated users.
2. API guards (`requireApiUser` / `requireApiAgent`) return `401`/`403`.
3. The service layer scopes every query by role (customers can only ever read or
   act on their own tickets; cross-tenant reads return `404`, not `403`, to avoid
   leaking existence).

---

## Data model

```
User (id, name, email, passwordHash, role)
  ├─ tickets        (as customer)
  ├─ assignedTickets(as agent)
  └─ comments

Ticket (id, title, description, status, priority, customerId, agentId?)
  ├─ comments
  └─ tags (via TicketTag)

Comment (id, body, ticketId, authorId)
Tag (id, name)
TicketTag (ticketId, tagId)   ← many-to-many join
```

Indexes are added for the common dashboard access patterns (status, priority,
ownership, and chronological comment reads).

---

## Getting started

### Prerequisites

- Node.js **22.x** (see `.nvmrc`; `nvm use` will pick it up)
- A PostgreSQL database (a free [Neon](https://neon.com) project works great)

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cp .env.example .env
```

| Variable       | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `DATABASE_URL` | Pooled connection string (used by the app at runtime).             |
| `DIRECT_URL`   | Direct (non-pooled) connection string (used by Prisma migrations). |
| `AUTH_SECRET`  | Secret for signing sessions. Generate with `npx auth secret`.      |
| `AUTH_URL`     | App base URL (e.g. `http://localhost:3000`).                       |

### 3. Set up the database

```bash
npm run db:migrate   # apply migrations
npm run db:seed      # load demo users, tickets, tags, comments
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

### Demo accounts

All seeded accounts share the password **`Password123!`**.

| Role     | Email               |
| -------- | ------------------- |
| Agent    | `ada@xenfi.dev`     |
| Agent    | `grace@xenfi.dev`   |
| Customer | `alice@example.com` |
| Customer | `bob@example.com`   |
| Customer | `carol@example.com` |

The sign-in page also has a **Seed sample data** button and quick-fill buttons.

---

## Scripts

| Script                | Description                                       |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Start the dev server.                             |
| `npm run build`       | Apply migrations, then build for production.       |
| `npm run start`       | Start the production server.                       |
| `npm run lint`        | ESLint.                                            |
| `npm run typecheck`   | TypeScript, no emit.                               |
| `npm run test`        | Run the Vitest unit suite.                         |
| `npm run db:migrate`  | Create/apply a dev migration.                      |
| `npm run db:deploy`   | Apply migrations (CI/prod).                        |
| `npm run db:seed`     | Seed demo data.                                    |
| `npm run db:studio`   | Open Prisma Studio.                                |

---

## API reference

All endpoints require authentication unless noted. Agent-only endpoints return
`403` for customers.

| Method   | Path                          | Access            | Description                              |
| -------- | ----------------------------- | ----------------- | ---------------------------------------- |
| `GET`    | `/api/tickets`                | user (scoped)     | List tickets (agents can filter/search). |
| `POST`   | `/api/tickets`                | user              | Create a ticket (owned by the caller).   |
| `GET`    | `/api/tickets/[id]`           | owner or agent    | Get one ticket with its thread.          |
| `PATCH`  | `/api/tickets/[id]`           | agent             | Update status/priority/assignee/tags.    |
| `DELETE` | `/api/tickets/[id]`           | agent             | Delete a ticket.                         |
| `GET`    | `/api/tickets/[id]/comments`  | owner or agent    | List the comment thread.                 |
| `POST`   | `/api/tickets/[id]/comments`  | owner or agent    | Add a comment.                           |
| `GET`    | `/api/tags`                   | user              | List tags.                               |
| `POST`   | `/api/tags`                   | agent             | Create a tag.                            |
| `GET`    | `/api/agents`                 | agent             | List agents (for assignment).            |
| `POST`   | `/api/seed`                   | public            | Seed idempotent demo data.               |

---

## Testing

```bash
npm run test
```

The suite (Vitest) covers the core logic with Prisma and auth mocked, so it runs
without a database:

- RBAC guards (`requireApiUser` / `requireApiAgent` status codes).
- Zod validation (ticket and sign-in schemas; enums and defaults).
- Ticket service logic (ownership scoping, 404 hiding, status changes, and
  agent-role assignment validation).

---

## Deployment (Vercel + Neon)

1. Create a Neon project and copy the **pooled** and **direct** connection
  strings.
2. Import this repo into Vercel.
3. In **Project Settings -> Environment Variables**, add:
  - `DATABASE_URL` (pooled)
  - `DIRECT_URL` (direct/non-pooled)
  - `AUTH_SECRET` (generate with `npx auth secret`)
  - `AUTH_URL` (for example, `https://your-app.vercel.app`)
4. Redeploy. The `build` script runs `prisma migrate deploy` before `next build`,
  so migrations are applied automatically on each deploy.
5. After the first deploy, seed data from the sign-in page or run
  `npm run db:seed` against production.

### Fixing `datasource.url property is required` on Vercel

This error means Prisma CLI did not receive any database URL during build.

- Confirm all required env vars exist in Vercel for the environment you are deploying (Preview/Production).
- Ensure variable names are exact (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`).
- If you use Vercel Postgres integration, Prisma also accepts
  `POSTGRES_URL_NON_POOLING`, `POSTGRES_PRISMA_URL`, or `POSTGRES_URL`.
- After updating env vars, trigger a **new deployment** (not just a cacheless rebuild).

---

## CI

`.github/workflows/ci.yml` runs on every push to `main`/`dev` and on pull
requests: install -> `prisma validate` -> lint -> typecheck -> unit tests -> build.

CI uses GitHub repository secrets for build-time env values:
`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, and `AUTH_URL`.

---

## Notable trade-offs

- **Polling over websockets** for the comment thread: simpler and stateless,
  which suits serverless hosting; a websocket/SSE layer could replace it later.
- **Service layer reads in server components** instead of always going through
  HTTP: avoids an extra round trip and centralizes authorization, at the cost of
  two read paths (service for SSR, REST for client mutations/polling).
- **Credentials auth** for a self-contained demo; the structure makes adding
  OAuth providers straightforward.
- **Cross-tenant reads return `404`** rather than `403` to avoid leaking the
  existence of other customers' tickets.
