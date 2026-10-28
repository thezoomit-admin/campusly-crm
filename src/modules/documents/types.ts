export type DocumentVault = 'lead' | 'file'

export type DocumentExpiryStatus = 'NONE' | 'VALID' | 'EXPIRING' | 'EXPIRED'

export type DocumentSummary = {
  total: number
  notRequested?: number
  requested?: number
  pendingReview?: number
  pending?: number
  verified: number
  rejected: number
  missing?: number
  expiring?: number
  expired: number
}

export type DocumentRow = {
  id: string
  code?: string
  fileId?: string
  fileCode?: string
  leadId?: string
  leadCode?: string
  owner: string
  leadName?: string
  type: string
  typeCode?: string
  category: string
  categoryCode?: string
  requirement?: 'REQUIRED' | 'OPTIONAL' | null
  uploadedBy: string
  verifiedBy?: string
  status: string
  statusCode?: string
  expiryStatus?: DocumentExpiryStatus | string
  expiryDate?: string | null
  hasFile?: boolean
  assetCount?: number
  updated: string
  createdAt?: string
  ageDays?: number
  vault?: DocumentVault
}

export type DocumentFormValues = {
  owner: string
  type: string
  category: string
}

export type DocumentQueue =
  | 'all'
  | 'not_requested'
  | 'requested'
  | 'pending_review'
  | 'rejected'
  | 'verified'
  | 'missing'
  | 'expiring'
  | 'expired'
  | 'pending'
