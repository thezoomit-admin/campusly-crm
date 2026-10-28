import dayjs from 'dayjs'

export function formatDocumentDate(value?: string | null) {
  if (!value) return '—'
  const parsed = dayjs(value)
  if (!parsed.isValid()) return value
  return parsed.format('DD MMM YYYY')
}

export function formatDocumentDateTime(value?: string | null) {
  if (!value) return '—'
  const parsed = dayjs(value)
  if (!parsed.isValid()) return value
  return parsed.format('DD MMM YYYY, h:mm A')
}

export function formatAgeDays(ageDays?: number) {
  if (ageDays == null || Number.isNaN(ageDays)) return '—'
  if (ageDays <= 0) return 'Today'
  if (ageDays === 1) return '1 day'
  return `${ageDays} days`
}

export function csvEscape(value: unknown) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function downloadDocumentsCsv(
  rows: Array<Record<string, unknown>>,
  filename: string,
) {
  const header = [
    'Lead / File',
    'Document',
    'Category',
    'Status',
    'Requirement',
    'Expiry',
    'Uploaded by',
    'Verified by',
    'Updated',
    'Age (days)',
  ]
  const lines = rows.map((row) =>
    [
      row.owner,
      row.type,
      row.category,
      row.status,
      row.requirement || '',
      row.expiryDate || row.expiryStatus || '',
      row.uploadedBy,
      row.verifiedBy,
      row.updated,
      row.ageDays ?? '',
    ]
      .map(csvEscape)
      .join(','),
  )
  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
