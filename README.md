# Campusly Admin

Staff CRM for education consultancies. Counselors and admins use it to move a student from first inquiry through application, documents, payments, and follow-ups, and to manage employees, roles, and master data.

Package name: `admin.educational.crm`. The in-app title is **EduConsult CRM**.

The API lives in the sibling repo [`campusly-crm-api`](../campusly-crm-api) (Express + Prisma). This app talks to it with cookie sessions.

## Features

| Area       | What staff can do                                              |
| ---------- | -------------------------------------------------------------- |
| Pipeline   | Leads, applications, students, documents, payments, follow-ups |
| Operations | Reports and employee records                                   |
| Admin      | Users, roles and permissions, audit log, master data, settings |
| Account    | Profile and password change                                    |
| Search     | Global search across records                                   |

Routes and sidebar items are permission-gated. A user only sees pages their role allows.

## Stack

| Layer        | Choice                                  |
| ------------ | --------------------------------------- |
| UI           | React 19, Vite 8, TypeScript            |
| Styling      | Tailwind CSS 4, Ant Design 6            |
| State / HTTP | Redux Toolkit, RTK Query, redux-persist |
| Forms        | Formik + Yup                            |
| Routing      | React Router 7                          |
| Icons        | Hugeicons                               |
| Tests        | Vitest, Testing Library                 |
| Lint         | Oxlint                                  |

## Requirements

- Node.js 20 or newer
- [pnpm](https://pnpm.io/)
- A running [`campusly-crm-api`](../campusly-crm-api) on port `4000` (local development)

## Getting started

```bash
pnpm install
cp .env.example .env.development
pnpm dev
```

Open [http://localhost:4001](http://localhost:4001).

Leave `VITE_API_URL` empty in local development. Vite proxies `/api` to `http://localhost:4000`, so the browser stays on the admin origin and session cookies work.

On the API, set `CLIENT_ORIGIN=http://localhost:4001` so CORS allows this app. The seeded local admin is created by the API seed (`campusly_ceo@gmail.com` / username `root`, unless those values were changed in the API env).

## Environment

Copy `.env.example` into `.env.development` or `.env.production`. Vite only exposes variables prefixed with `VITE_`.

| Variable                | Purpose                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`          | API origin. Empty in local dev (uses the Vite `/api` proxy). Set to the API origin in production if the app is not proxied. |
| `VITE_IMAGE_ACCESS_URL` | Base URL for stored images (Cloudinary or similar).                                                                         |

Production on Vercel rewrites `/api/*` to the deployed API. See `vercel.json`.

## Scripts

| Command          | What it does                     |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Dev server on `0.0.0.0:4001`     |
| `pnpm build`     | Typecheck, then production build |
| `pnpm preview`   | Serve the production build       |
| `pnpm typecheck` | `tsc -b`                         |
| `pnpm lint`      | Oxlint                           |
| `pnpm test`      | Vitest                           |

## Project layout

```
src/
├── main.tsx              # entry (there is no App.tsx)
├── components/
│   ├── ui/               # primitives
│   └── common/           # shared admin widgets (tables, forms, modals)
├── config/               # navigation and master-data nav
├── layouts/              # AppLayout, AuthLayout
├── lib/                  # auth, permissions, API helpers
├── modules/              # one folder per feature
├── redux/                # store, RTK Query base API, cross-cutting endpoints
├── routes/               # router, ProtectedRoute, PermissionRoute
└── theme/
```

Path alias: `@` → `src/`.

Each pipeline feature (`leads`, `applications`, `students`, `documents`, `payments`, `follow-ups`, `reports`) owns its page, table, filters, form modal, and `api/*Api.ts`. Admin endpoints that several screens share (auth, users, employees, roles, master data, search, audit, activities) live under `src/redux/features/`.

Folder-by-folder map, route table, and how a CRUD page is wired: [docs/ADMIN.md](docs/ADMIN.md).

## Auth

Sign-in stores a session cookie (`crm_session`) set by the API. Requests use `credentials: 'include'`.

- `ProtectedRoute` sends guests to `/login` and signed-in users away from auth pages.
- `PermissionRoute` checks a permission such as `lead:view` before rendering a page.
- A `401` clears the persisted session and returns the user to `/login`.

## Main routes

| Path                                                           | Page                          |
| -------------------------------------------------------------- | ----------------------------- |
| `/login`                                                       | Sign in                       |
| `/forgot-password`, `/reset-password`                          | Password recovery             |
| `/dashboard`                                                   | Overview (`/` redirects here) |
| `/leads` … `/follow-ups`                                       | Pipeline                      |
| `/reports`, `/employees`                                       | Operations                    |
| `/users`, `/roles`, `/audit-logs`, `/master-data`, `/settings` | Admin                         |
| `/profile`, `/account`                                         | Signed-in account             |

## Deployment

The admin is set up for Vercel:

1. `pnpm build`
2. SPA fallback so client routes resolve to `index.html`
3. `/api/:path*` is rewritten to the API host in `vercel.json`

Set `VITE_*` values in the host’s environment for the production build.
