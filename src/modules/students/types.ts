import type { ApplicationListItem } from '@/modules/applications/api/applicationsApi'

export type StudentRow = {
  id: string
  studentId: string
  name: string
  destination: string
  program: string
  counsellor: string
  status: string
  enrolled: string
  leadId?: string | null
  leadCode?: string | null
  applicationsCount?: number
  [key: string]: string | number | null | undefined
}

export type StudentSharedDocument = {
  id: string
  name: string
  categoryCode: string
  typeCode: string
  status: string
  fileName: string
  mimeType: string
  fileSize: number
  createdAt: string
  updatedAt: string
  scope: 'student_shared'
}

export type StudentDetail = {
  id: string
  studentCode: string
  name: string
  phone: string | null
  email: string | null
  destination: string | null
  program: string | null
  counsellorId: string | null
  counsellorName: string | null
  status: string
  enrolledAt: string | null
  createdAt: string
  updatedAt: string
  lead: {
    id: string
    code: string
    name: string
    status: string
    phone: string | null
    email: string | null
    preferredCourse: string | null
    preferredCountryCode: string | null
    country: string | null
  } | null
  applications: ApplicationListItem[]
  sharedDocuments: StudentSharedDocument[]
  applicationsCount: number
}

export type StudentFormValues = {
  name: string
  studentId: string
  destination: string
  program: string
}

export type StudentPrimaryTab =
  | 'overview'
  | 'applications'
  | 'documents'
  | 'communications'
