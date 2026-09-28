import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { Breadcrumb, Skeleton } from 'antd'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui'
import { PageMeta } from '@/components/common/Meta'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { hasPermission } from '../../../lib/access'
import type { AuthSession } from '../../../types'
import { useLeadMasterOptions } from '../hooks/useLeadMasterOptions'
import {
  useCreateLeadFollowUpMutation,
  useGetLeadQuery,
  useUpdateLeadMutation,
  useUpdateLeadQualificationMutation,
} from '../api/leadsApi'
import { useCreateActivityMutation, useListActivityFeedQuery } from '@/redux/features/activities/activitiesApi'
import { EMPTY_LEAD_FORM, type LeadFormState } from '../types'
import { formToPayload, recordToForm, validateLeadForm } from '../utils/leadForm'
import { LEAD_TABS, type LeadEditSection, type LeadTabKey } from '../utils/leadDetails'
import LeadWorkspaceHeader from '../components/details/LeadWorkspaceHeader'
import LeadDetailsSidebar from '../components/details/LeadDetailsSidebar'
import LeadOverviewPanels, { LeadAcademicPanel, LeadStudyVisaPanel } from '../components/details/LeadOverviewPanels'
import { LeadActivitiesPanel, LeadDocumentsPanel, LeadNotesPanel } from '../components/details/LeadTabPanels'
import {
  AddActivityModal,
  ChangeOwnerModal,
  FollowUpModal,
  QualifyLeadModal,
} from '../components/details/LeadDetailsModals'
import { adminPage } from '../../../styles/admin'

