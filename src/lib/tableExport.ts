import { config } from '@/config'

export type ExportTable = {
  title: string
  columns: Array<{ header: string; key: string }>
  rows: Array<Record<string, string | number>>
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string; message?: string }
    if (typeof body.error === 'string' && body.error.trim()) return body.error
    if (typeof body.message === 'string' && body.message.trim()) return body.message
  } catch {
    // non-JSON error body
  }
  return fallback
}

export function withExportFormat(path: string, format: 'xlsx' | 'json') {
  const join = path.includes('?') ? '&' : '?'
  return `${path}${join}format=${format}`
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function downloadExcelExport(path: string, fallbackName: string) {
  const response = await fetch(`${config.api}${withExportFormat(path, 'xlsx')}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await readError(response, 'Unable to export. Please try again.'))
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="([^"]+)"/)
  downloadBlob(blob, match?.[1] || fallbackName)
}

export async function fetchExportTable(path: string): Promise<ExportTable> {
  const response = await fetch(`${config.api}${withExportFormat(path, 'json')}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await readError(response, 'Unable to prepare the print view. Please try again.'))
  }
  const body = (await response.json()) as Partial<ExportTable>
  if (!body || !Array.isArray(body.columns) || !Array.isArray(body.rows)) {
    throw new Error('Unable to prepare the print view. Please try again.')
  }
  return {
    title: body.title || 'Export',
    columns: body.columns,
    rows: body.rows,
  }
}

export function printExportTable(table: ExportTable) {
  const popup = window.open('', '_blank')
  if (!popup) {
    throw new Error('Allow pop-ups to print this list.')
  }

  const printedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const head = table.columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('')
  const body = table.rows
    .map((row) => {
      const cells = table.columns
        .map((column) => `<td>${escapeHtml(String(row[column.key] ?? ''))}</td>`)
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')
  const empty = table.rows.length
    ? ''
    : `<tr><td colspan="${Math.max(table.columns.length, 1)}">No records to print.</td></tr>`

  popup.document.open()
  popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(table.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    p { margin: 0 0 16px; color: #555; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #d0d5dd; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f2f4f7; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(table.title)}</h1>
  <p>${table.rows.length} record${table.rows.length === 1 ? '' : 's'} · Printed ${escapeHtml(printedAt)}</p>
  <button class="no-print" type="button" onclick="window.print()">Print</button>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}${empty}</tbody>
  </table>
</body>
</html>`)
  popup.document.close()
  popup.focus()
  window.setTimeout(() => {
    popup.focus()
    popup.print()
  }, 200)
}
