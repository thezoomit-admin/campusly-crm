# Campusly Admin — Project Details & Folder Structure

Admin panel package name: `admin.educational.crm`  
Repo folder: `campusly-crm`  
Entry file: `src/main.tsx` (no `App.tsx`)

---

## Overview

Campusly Admin is the frontend CRM used by staff to manage leads, applications, students, documents, payments, employees, users, roles, and master data.

| Item | Value |
|------|--------|
| Stack | Vite 8, React 19, TypeScript, Redux Toolkit + RTK Query, Ant Design 6, Tailwind 4 |
| Forms | Formik + Yup |
| Router | React Router 7 |
| Icons | Hugeicons |
| Dev server | `http://localhost:4001` |
| Deploy | Vercel (`vercel.json` SPA rewrite + `/api` proxy) |

### Scripts

| Command | What it does |
|---------|----------------|
| `pnpm dev` | Vite on `0.0.0.0:4001` |
| `pnpm build` | Typecheck + production build |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | Oxlint |
| `pnpm typecheck` | `tsc -b` |

---

## Top-level files

```
campusly-crm/
├── docs/
│   └── ADMIN.md                 ← this file
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/                         ← all application code
├── .env.development
├── .env.production
├── .gitignore
├── .oxlintrc.json
├── index.html
├── jsconfig.json
├── package.json
├── README.md                    ← only the title: admin-educational-crm
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

Not listed here: `node_modules/`, `dist/`, `.git/`, `.agents/` (Neon skill docs, not project docs).

---

## `src/` folder tree

```
src/
├── main.tsx                     # React entry
├── index.css
├── vite-env.d.ts
│
├── assets/                      # static images
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
│
├── components/                  # shared UI
│   ├── common/                  # admin building blocks
│   ├── shared/                  # DeleteModal, GlobalSearch
│   └── ui/                      # primitives (Button, Avatar, ThemeToggle)
│
├── config/
│   ├── index.ts
│   ├── masterData.ts            # master-data catalogs / nav groups
│   └── navigation.ts            # sidebar groups + searchable pages
│
├── constants/
│   └── index.ts
│
├── data/
│   └── dashboardDemo.ts         # dashboard demo/sample data
│
├── hooks/
│   └── useAuth.ts
│
├── layouts/
│   ├── AppLayout.tsx            # logged-in shell (sidebar + header)
│   └── AuthLayout.tsx           # login / forgot / reset
│
├── lib/
│   ├── access.ts                # permission helpers
│   ├── auth-session.ts
│   ├── authStorage.ts
│   └── url-search.ts
│
├── pages/                       # 19 feature modules (see below)
│
├── providers/
│   └── AuthSessionProvider.tsx
│
├── redux/                       # store + all HTTP (no services/ folder)
│   ├── index.ts
│   ├── storage.ts
│   ├── api/
│   │   └── baseApi.ts
│   └── features/
│       ├── hooks.ts
│       ├── rootReducer.ts
│       ├── store.ts
│       ├── activities/activitiesApi.ts
│       ├── auditLogs/auditLogsApi.ts
│       ├── auth/authApi.ts + authSlice.ts
│       ├── employees/employeesApi.ts
│       ├── masterData/masterDataApi.ts
│       ├── pipeline/pipelineApi.ts
│       ├── roles/rolesApi.ts
│       ├── search/searchApi.ts
│       ├── sidebar/sidebarSlice.ts
│       └── users/usersApi.ts
│
├── routes/
│   ├── routes.tsx               # all app routes
│   ├── ProtectedRoute.tsx       # auth / guest-only gate
│   └── PermissionRoute.tsx      # permission gate
│
├── styles/
│   ├── admin.ts
│   └── antd.css
│
├── theme/
│   └── ThemeProvider.tsx
│
├── types/
│   └── index.ts
│
└── utils/
    ├── apiError.ts
    ├── query.ts
    └── statusClass.ts
