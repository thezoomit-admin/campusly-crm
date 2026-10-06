import { adminPage, formActions } from '../../../styles/admin'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { PrimaryButton } from '@/components/ui'
import { Spinner } from '@/components/common/Loading'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { hasPermission } from '../../../lib/access'
import type { AuthSession } from '../../../types'
import DuplicateLeadModal from '../components/DuplicateLeadModal'
import LeadFormFields from '../components/LeadFormFields'
import {
  useCheckLeadDuplicateMutation,
  useCreateLeadMutation,
  useGetLeadQuery,
  usePreviewLeadAssignmentQuery,
  useUpdateLeadMutation,
} from '../api/leadsApi'
import { EMPTY_LEAD_FORM, type DuplicateLead, type LeadFormState } from '../types'
import { useLeadMasterOptions } from '../hooks/useLeadMasterOptions'
import { formToPayload, recordToForm, validateLeadForm } from '../utils/leadForm'

export default function LeadCreatePage() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const canCreate = hasPermission(auth, 'lead:create')
  const canEdit = hasPermission(auth, 'lead:edit')
  const allowed = isEdit ? canEdit : canCreate

  useEffect(() => {
    if (!allowed) navigate('/leads', { replace: true })
  }, [allowed, navigate])

  const master = useLeadMasterOptions()
  const [form, setForm] = useState<LeadFormState>(EMPTY_LEAD_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicate, setDuplicate] = useState<DuplicateLead | null>(null)
  const [dupOpen, setDupOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const pendingAnyway = useRef(false)
  const pendingFollowUp = useRef(false)
  const hydratedId = useRef<string | null>(null)
  const [createLead] = useCreateLeadMutation()
  const [updateLead] = useUpdateLeadMutation()
  const [checkDuplicate] = useCheckLeadDuplicateMutation()
  const canCreateAnyway = hasPermission(auth, 'lead:create_duplicate')
  const { data, isFetching, isError } = useGetLeadQuery(id as string, { skip: !isEdit })
  const lead = data?.lead
  const { data: assignmentPreview } = usePreviewLeadAssignmentQuery(form.preferredCountryCode, {
    skip: !form.preferredCountryCode,
  })
  const assignedTeamName = !form.preferredCountryCode
    ? null
    : assignmentPreview
      ? assignmentPreview.assignment.teamName
      : lead?.preferredCountryCode === form.preferredCountryCode
        ? lead?.assignedTeam?.name || null
        : null

  useEffect(() => {
    if (!isEdit || !lead) return
    if (hydratedId.current === lead.id) return
    setForm(recordToForm(lead))
    setErrors({})
    hydratedId.current = lead.id
  }, [isEdit, lead])

  useEffect(() => {
    if (isEdit && isError) {
      toast.error('Could not load this lead for editing.')
      navigate('/leads', { replace: true })
    }
  }, [isEdit, isError, navigate])

  useEffect(() => {
    const phone = form.phone.replace(/\D/g, '')
    if (phone.length < 10) {
      setDuplicate(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const result = await checkDuplicate({ phone: form.phone }).unwrap()
        const existing = result.duplicate ? result.existingLead || null : null
        setDuplicate(existing && existing.id !== id ? existing : null)
      } catch {
        setDuplicate(null)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.phone, checkDuplicate, id])

  function update(key: keyof LeadFormState, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  async function submit(createAnyway = false, withFollowUp = false) {
    const sourceId = master.sourceItems.find((item) => item.code === form.sourceCode)?.id
    const channelRequired = master.channelItems.some((item) => item.parentId === sourceId)
    const nextErrors = validateLeadForm(form, { channelRequired: !isEdit && channelRequired })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (duplicate && !createAnyway) {
      setDupOpen(true)
      return
    }

    setSaving(true)
    try {
      if (isEdit && id) {
        const result = await updateLead({ id, body: formToPayload(form) }).unwrap()
        toast.success('Lead updated.')
        navigate(withFollowUp || pendingFollowUp.current ? `/leads/${result.lead.id}?followUp=1` : `/leads/${result.lead.id}`)
        return
      }

      const result = await createLead(formToPayload(form, { createAnyway })).unwrap()
      toast.success(result.message)
      navigate(withFollowUp || pendingFollowUp.current ? `/leads/${result.lead.id}?followUp=1` : `/leads/${result.lead.id}`)
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) setErrors(fields)
      const errorData = (error as { data?: { existingLead?: DuplicateLead; code?: string } }).data
      if (errorData?.code === 'DUPLICATE_LEAD' && errorData.existingLead && errorData.existingLead.id !== id) {
        setDuplicate(errorData.existingLead)
        setDupOpen(true)
      } else if (!fields.name) {
        toast.error(getApiError(error, isEdit ? 'Unable to update lead. Please try again.' : 'Unable to create lead. Please try again.'))
      }
    } finally {
      setSaving(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void submit(false, false)
  }

  const canSave =
    form.name.trim().length >= 2 &&
    form.phone.replace(/\D/g, '').length >= 10 &&
    Boolean(form.preferredCountryCode) &&
    Boolean(form.sourceCode)
  const cancelTo = isEdit && id ? `/leads/${id}` : '/leads'
  const pageTitle = isEdit ? 'Edit Lead' : 'Create New Lead'
  const pageDescription = isEdit
    ? 'Update lead details. Required fields are marked.'
    : 'Required fields are marked. Remaining qualification data can be completed later.'

  if (isEdit && isFetching && !lead) {
    return (
      <div className={adminPage}>
        <PageMeta title="Edit Lead" description={pageDescription} />
        <div className="grid min-h-60 place-items-center">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className={adminPage}>
      <PageMeta title={isEdit ? 'Edit Lead' : 'Create Lead'} description={pageDescription} />
      <PageHeader
        title={pageTitle}
        subtitle={pageDescription}
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Leads', path: '/leads' },
          { title: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <form onSubmit={onSubmit} className="grid gap-4">
        <LeadFormFields
          form={form}
          errors={errors}
          sourceLocked={lead?.sourceLocked}
          attributionLocked={isEdit}
          assignedTeamName={assignedTeamName}
          onChange={update}
        />
        <div className={formActions}>
          <Link to={cancelTo}>
            <PrimaryButton type="button" variant="outline" label="Cancel" />
          </Link>
          <PrimaryButton
            type="button"
            variant="outline"
            disabled={!canSave || saving}
            onClick={() => {
              pendingFollowUp.current = true
              void submit(false, true)
            }} label="Save & Add Follow-up" />
          <PrimaryButton type="submit" disabled={!canSave || saving} loading={saving} label={isEdit ? 'Save Changes' : 'Save Lead'} />
        </div>
      </form>

      <DuplicateLeadModal
        open={dupOpen && Boolean(duplicate)}
        lead={duplicate}
        canCreateAnyway={!isEdit && canCreateAnyway}
        onClose={() => setDupOpen(false)}
        onOpenExisting={() => duplicate && navigate(`/leads/${duplicate.id}`)}
        onCreateAnyway={() => {
          pendingAnyway.current = true
          setDupOpen(false)
          void submit(true, pendingFollowUp.current)
        }}
      />
    </div>
  )
}
