import type { DocumentRow } from '../types'

/** Required incomplete docs surface as Missing so KPI + table naming stay aligned. */
export function isMissingDocument(row: Pick<DocumentRow, 'requirement' | 'statusCode' | 'hasFile'>) {
  if (row.requirement !== 'REQUIRED') return false
  const code = (row.statusCode || '').toUpperCase()
  if (code === 'MISSING') return true
  if (code === 'NOT_REQUESTED') return true
  if (code === 'REQUESTED' && row.hasFile === false) return true
  return false
}

export function isPendingReview(row: Pick<DocumentRow, 'statusCode'>) {
  const code = (row.statusCode || '').toUpperCase()
  return code === 'RECEIVED' || code === 'UNDER_REVIEW' || code === 'PENDING'
}

export function isRequestable(row: Pick<DocumentRow, 'statusCode' | 'requirement' | 'hasFile'>) {
  const code = (row.statusCode || '').toUpperCase()
  return (
    !code ||
    code === 'NOT_REQUESTED' ||
    code === 'REQUESTED' ||
    code === 'MISSING' ||
    isMissingDocument(row)
  )
}

export function isRejectable(row: Pick<DocumentRow, 'statusCode'>) {
  return isPendingReview(row)
}

export function displayStatusLabel(row: DocumentRow) {
  if (isMissingDocument(row)) return 'Missing'
  if (isPendingReview(row) && row.vault === 'file') {
    const code = (row.statusCode || '').toUpperCase()
    if (code === 'RECEIVED') return 'Pending review'
    if (code === 'UNDER_REVIEW') return 'Under review'
  }
  return row.status || '—'
}

/** Lower score = higher in action-needed queue. */
export function actionPriority(row: DocumentRow) {
  const requiredBoost = row.requirement === 'REQUIRED' ? 0 : 40
  const code = (row.statusCode || '').toUpperCase()
  let statusScore = 50
  if (isMissingDocument(row) || code === 'NOT_REQUESTED') statusScore = 0
  else if (code === 'REJECTED' || code === 'REUPLOAD_REQUIRED') statusScore = 5
  else if (code === 'REQUESTED') statusScore = 10
  else if (code === 'RECEIVED') statusScore = 15
  else if (code === 'UNDER_REVIEW' || code === 'PENDING') statusScore = 18
  else if (row.expiryStatus === 'EXPIRED') statusScore = 20
  else if (row.expiryStatus === 'EXPIRING') statusScore = 25
  else if (code === 'VERIFIED') statusScore = 80
  else if (code === 'ARCHIVED') statusScore = 90
  return requiredBoost + statusScore
}

export function sortDocumentsByActionNeeded(rows: DocumentRow[]) {
  return [...rows].sort((a, b) => {
    const diff = actionPriority(a) - actionPriority(b)
    if (diff !== 0) return diff
    return (b.updated || '').localeCompare(a.updated || '')
  })
}

export function groupDocumentsByLead(rows: DocumentRow[]) {
  const map = new Map<
    string,
    {
      key: string
      leadId?: string
      owner: string
      leadCode?: string
      fileCode?: string
      documents: DocumentRow[]
      actionNeeded: number
    }
  >()

  for (const row of rows) {
    const key = row.leadId || row.fileId || row.owner || row.id
    const existing = map.get(key)
    if (existing) {
      existing.documents.push(row)
    } else {
      map.set(key, {
        key,
        leadId: row.leadId,
        owner: row.owner,
        leadCode: row.leadCode,
        fileCode: row.fileCode,
        documents: [row],
        actionNeeded: 0,
      })
    }
  }

  const groups = [...map.values()].map((group) => ({
    ...group,
    documents: sortDocumentsByActionNeeded(group.documents),
    actionNeeded: group.documents.filter(
      (row) =>
        isMissingDocument(row) ||
        isPendingReview(row) ||
        row.statusCode === 'REJECTED' ||
        row.statusCode === 'REUPLOAD_REQUIRED' ||
        row.expiryStatus === 'EXPIRED' ||
        row.expiryStatus === 'EXPIRING',
    ).length,
  }))

  return groups.sort((a, b) => {
    if (b.actionNeeded !== a.actionNeeded) return b.actionNeeded - a.actionNeeded
    return a.owner.localeCompare(b.owner)
  })
}