```

### Folders that do **not** exist

| Expected | Reality |
|----------|---------|
| `services/` / `api/` | HTTP lives in `redux/api` + `redux/features/*/…Api.ts` |
| `store/` | Store is `redux/features/store.ts` |
| `docs/` (old) | This `docs/` folder is new |
| `dao/` | Not used on the frontend |

---

## Pages (`src/pages/`)

Each feature is its own folder. Most export from `index.ts`.

### Full CRUD modules

These share the same shape:

```
pages/<feature>/
├── index.ts
├── types.ts
├── pages/<Feature>Page.tsx
├── components/
│   ├── <Feature>Filters.tsx
│   ├── <Feature>FormModal.tsx
│   └── <Feature>sTable.tsx
└── utils/
    ├── <feature>Columns.tsx
    └── <feature>Status.ts
```

| Folder | Page | Route | Permission |
|--------|------|-------|------------|
| `leads/` | Leads | `/leads` | `lead:view` |
| `applications/` | Applications | `/applications` | `lead:convert` |
| `students/` | Students | `/students` | `lead:convert` |
| `documents/` | Documents | `/documents` | `document:view` |
| `payments/` | Payments | `/payments` | `payment:view` |
| `follow-ups/` | Follow-ups | `/follow-ups` | `follow_up:view` |
| `reports/` | Reports | `/reports` | `report:view` |

### Thinner modules (mostly `pages/` + `index.ts`)

| Folder | Files | Route(s) | Permission |
|--------|-------|----------|------------|
| `auth/` | `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage` | `/login`, `/forgot-password`, `/reset-password` | guest only |
| `dashboard/` | `DashboardPage` | `/dashboard` | logged in |
| `employees/` | `EmployeesPage`, `EmployeeCreatePage`, `EmployeeProfilePage` | `/employees`, `/employees/new`, `/employees/:id`, `/employees/:id/edit` | `employee:view` / `create` / `edit` |
| `users/` | `UsersPage` | `/users` | `user:view` |
| `roles/` | `RolesPage` | `/roles` | `role:view` |
| `master-data/` | `MasterDataPage`, `MasterDataItemsPage` | `/master-data`, `/master-data/:groupSlug`, `/master-data/:groupSlug/:categoryKey` | `master_data:view` |
| `audit-logs/` | `AuditLogsPage` | `/audit-logs` | `audit:view` |
| `activity-history/` | `ActivityHistoryPage` | `/activity-history` | `activity:view` |
| `settings/` | `SettingsPage` | `/settings` | `settings:view` |
| `account/` | `AccountPage` | `/account` | logged in |
| `profile/` | `ProfilePage` | `/profile` | logged in |

---

## Components (`src/components/`)

### `common/` — reusable admin blocks

| Folder | Files | Role |
|--------|-------|------|
| `Button/` | `CustomActionButton.tsx` | Row / toolbar actions |
| `Card/` | `PageCard.tsx`, `PageHeaderCard.tsx` | Page shells |
| `Dropdowns/` | `RowActionMenu.tsx`, `UserDropdown.tsx` | Menus |
| `Filters/` | `AdminFilterDrawer.tsx` | Shared filter drawer |
| `Forms/` | `FormInput`, `FormSelect`, `FormTextArea`, `FormDatePicker`, `InputError`, `SwitchStatus`, `SwitchStatus2` | Formik-friendly fields |
| `Icons/` | `HugeIcon.tsx` | Icon wrapper |
| `Loading/` | `Loader.tsx`, `PageLoader.tsx`, `Spinner.tsx` | Loading states |
| `Meta/` | `PageMeta.tsx` | Page title / helmet |
| `Modals/` | `AntModal.tsx` + CSS | Shared modal |
| `Navigation/` | `PageHeader.tsx` | In-page header |
| `Tables/` | `DataTable.tsx`, `DraggableTable.tsx` + CSS | Tables |
| (root) | `DateTimeHighlight.tsx` | Date display |

### `shared/`

- `DeleteModal.tsx` — confirm delete
- `GlobalSearch.tsx` — command/search across pages

### `ui/`

- `Button.tsx`, `NavIcon.tsx`, `ThemeToggle.tsx`, `UserAvatar.tsx`, `Wave.tsx`
- `dropdown/Dropdown.tsx`, `dropdown/DropdownItem.tsx`

---

## Routes & sidebar

Defined in:

- Routes: `src/routes/routes.tsx`
- Sidebar: `src/config/navigation.ts`

### Auth (guest only, `AuthLayout`)

| Path | Page |
|------|------|
| `/login` | Login |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |

### App (logged in, `AppLayout`)

Sidebar groups from `APP_NAV_GROUPS`:

**Dashboards**

- `/dashboard` — Overview

**Pipeline**

- `/leads`
- `/applications`
- `/students`
- `/documents`
- `/payments`
- `/follow-ups`
- `/activity-history`

**Operations**

- `/reports`
- `/employees` (+ `/employees/new`, `/employees/:id`, `/employees/:id/edit`)

**Admin**

- `/users`
- `/roles`
- `/audit-logs`
- `/master-data` (+ group / category slugs)
- `/settings`

**Account (not in main sidebar groups, searchable)**

- `/profile`
- `/account` (change password)

`/` redirects to `/dashboard`. Unknown paths redirect to `/login`.

---

## Redux / API map

There is no `services/` folder. Each backend-facing feature has an RTK Query API slice.

| Frontend API | Typical pages |
|--------------|----------------|
| `authApi` + `authSlice` | Login, forgot, reset, session |
| `usersApi` | Users |
| `employeesApi` | Employees |
| `rolesApi` | Roles |
| `masterDataApi` | Master data |
| `pipelineApi` | Pipeline-related CRM data |
| `searchApi` | Global search |
| `activitiesApi` | Activity history |
| `auditLogsApi` | Audit logs |
| `sidebarSlice` | Sidebar UI state only |

UI-only / no dedicated API slice yet:

- Leads, students, applications, documents, follow-ups, payments, reports
- Dashboard, settings, account, profile

Those pages exist in the UI. Data may come from `pipelineApi` / master-data, or still be local/demo.

---

## How a typical CRUD page is wired

Example: Leads

1. Route `/leads` in `routes.tsx` (wrapped by `PermissionRoute` + `lead:view`)
2. Nav item in `config/navigation.ts`
3. Page: `pages/leads/pages/LeadsPage.tsx`
4. Table / filters / modal under `pages/leads/components/`
5. Column + status helpers under `pages/leads/utils/`
6. Shared table/form pieces from `components/common/`
7. API (if connected) from `redux/features/`

---

## Auth & permission flow

```
main.tsx
  → AuthSessionProvider + Redux store
  → router (routes.tsx)

ProtectedRoute
  → must be logged in (or guestOnly on auth pages)
  → AppLayout or AuthLayout

PermissionRoute
  → checks a permission string (e.g. lead:view)
  → page renders only if the session has that permission
```

Helpers: `src/lib/access.ts`, `src/hooks/useAuth.ts`.

---

## Backend pairing (for context)

Admin talks to `campusly-crm-api` (Express + Prisma). Matching modules today:

| Admin page | API module |
|------------|------------|
| auth | `modules/auth` |
| users | `modules/users` |
| employees | `modules/employees` |
| roles | `modules/roles` |
| master-data | `modules/master-data` |
| audit-logs | `modules/audit` |
| activity-history | `modules/activities` |
| search | `modules/search` |
| pipeline | `modules/pipeline` |

---

## Quick counts

| Area | Count |
|------|--------|
| Files under `src/` | ~175 |
| Page modules | 19 |
| Full CRUD modules | 7 |
| Redux API slices | 9 feature APIs + auth + sidebar |
| Shared common component groups | 11 |
