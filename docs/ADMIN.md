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
| `pnpm test` | Vitest (unit / page tests) |

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
├── vite.config.ts
└── vitest.config.ts
```

Not listed here: `node_modules/`, `dist/`, `.git/`, `.agents/` (Neon skill docs, not project docs).

---

## `src/` folder tree

```
src/
├── main.tsx
├── index.css
├── vite-env.d.ts
│
├── assets/
│   ├── images/
│   └── icons/
│       └── react.svg
│
├── components/
│   ├── ui/                          # pure, dumb, no business logic
│   │   ├── Button/Button.tsx
│   │   ├── Avatar/UserAvatar.tsx
│   │   ├── ThemeToggle/ThemeToggle.tsx
│   │   ├── Dropdown/Dropdown.tsx + DropdownItem.tsx
│   │   ├── Icon/HugeIcon.tsx + NavIcon.tsx
│   │   └── Wave/Wave.tsx
│   │
│   ├── common/                      # admin-aware, reusable across modules
│   │   ├── Button/CustomActionButton.tsx
│   │   ├── Card/PageCard.tsx + PageHeaderCard.tsx
│   │   ├── Dropdowns/RowActionMenu.tsx + UserDropdown.tsx
│   │   ├── Filters/AdminFilterDrawer.tsx
│   │   ├── Forms/                   # Formik-friendly fields
│   │   ├── Loading/
│   │   ├── Meta/PageMeta.tsx
│   │   ├── Modals/AntModal.tsx + DeleteModal.tsx
│   │   ├── Navigation/PageHeader.tsx
│   │   ├── Search/GlobalSearch.tsx
│   │   ├── Tables/DataTable.tsx + DraggableTable.tsx
│   │   └── DateTimeHighlight.tsx
│   │
│   └── index.ts                     # barrel export
│
├── config/
│   ├── index.ts
│   ├── masterData.ts
│   └── navigation.ts
│
├── constants/
│   └── index.ts
│
├── mocks/                           # renamed from data/, dev-only
│   └── dashboardDemo.ts
│
├── hooks/                           # cross-module hooks only
│   ├── useAuth.ts
│   └── useDebounce.ts
│
├── layouts/
│   ├── AppLayout.tsx
│   └── AuthLayout.tsx
│
├── lib/                             # merged old lib/ + utils/
│   ├── access.ts                    # permission helpers
│   ├── auth.ts                      # session + persist + logout
│   ├── api.ts                       # getApiError + toQuery
│   ├── url.ts                       # URL search helpers
│   └── statusClass.ts               # shared status pill classes
│
├── modules/                         # renamed from pages/
│   ├── auth/
│   ├── dashboard/
│   ├── leads/                       # full CRUD + api/leadsApi.ts
│   ├── applications/
│   ├── students/
│   ├── documents/
│   ├── payments/
│   ├── follow-ups/
│   ├── reports/
│   ├── employees/                   # API stays in redux/features/employees
│   ├── users/
│   ├── roles/
│   ├── master-data/
│   ├── audit-logs/
│   ├── activity-history/
│   ├── settings/
│   ├── account/
│   └── profile/
│
├── providers/
│   └── AuthSessionProvider.tsx
│
├── redux/
│   ├── index.ts
│   ├── storage.ts
│   ├── api/
│   │   └── baseApi.ts
│   └── features/
│       ├── hooks.ts
│       ├── rootReducer.ts
│       ├── store.ts                 # also imports module injectEndpoints
│       ├── activities/activitiesApi.ts
│       ├── auditLogs/auditLogsApi.ts
│       ├── auth/authApi.ts + authSlice.ts
│       ├── employees/employeesApi.ts
│       ├── masterData/masterDataApi.ts
│       ├── pipeline/pipelineApi.ts  # cross-cutting pipeline reads
│       ├── roles/rolesApi.ts
│       ├── search/searchApi.ts
│       ├── sidebar/sidebarSlice.ts
│       └── users/usersApi.ts
│
├── routes/
│   ├── routes.tsx
│   ├── ProtectedRoute.tsx
│   └── PermissionRoute.tsx
│
├── styles/
│   ├── admin.ts
│   └── antd.css
│
├── theme/
│   └── ThemeProvider.tsx
│
├── types/
│   └── index.ts                     # shared/global types only
│
└── tests/
    ├── setup.ts
    ├── lib/access.test.ts + auth.test.ts
    ├── hooks/useAuth.test.tsx
    └── modules/leads/LeadsPage.test.tsx
