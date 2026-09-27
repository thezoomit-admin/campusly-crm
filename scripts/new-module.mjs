#!/usr/bin/env node
/**
 * Scaffold a Campusly Admin CRUD module (same shape as leads).
 *
 *   pnpm new:module universities
 *   pnpm new:module follow-ups --group pipeline --icon bell
 *   pnpm new:module visas --no-wire
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')

const NAV_ICONS = [
  'grid',
  'users',
  'file',
  'graduate',
  'folder',
  'card',
  'bell',
  'chart',
  'id',
  'user',
  'shield',
  'database',
  'settings',
  'activity',
]

const NAV_GROUPS = ['pipeline', 'operations', 'admin']

function fail(message) {
  console.error(`\n  ${message}\n`)
  process.exit(1)
}

function printHelp() {
  console.log(`
  Scaffold a CRUD module for campusly-crm

  Usage
    pnpm new:module <name> [options]

  Examples
    pnpm new:module universities
    pnpm new:module follow-ups --group pipeline --icon bell
    pnpm new:module visas --permission visa:view --no-wire

  Options
    --group <id>         Nav group: ${NAV_GROUPS.join(', ')}  (default: pipeline)
    --icon <name>        Sidebar icon: ${NAV_ICONS.join(', ')}  (default: file)
    --permission <key>   Permission string  (default: <singular>:view)
    --api <path>         List endpoint      (default: /pipeline/<kebab>)
    --no-wire            Create files only; skip routes / nav / store / tags
    --dry-run            Print paths, write nothing
    --help               Show this help
`)
}

function parseArgs(argv) {
  const args = { positional: [], flags: {} }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--help' || token === '-h') {
      args.flags.help = true
      continue
    }
    if (token === '--no-wire') {
      args.flags.noWire = true
      continue
    }
    if (token === '--dry-run') {
      args.flags.dryRun = true
      continue
    }
    if (token.startsWith('--') && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args.flags[token.slice(2)] = argv[i + 1]
      i += 1
      continue
    }
    if (token.startsWith('--')) fail(`Unknown flag: ${token}. Use --help.`)
    args.positional.push(token)
  }
  return args
}

function toKebab(value) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

function kebabToCamel(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase())
}

function kebabToPascal(kebab) {
  const camel = kebabToCamel(kebab)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

function kebabToTitle(kebab) {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function singularKebab(kebab) {
  if (kebab.endsWith('ies')) return `${kebab.slice(0, -3)}y`
  if (kebab.endsWith('ses')) return kebab.slice(0, -2)
  if (kebab.endsWith('s') && !kebab.endsWith('ss')) return kebab.slice(0, -1)
  return kebab
}

function namesFrom(raw) {
  const kebab = toKebab(raw)
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(kebab)) {
    fail(`Invalid name "${raw}". Use something like universities or follow-ups.`)
  }

  const singular = singularKebab(kebab)
  const camel = kebabToCamel(kebab)
  const pascal = kebabToPascal(kebab)
  const singularCamel = kebabToCamel(singular)
  const singularPascal = kebabToPascal(singular)
  const title = kebabToTitle(kebab)
  const singularTitle = kebabToTitle(singular)

  return {
    kebab,
    singular,
    camel,
    pascal,
    singularCamel,
    singularPascal,
    title,
    singularTitle,
    permission: `${singular.replace(/-/g, '_')}:view`,
    tag: pascal,
    apiPath: `/pipeline/${kebab}`,
    route: `/${kebab}`,
    folder: join(SRC, 'modules', kebab),
  }
}

function templates(n) {
  const addLabel = `Add ${n.singularTitle.toLowerCase()}`

  return {
    [`index.ts`]: `export { default as ${n.pascal}Page } from './pages/${n.pascal}Page'
export { default as ${n.singularPascal}Filters } from './components/${n.singularPascal}Filters'
export { default as ${n.pascal}Table } from './components/${n.pascal}Table'
export { default as ${n.singularPascal}FormModal } from './components/${n.singularPascal}FormModal'
export type { ${n.singularPascal}Row, ${n.singularPascal}FormValues } from './types'
`,

    [`types.ts`]: `export type ${n.singularPascal}Row = Record<string, string>

export type ${n.singularPascal}FormValues = {
  name: string
  status: string
}
`,

    [`pages/${n.pascal}Page.tsx`]: `import { Button } from 'antd'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useDebounce } from '@/hooks/useDebounce'
import { useList${n.pascal}Query } from '../api/${n.camel}Api'
import { adminCard, adminPage, muted } from '../../../styles/admin'
import ${n.singularPascal}Filters from '../components/${n.singularPascal}Filters'
import ${n.singularPascal}FormModal from '../components/${n.singularPascal}FormModal'
import ${n.pascal}Table from '../components/${n.pascal}Table'
import type { ${n.singularPascal}Row } from '../types'

export default function ${n.pascal}Page() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isFetching, isError } = useList${n.pascal}Query({
    search: debouncedSearch,
  })

  const rows = useMemo(() => (data?.items || []) as ${n.singularPascal}Row[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="${n.title}"
        description="Manage ${n.title.toLowerCase()} from the admin pipeline."
      />
      <PageHeader
        title="${n.title}"
        subtitle="Manage ${n.title.toLowerCase()} from the admin pipeline."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: '${n.title}' }]}
        extra={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            ${addLabel}
          </Button>
        }
      />

      <div className={\`\${adminCard} grid gap-3\`}>
        <${n.singularPascal}Filters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <${n.pascal}Table
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <p className={\`\${muted} mt-3 mb-0 text-sm\`}>
        Demo list data — wire create/update when ${n.singularTitle.toLowerCase()} APIs are ready.
      </p>

      <${n.singularPascal}FormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
`,

    [`components/${n.singularPascal}Filters.tsx`]: `import { FormInput } from '@/components/common/Forms'

type ${n.singularPascal}FiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export default function ${n.singularPascal}Filters({
  search,
  onSearchChange,
  placeholder = 'Search ${n.title.toLowerCase()}…',
}: ${n.singularPascal}FiltersProps) {
  return (
    <FormInput.Search
      allowClear
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      onSearch={onSearchChange}
      placeholder={placeholder}
    />
  )
}
`,

    [`components/${n.singularPascal}FormModal.tsx`]: `import { Button, Form } from 'antd'
import { FormInput } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import type { ${n.singularPascal}FormValues } from '../types'

type ${n.singularPascal}FormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: ${n.singularPascal}FormValues) => void
}

export default function ${n.singularPascal}FormModal({ open, onClose, onSubmit }: ${n.singularPascal}FormModalProps) {
  const [form] = Form.useForm<${n.singularPascal}FormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="${addLabel}" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <FormInput name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]} placeholder="Name" />
        <FormInput name="status" label="Status" placeholder="e.g. New, Active" />
        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </div>
      </Form>
    </AntModal>
  )
}
`,

    [`components/${n.pascal}Table.tsx`]: `import { DataTable } from '@/components/common/Tables'
import type { ${n.singularPascal}Row } from '../types'
import { ${n.singularCamel}Columns } from '../utils/${n.singularCamel}Columns'

type ${n.pascal}TableProps = {
  data: ${n.singularPascal}Row[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function ${n.pascal}Table({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: ${n.pascal}TableProps) {
  return (
    <DataTable
      loading={loading}
      data={data}
      columns={${n.singularCamel}Columns}
      rowKey="id"
      isPaginate
      currentPage={page}
      setCurrentPage={onPageChange}
      limit={limit}
      setLimit={onLimitChange}
      total={total}
      showSizeChanger={total > 10}
    />
  )
}
`,

    [`utils/${n.singularCamel}Columns.tsx`]: `import type { ColumnsType } from 'antd/es/table'
import type { ${n.singularPascal}Row } from '../types'
import { ${n.singularCamel}StatusClass } from './${n.singularCamel}Status'

export const ${n.singularCamel}Columns: ColumnsType<${n.singularPascal}Row> = [
  { title: 'Name', dataIndex: 'name', key: 'name', render: (value: string) => value || '—' },
  { title: 'Owner', dataIndex: 'owner', key: 'owner', render: (value: string) => value || '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (value: string) => <span className={${n.singularCamel}StatusClass(value || '')}>{value || '—'}</span>,
  },
  { title: 'Updated', dataIndex: 'updated', key: 'updated', render: (value: string) => value || '—' },
]
`,

    [`utils/${n.singularCamel}Status.ts`]: `export { statusClass as ${n.singularCamel}StatusClass } from '@/lib/statusClass'
`,

    [`api/${n.camel}Api.ts`]: `import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { ${n.singularPascal}Row } from '../types'

export type ${n.singularPascal}ListParams = {
  search?: string
}

export type ${n.singularPascal}ListResponse = {
  items: ${n.singularPascal}Row[]
  total: number
}

const ${n.camel}Api = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    list${n.pascal}: builder.query<${n.singularPascal}ListResponse, ${n.singularPascal}ListParams | void>({
      query: (params) => \`${n.apiPath}\${toQuery({ search: params?.search })}\`,
      providesTags: [{ type: '${n.tag}', id: 'LIST' }],
    }),
  }),
})

export const { useList${n.pascal}Query } = ${n.camel}Api
`,
  }
}

function testTemplate(n) {
  return `import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ${n.pascal}Page } from '@/modules/${n.kebab}'
import { store } from '@/redux/features/store'

vi.mock('@/modules/${n.kebab}/api/${n.camel}Api', () => ({
  useList${n.pascal}Query: () => ({
    data: {
      items: [{ id: '1', name: 'Sample ${n.singularTitle}', status: 'New' }],
      total: 1,
    },
    isFetching: false,
    isError: false,
  }),
}))

describe('${n.pascal}Page', () => {
  it('renders the ${n.title.toLowerCase()} heading and list chrome', () => {
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <${n.pascal}Page />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    )

    expect(screen.getAllByText('${n.title}').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /add ${n.singularTitle.toLowerCase()}/i })).toBeTruthy()
  })
})
`
}

function writeFile(path, contents, dryRun, created) {
  created.push(path)
  if (dryRun) return
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents, 'utf8')
}

function insertOnce(source, needle, insert, label) {
  if (source.includes(insert.trim())) return source
  if (!source.includes(needle)) fail(`Could not wire ${label}: marker not found.`)
  return source.replace(needle, `${insert}${needle}`)
}

function wireFiles(n, { group, icon }, dryRun, patched) {
  const routesPath = join(SRC, 'routes', 'routes.tsx')
  const navPath = join(SRC, 'config', 'navigation.ts')
  const storePath = join(SRC, 'redux', 'features', 'store.ts')
  const baseApiPath = join(SRC, 'redux', 'api', 'baseApi.ts')

  let routes = readFileSync(routesPath, 'utf8')
  let nav = readFileSync(navPath, 'utf8')
  let store = readFileSync(storePath, 'utf8')
  let baseApi = readFileSync(baseApiPath, 'utf8')

  routes = insertOnce(
    routes,
    `import { UsersPage } from '../modules/users/index'`,
    `import { ${n.pascal}Page } from '../modules/${n.kebab}'\n`,
    'routes import',
  )
  routes = insertOnce(
    routes,
    `          {
            element: <PermissionRoute permission="employee:create" />,`,
    `          {
            element: <PermissionRoute permission="${n.permission}" />,
            children: [{ path: '${n.route}', element: <${n.pascal}Page /> }],
          },
`,
    'routes path',
  )

  const groupMarker = {
    pipeline: `      { to: '/activity-history', label: 'Activity History', icon: 'activity', permission: 'activity:view' },`,
    operations: `      { to: '/employees', label: 'Employees', icon: 'id', permission: 'employee:view' },`,
    admin: `      { to: '/settings', label: 'Settings', icon: 'settings', permission: 'settings:view' },`,
  }[group]

  nav = insertOnce(
    nav,
    groupMarker,
    `      { to: '${n.route}', label: '${n.title}', icon: '${icon}', permission: '${n.permission}' },\n`,
    'navigation item',
  )
  nav = insertOnce(
    nav,
    `  '/settings': ['config', 'preferences'],`,
    `  '${n.route}': ['${n.singular}'],\n`,
    'search keywords',
  )

  store = insertOnce(
    store,
    `import '@/modules/reports/api/reportsApi'`,
    `import '@/modules/${n.kebab}/api/${n.camel}Api'\n`,
    'store import',
  )

  if (!baseApi.includes(`'${n.tag}'`)) {
    baseApi = insertOnce(baseApi, `    'Reports',`, `    '${n.tag}',\n`, 'RTK tag')
  }

  patched.push(routesPath, navPath, storePath, baseApiPath)
  if (dryRun) return

  writeFileSync(routesPath, routes, 'utf8')
  writeFileSync(navPath, nav, 'utf8')
  writeFileSync(storePath, store, 'utf8')
  writeFileSync(baseApiPath, baseApi, 'utf8')
}

function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  if (flags.help || positional.length === 0) {
    printHelp()
    if (positional.length === 0 && !flags.help) process.exit(1)
    return
  }

  const name = positional[0]
  const names = namesFrom(name)
  names.permission = flags.permission || names.permission
  names.apiPath = flags.api || names.apiPath

  const group = flags.group || 'pipeline'
  const icon = flags.icon || 'file'
  if (!NAV_GROUPS.includes(group)) fail(`Invalid --group "${group}". Use: ${NAV_GROUPS.join(', ')}`)
  if (!NAV_ICONS.includes(icon)) fail(`Invalid --icon "${icon}". Use: ${NAV_ICONS.join(', ')}`)

  if (existsSync(names.folder)) fail(`Module already exists: src/modules/${names.kebab}`)

  const files = templates(names)
  const created = []
  const patched = []

  for (const [rel, contents] of Object.entries(files)) {
    writeFile(join(names.folder, rel), contents, flags.dryRun, created)
  }
  writeFile(
    join(SRC, 'tests', 'modules', names.kebab, `${names.pascal}Page.test.tsx`),
    testTemplate(names),
    flags.dryRun,
    created,
  )

  if (!flags.noWire) {
    wireFiles(names, { group, icon }, flags.dryRun, patched)
  }

  const prefix = flags.dryRun ? 'Would create' : 'Created'
  console.log(`\n  ${prefix} ${names.title} module\n`)
  for (const path of created) {
    console.log(`    + ${path.slice(ROOT.length + 1)}`)
  }
  if (patched.length) {
    console.log('')
    for (const path of patched) {
      console.log(`    ~ ${path.slice(ROOT.length + 1)}`)
    }
  }
  console.log(`
  Route       ${names.route}
  Permission  ${names.permission}
  API         ${names.apiPath}
  Nav group   ${group}
`)
  if (!flags.noWire) {
    console.log('  Next: add the permission on the API/roles side, then fill in columns and form fields.\n')
  }
}

main()
