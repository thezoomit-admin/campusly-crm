export type DocumentRow = {
  id: string
  leadId?: string
  leadCode?: string
  owner: string
  leadName?: string
  type: string
  typeCode?: string
  category: string
  uploadedBy: string
  verifiedBy?: string
  status: string
  statusCode?: string
  expiryStatus?: string
  updated: string
  createdAt?: string
  vault?: 'file' | 'lead'
}

export type DocumentFormValues = {
  owner: string
  type: string
  category: string
}