```

### Folders that do **not** exist

| Expected | Reality |
|----------|---------|
| `pages/` | Renamed to `modules/` |
| `data/` | Renamed to `mocks/` |
| `utils/` | Merged into `lib/` |
| `components/shared/` | Moved into `common/Modals` + `common/Search` |
| `services/` | HTTP lives in `redux/` + module `api/` folders |
| `store/` | Store is `redux/features/store.ts` |
| `dao/` | Not used on the frontend |

---

## Modules (`src/modules/`)

Each feature is its own folder. Most export from `index.ts`.

### Full CRUD modules

These share the same shape:

```
modules/<feature>/
├── index.ts
├── types.ts
├── pages/<Feature>Page.tsx
├── components/
│   ├── <Feature>Filters.tsx
│   ├── <Feature>FormModal.tsx
│   └── <Feature>sTable.tsx
├── utils/
│   ├── <feature>Columns.tsx
│   └── <feature>Status.ts
└── api/<feature>Api.ts              # RTK Query injectEndpoints
```

| Folder | Page | Route | Permission | Module API |
|--------|------|-------|------------|------------|
| `leads/` | Leads | `/leads` | `lead:view` | `leadsApi.ts` |
| `applications/` | Applications | `/applications` | `lead:convert` | `applicationsApi.ts` |
| `students/` | Students | `/students` | `lead:convert` | `studentsApi.ts` |
| `documents/` | Documents | `/documents` | `document:view` | `documentsApi.ts` |
| `payments/` | Payments | `/payments` | `payment:view` | `paymentsApi.ts` |
| `follow-ups/` | Follow-ups | `/follow-ups` | `follow_up:view` | `followUpsApi.ts` |
| `reports/` | Reports | `/reports` | `report:view` | `reportsApi.ts` |

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

### `ui/` — pure primitives (no business logic)

| Folder | Files | Role |
|--------|-------|------|
| `Button/` | `Button.tsx` | Styled button |
| `Avatar/` | `UserAvatar.tsx` | Initials / photo |
| `ThemeToggle/` | `ThemeToggle.tsx` | Light / dark |
| `Dropdown/` | `Dropdown.tsx`, `DropdownItem.tsx` | Menu primitive |
| `Icon/` | `HugeIcon.tsx`, `NavIcon.tsx` | Icon wrappers |
| `Wave/` | `Wave.tsx` | Loading wave |

### `common/` — admin-aware, reusable across modules

| Folder | Files | Role |
|--------|-------|------|
| `Button/` | `CustomActionButton.tsx` | Row / toolbar actions |
| `Card/` | `PageCard.tsx`, `PageHeaderCard.tsx` | Page shells |
| `Dropdowns/` | `RowActionMenu.tsx`, `UserDropdown.tsx` | Menus |
| `Filters/` | `AdminFilterDrawer.tsx` | Shared filter drawer |
| `Forms/` | `FormInput`, `FormSelect`, `FormTextArea`, `FormDatePicker`, `InputError`, `SwitchStatus`, `SwitchStatus2` | Formik-friendly fields |
| `Loading/` | `Loader.tsx`, `PageLoader.tsx`, `Spinner.tsx` | Loading states |
| `Meta/` | `PageMeta.tsx` | Page title / helmet |
| `Modals/` | `AntModal.tsx` + CSS, `DeleteModal.tsx` | Shared + confirm delete |
| `Navigation/` | `PageHeader.tsx` | In-page header |
| `Search/` | `GlobalSearch.tsx` | Command/search across pages |
| `Tables/` | `DataTable.tsx`, `DraggableTable.tsx` + CSS | Tables |
| (root) | `DateTimeHighlight.tsx` | Date display |

Import short paths from `@/components` (barrel) or `@/components/ui` / `@/components/common/...`.

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

HTTP is split:

- Cross-cutting / admin APIs stay in `redux/features/*`
- Pipeline CRUD modules own their slices under `modules/*/api/` and register via `injectEndpoints` (imported from `store.ts`)

| Frontend API | Typical pages |
|--------------|----------------|
| `authApi` + `authSlice` | Login, forgot, reset, session |
| `usersApi` | Users |
| `employeesApi` | Employees |
| `rolesApi` | Roles |
| `masterDataApi` | Master data |
| `pipelineApi` | Cross-cutting pipeline reads |
| `leadsApi` … `reportsApi` | Co-located in each CRUD module |
| `searchApi` | Global search |
| `activitiesApi` | Activity history |
| `auditLogsApi` | Audit logs |
| `sidebarSlice` | Sidebar UI state only |

Dashboard, settings, account, and profile still use local/demo data where no dedicated API exists.

---

## How a typical CRUD page is wired

Example: Leads

1. Route `/leads` in `routes.tsx` (wrapped by `PermissionRoute` + `lead:view`)
2. Nav item in `config/navigation.ts`
3. Page: `modules/leads/pages/LeadsPage.tsx`
4. Table / filters / modal under `modules/leads/components/`
5. Column + status helpers under `modules/leads/utils/`
6. Shared table/form pieces from `components/common/`
7. API: `modules/leads/api/leadsApi.ts` (registered in `redux/features/store.ts`)

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

Helpers: `src/lib/access.ts`, `src/lib/auth.ts`, `src/hooks/useAuth.ts`.

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
| Files under `src/` | ~190 |
| Feature modules | 19 |
| Full CRUD modules | 7 |
| Redux feature APIs | 9 + auth + sidebar |
| Co-located module APIs | 7 |
| Shared common component groups | 12 |