export default function LeadDetailsPage() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const options = useLeadMasterOptions()
  const { data, isFetching, isError } = useGetLeadQuery(id, { skip: !id })
  const [updateLead, { isLoading: saving }] = useUpdateLeadMutation()
  const [updateQualification, { isLoading: qualifying }] = useUpdateLeadQualificationMutation()
  const [createFollowUp, { isLoading: followUpSaving }] = useCreateLeadFollowUpMutation()
  const [createActivity, { isLoading: activitySaving }] = useCreateActivityMutation()

  const lead = data?.lead
  const canEdit = hasPermission(auth, 'lead:edit')
  const canQualify = hasPermission(auth, 'lead:qualify')
  const canFollowUp = hasPermission(auth, 'follow_up:create')
  const canViewActivity = hasPermission(auth, 'activity:view')
  const canAddActivity = hasPermission(auth, 'activity:create')

  const { data: activityData } = useListActivityFeedQuery(
    { relatedId: id },
    { skip: !id || !canViewActivity },
  )
  const activities = activityData?.items || []

  const [tab, setTab] = useState<LeadTabKey>('overview')
  const [form, setForm] = useState<LeadFormState>(EMPTY_LEAD_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<LeadEditSection>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(searchParams.get('followUp') === '1')
  const [activityOpen, setActivityOpen] = useState(false)
  const [qualifyOpen, setQualifyOpen] = useState(false)
  const [ownerOpen, setOwnerOpen] = useState(false)
  const [qual, setQual] = useState({
    academicFitCode: '',
    financialReadinessCode: '',
    englishReadinessCode: '',
    countryIntakeFitCode: '',
    studyIntentQualCode: '',
    applicationReadinessCode: '',
    decisionTimelineCode: '',
    qualificationResultCode: '',
    unqualifiedReasonCode: '',
    unqualifiedRemarks: '',
  })

  useEffect(() => {
    if (!lead) return
    setForm(recordToForm(lead))
    setNotesDraft(lead.notes || lead.remarks || '')
    setQual({
      academicFitCode: lead.academicFitCode || '',
      financialReadinessCode: lead.financialReadinessCode || '',
      englishReadinessCode: lead.englishReadinessCode || '',
      countryIntakeFitCode: lead.countryIntakeFitCode || '',
      studyIntentQualCode: lead.studyIntentQualCode || lead.studyIntentCode || '',
      applicationReadinessCode: lead.applicationReadinessCode || '',
      decisionTimelineCode: lead.decisionTimelineCode || '',
      qualificationResultCode: lead.qualificationResultCode || '',
      unqualifiedReasonCode: lead.unqualifiedReasonCode || '',
      unqualifiedRemarks: lead.unqualifiedRemarks || '',
    })
  }, [lead])

  useEffect(() => {
    if (searchParams.get('followUp') === '1') setFollowUpOpen(true)
  }, [searchParams])

  const pageTitle = useMemo(() => (lead ? `${lead.code} — ${lead.name}` : 'Lead Details'), [lead])

  function update(key: keyof LeadFormState, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  async function saveForm() {
    if (!canEdit || !id) return
    const nextErrors = validateLeadForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please complete the required fields.')
      return
    }
    try {
      await updateLead({ id, body: formToPayload(form) }).unwrap()
      toast.success('Lead updated.')
      setEditing(null)
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) setErrors(fields)
      toast.error(getApiError(error, 'Unable to update lead. Please try again.'))
    }
  }

  async function saveNotes() {
    if (!canEdit || !id) return
    setNotesSaving(true)
    try {
      await updateLead({ id, body: formToPayload({ ...form, notes: notesDraft }) }).unwrap()
      toast.success('Notes saved.')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to save notes.'))
    } finally {
      setNotesSaving(false)
    }
  }

  async function onWhatsAppToggle(checked: boolean) {
    if (!canEdit || !id) return
    try {
      await updateLead({
        id,
        body: formToPayload({
          ...form,
          whatsappSameAsPhone: checked,
          whatsapp: checked ? form.phone : form.whatsapp,
        }),
      }).unwrap()
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update WhatsApp number.'))
    }
  }

  async function onQualify() {
    if (!canQualify || !id) return
    if (qual.qualificationResultCode === 'UNQUALIFIED' && !qual.unqualifiedReasonCode) {
      toast.error('Please provide a reason.')
      return
    }
    if (qual.qualificationResultCode === 'UNQUALIFIED' && qual.unqualifiedReasonCode === 'OTHER' && !qual.unqualifiedRemarks.trim()) {
      toast.error('Please provide a reason.')
      return
    }
    try {
      await updateQualification({ id, body: qual }).unwrap()
      toast.success('Qualification saved.')
      setQualifyOpen(false)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to save qualification.'))
    }
  }

  async function onFollowUp(body: { type: string; dueAt: string; notes: string }) {
    try {
      await createFollowUp({ id, body: { type: body.type, dueAt: body.dueAt || null, notes: body.notes } }).unwrap()
      toast.success('Follow-up scheduled.')
      setFollowUpOpen(false)
      if (searchParams.get('followUp') === '1') {
        searchParams.delete('followUp')
        setSearchParams(searchParams, { replace: true })
      }
    } catch (error) {
      toast.error(getApiError(error, 'Unable to add follow-up.'))
    }
  }

  async function onAddActivity(body: { type: string; notes: string; outcome: string }) {
    try {
      await createActivity({
        type: body.type,
        notes: body.notes,
        outcome: body.outcome,
        relatedType: 'lead',
        relatedId: id,
        relatedName: lead?.name,
      }).unwrap()
      toast.success('Activity added.')
      setActivityOpen(false)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to add activity.'))
    }
  }

  function openNotes() {
    setTab('notes')
  }

  function sendEmail() {
    if (!lead?.email) {
      toast.error('This lead has no email address.')
      return
    }
    window.location.href = `mailto:${lead.email}`
  }

  if (isError) {
    return (
      <div className={adminPage}>
        <PageMeta title="Lead Details" description="Lead workspace and qualification." />
        <Breadcrumb
          className="mb-3"
          items={[
            { title: <Link to="/leads">Leads</Link> },
            { title: <span className="font-medium text-primary">Lead Details</span> },
          ]}
        />
        <p className="text-danger">Lead not found or you do not have access.</p>
        <Button type="button" variant="secondary" onClick={() => navigate('/leads')}>
          Back to leads
        </Button>
      </div>
    )
  }

  return (
    <div className="grid min-w-0 max-w-full gap-4 overflow-x-hidden">
      <PageMeta title={pageTitle} description="Lead workspace, profile completion, and activity." />
      <Breadcrumb
        className="mb-0"
        items={[
          { title: <Link to="/leads">Leads</Link> },
          { title: <span className="font-medium text-primary">Lead Details</span> },
        ]}
      />

      {isFetching && !lead ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton active paragraph={{ rows: 8 }} />
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      ) : null}

      {lead ? (
        <>
          <LeadWorkspaceHeader
            lead={lead}
            canEdit={canEdit}
            canAddActivity={canAddActivity}
            onEdit={() => {
              setTab('overview')
              setEditing('all')
            }}
            onAddActivity={() => setActivityOpen(true)}
          />

          <div className="flex gap-1 overflow-x-auto border-b border-[#e6eef6] dark:border-border">
            {LEAD_TABS.map((item) => {
              const active = tab === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`shrink-0 cursor-pointer border-0 border-b-2 bg-transparent px-4 py-2.5 text-[0.9rem] ${
                    active
                      ? 'border-primary font-semibold text-primary'
                      : 'border-transparent text-[#7d8b9a] hover:text-text'
                  }`}
                  onClick={() => setTab(item.key)}
                >
                  {item.label}
                </button>
              )
            })}
            {canQualify ? (
              <button
                type="button"
                className="ml-auto shrink-0 cursor-pointer border-0 bg-transparent px-3 py-2.5 text-[0.82rem] font-medium text-primary hover:underline"
                onClick={() => setQualifyOpen(true)}
              >
                Qualify
              </button>
            ) : null}
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              {tab === 'overview' ? (
                <LeadOverviewPanels
                  lead={lead}
                  form={form}
                  errors={errors}
                  options={options}
                  canEdit={canEdit}
                  editing={editing}
                  saving={saving}
                  onEdit={setEditing}
                  onCancel={() => {
                    setEditing(null)
                    setForm(recordToForm(lead))
                  }}
                  onSave={() => void saveForm()}
                  onChange={update}
                  onWhatsAppToggle={(checked) => void onWhatsAppToggle(checked)}
                  notesDraft={notesDraft}
                  onNotesDraftChange={setNotesDraft}
                  onNotesSave={() => void saveNotes()}
                  notesSaving={notesSaving}
                />
              ) : null}
              {tab === 'academic' ? (
                <LeadAcademicPanel
                  lead={lead}
                  form={form}
                  options={options}
                  canEdit={canEdit}
                  editing={editing === 'academic' || editing === 'all'}
                  saving={saving}
                  onEdit={() => setEditing('academic')}
                  onCancel={() => {
                    setEditing(null)
                    setForm(recordToForm(lead))
                  }}
                  onSave={() => void saveForm()}
                  onChange={update}
                />
              ) : null}
              {tab === 'study' ? (
                <LeadStudyVisaPanel
                  lead={lead}
                  form={form}
                  options={options}
                  canEdit={canEdit}
                  editing={editing === 'study' || editing === 'all'}
                  saving={saving}
                  onEdit={() => setEditing('study')}
                  onCancel={() => {
                    setEditing(null)
                    setForm(recordToForm(lead))
                  }}
                  onSave={() => void saveForm()}
                  onChange={update}
                />
              ) : null}
              {tab === 'documents' ? <LeadDocumentsPanel /> : null}
              {tab === 'activities' ? (
                <LeadActivitiesPanel activities={activities} canAdd={canAddActivity} onAdd={() => setActivityOpen(true)} />
              ) : null}
              {tab === 'notes' ? (
                <LeadNotesPanel
                  value={notesDraft}
                  canEdit={canEdit}
                  saving={notesSaving}
                  onChange={setNotesDraft}
                  onSave={() => void saveNotes()}
                />
              ) : null}
            </div>

            <LeadDetailsSidebar
              lead={lead}
              activities={activities}
              canFollowUp={canFollowUp}
              onViewCompletion={() => setTab('overview')}
              onViewActivities={() => setTab('activities')}
              onSetReminder={() => setFollowUpOpen(true)}
              onAddNote={openNotes}
              onScheduleFollowUp={() => setFollowUpOpen(true)}
              onSendEmail={sendEmail}
              onChangeOwner={() => setOwnerOpen(true)}
            />
          </div>
        </>
      ) : null}

      <FollowUpModal
        open={followUpOpen && canFollowUp}
        saving={followUpSaving}
        onClose={() => setFollowUpOpen(false)}
        onSubmit={onFollowUp}
      />
      <AddActivityModal
        open={activityOpen && canAddActivity}
        saving={activitySaving}
        onClose={() => setActivityOpen(false)}
        onSubmit={onAddActivity}
      />
      <QualifyLeadModal
        open={qualifyOpen && canQualify}
        saving={qualifying}
        values={qual}
        options={options}
        onClose={() => setQualifyOpen(false)}
        onChange={(key, value) => setQual((current) => ({ ...current, [key]: value }))}
        onSubmit={onQualify}
      />
      <ChangeOwnerModal open={ownerOpen} lead={lead || null} onClose={() => setOwnerOpen(false)} />
    </div>
  )
}
