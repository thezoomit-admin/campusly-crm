import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { Breadcrumb, Skeleton } from 'antd'
import { toast } from 'react-toastify'
import { PrimaryButton } from '@/components/ui'
import { PageMeta } from '@/components/common/Meta'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { hasPermission } from '../../../lib/access'
import type { AuthSession } from '../../../types'
import { useLeadMasterOptions } from '../hooks/useLeadMasterOptions'
import {
  useAssignLeadMutation,
  useCloseLeadMutation,
  useGetLeadQuery,
  useListLeadAssignmentsQuery,
  useListLeadStatusHistoryQuery,
  useReopenLeadMutation,
  useUpdateLeadMutation,
  useUpdateLeadQualificationMutation,
  useUpdateLeadStatusMutation,
} from '../api/leadsApi'
import { useCreateActivityMutation, useListActivityFeedQuery } from '@/redux/features/activities/activitiesApi'
import { useListLeadCommunicationsQuery } from '@/modules/communications/api/communicationsApi'
import {
  useCancelFollowUpMutation,
  useCompleteFollowUpMutation,
  useCreateFollowUpMutation,
  useListLeadFollowUpsQuery,
  useRescheduleFollowUpMutation,
} from '@/modules/follow-ups/api/followUpsApi'
import FollowUpFormModal from '@/modules/follow-ups/components/FollowUpFormModal'
import {
  CancelFollowUpModal,
  CompleteFollowUpModal,
  RescheduleFollowUpModal,
} from '@/modules/follow-ups/components/FollowUpLifecycleModals'
import LeadFollowUpHistoryPanel from '@/modules/follow-ups/components/LeadFollowUpHistoryPanel'
import { LeadWhatsAppPanel } from '@/modules/whatsapp'
import { LeadEmailPanel } from '@/modules/email'
import type {
  CompleteFollowUpValues,
  FollowUpFormValues,
  FollowUpRecord,
  RescheduleFollowUpValues,
} from '@/modules/follow-ups/types'
import { LEAD_TABS, type LeadTabKey } from '../utils/leadDetails'
import LeadWorkspaceHeader from '../components/details/LeadWorkspaceHeader'
import LeadDetailsSidebar from '../components/details/LeadDetailsSidebar'
import LeadOverviewPanels, { LeadAcademicPanel, LeadStudyVisaPanel } from '../components/details/LeadOverviewPanels'
import { LeadActivitiesPanel, LeadCommunicationsPanel, LeadDocumentsPanel, LeadNotesPanel } from '../components/details/LeadTabPanels'
import {
  AddActivityModal,
  ChangeOwnerModal,
  ChangeStatusModal,
  CloseLeadModal,
  QualifyLeadModal,
  ReopenLeadModal,
} from '../components/details/LeadDetailsModals'
import { adminPage } from '../../../styles/admin'

export default function LeadDetailsPage() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const options = useLeadMasterOptions()
  const { data, isFetching, isError } = useGetLeadQuery(id, { skip: !id })
  const [updateLead] = useUpdateLeadMutation()
  const [updateQualification, { isLoading: qualifying }] = useUpdateLeadQualificationMutation()
  const [updateStatus, { isLoading: statusSaving }] = useUpdateLeadStatusMutation()
  const [closeLead, { isLoading: closeSaving }] = useCloseLeadMutation()
  const [reopenLead, { isLoading: reopenSaving }] = useReopenLeadMutation()
  const [createFollowUp, { isLoading: followUpSaving }] = useCreateFollowUpMutation()
  const [createActivity, { isLoading: activitySaving }] = useCreateActivityMutation()
  const [assignLead, { isLoading: ownerSaving }] = useAssignLeadMutation()
  const [completeFollowUp, { isLoading: completing }] = useCompleteFollowUpMutation()
  const [rescheduleFollowUp, { isLoading: rescheduling }] = useRescheduleFollowUpMutation()
  const [cancelFollowUp, { isLoading: cancelling }] = useCancelFollowUpMutation()

  const lead = data?.lead
  const canEdit = hasPermission(auth, 'lead:edit')
  const canQualify = hasPermission(auth, 'lead:qualify')
  const canUpdateStatus = hasPermission(auth, 'lead:update_status')
  const canClosePermission = hasPermission(auth, 'lead:close')
  const canReopenPermission = hasPermission(auth, 'lead:reopen')
  const canChangeStatus = Boolean(canUpdateStatus && lead?.statusChange?.canUpdate)
  const canClose = Boolean(canClosePermission && lead?.statusChange?.canClose)
  const canReopen = Boolean(canReopenPermission && lead?.statusChange?.canReopen)
  const canFollowUp = hasPermission(auth, 'follow_up:create')
  const canEditFollowUp = hasPermission(auth, 'follow_up:edit')
  const canViewFollowUp = hasPermission(auth, 'follow_up:view')
  const canViewActivity = hasPermission(auth, 'activity:view')
  const canAddActivity = hasPermission(auth, 'activity:create')
  const canViewCommunications =
    hasPermission(auth, 'communication:view') || hasPermission(auth, 'lead:view')
  const canViewWhatsApp = hasPermission(auth, 'communication:view')
  const canViewEmail = hasPermission(auth, 'communication:view')
  const canAssign = hasPermission(auth, 'lead:assign')
  const canReassign = hasPermission(auth, 'lead:reassign')
  const canChangeOwner = Boolean(lead?.owner?.id ? canReassign : canAssign)

  const { data: activityData } = useListActivityFeedQuery(
    { relatedId: id },
    { skip: !id || !canViewActivity },
  )
  const { data: communicationsData, isFetching: communicationsLoading } = useListLeadCommunicationsQuery(id, {
    skip: !id || !canViewCommunications,
  })
  const { data: historyData } = useListLeadStatusHistoryQuery(id, { skip: !id })
  const { data: assignmentData } = useListLeadAssignmentsQuery(id, { skip: !id })
  const { data: followUpData, isFetching: followUpsLoading } = useListLeadFollowUpsQuery(id, {
    skip: !id || !canViewFollowUp,
  })
  const activities = activityData?.items || []
  const communications = communicationsData?.items || []
  const statusHistory = historyData?.items || []
  const assignmentHistory = assignmentData?.items || []
  const followUps = followUpData?.items || []

  const [tab, setTab] = useState<LeadTabKey>('overview')
  const [notesDraft, setNotesDraft] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(searchParams.get('followUp') === '1')
  const [activityOpen, setActivityOpen] = useState(false)
  const [qualifyOpen, setQualifyOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({})
  const [closeOpen, setCloseOpen] = useState(false)
  const [closeErrors, setCloseErrors] = useState<Record<string, string>>({})
  const [reopenOpen, setReopenOpen] = useState(false)
  const [reopenErrors, setReopenErrors] = useState<Record<string, string>>({})
  const [ownerOpen, setOwnerOpen] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpRecord | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
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

  async function saveNotes() {
    if (!canEdit || !id) return
    setNotesSaving(true)
    try {
      await updateLead({ id, body: { notes: notesDraft.trim() || null } }).unwrap()
      toast.success('Notes saved.')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to save notes.'))
    } finally {
      setNotesSaving(false)
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

  async function onUpdateStatus(body: {
    statusCode: string
    remarks: string
    lostReasonCode: string
    override: boolean
    overrideReason: string
  }) {
    if (!canUpdateStatus || !id) return
    setStatusErrors({})
    try {
      await updateStatus({ id, body }).unwrap()
      toast.success('Lead status updated.')
      setStatusOpen(false)
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) setStatusErrors(fields)
      toast.error(getApiError(error, 'Unable to update the lead status. Please try again.'))
    }
  }

  async function onCloseLead(body: { statusCode: string; reasonCode: string; remarks: string }) {
    if (!canClose || !id) return
    setCloseErrors({})
    try {
      await closeLead({ id, body }).unwrap()
      toast.success('Lead closed successfully.')
      setCloseOpen(false)
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) setCloseErrors(fields)
      toast.error(getApiError(error, 'Unable to complete this action. Please try again.'))
    }
  }

  async function onReopenLead(body: { reopenReason: string; followUpDate: string; ownerId: string }) {
    if (!canReopen || !id) return
    setReopenErrors({})
    try {
      await reopenLead({ id, body }).unwrap()
      toast.success('Lead reopened successfully.')
      setReopenOpen(false)
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) setReopenErrors(fields)
      toast.error(getApiError(error, 'Unable to complete this action. Please try again.'))
    }
  }

  async function onFollowUp(values: FollowUpFormValues) {
    try {
      await createFollowUp({ ...values, leadId: id }).unwrap()
      toast.success('Follow-up scheduled.')
      setFollowUpOpen(false)
      if (searchParams.get('followUp') === '1') {
        searchParams.delete('followUp')
        setSearchParams(searchParams, { replace: true })
      }
    } catch (error) {
      toast.error(getApiError(error, 'Unable to create follow-up.'))
      throw error
    }
  }

  async function onCompleteFollowUp(values: CompleteFollowUpValues) {
    if (!selectedFollowUp) return
    try {
      await completeFollowUp({ id: selectedFollowUp.id, body: values }).unwrap()
      toast.success(values.createNextFollowUp ? 'Follow-up completed and next scheduled.' : 'Follow-up completed.')
      setCompleteOpen(false)
      setSelectedFollowUp(null)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to complete follow-up.'))
    }
  }

  async function onRescheduleFollowUp(values: RescheduleFollowUpValues) {
    if (!selectedFollowUp) return
    try {
      await rescheduleFollowUp({ id: selectedFollowUp.id, body: values }).unwrap()
      toast.success('Follow-up rescheduled.')
      setRescheduleOpen(false)
      setSelectedFollowUp(null)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to reschedule follow-up.'))
    }
  }

  async function onCancelFollowUp(reason: string) {
    if (!selectedFollowUp) return
    try {
      await cancelFollowUp({ id: selectedFollowUp.id, body: { reason } }).unwrap()
      toast.success('Follow-up cancelled.')
      setCancelOpen(false)
      setSelectedFollowUp(null)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to cancel follow-up.'))
    }
  }

  function openFollowUpActions(item: FollowUpRecord, action: 'complete' | 'reschedule' | 'cancel') {
    setSelectedFollowUp(item)
    setCompleteOpen(action === 'complete')
    setRescheduleOpen(action === 'reschedule')
    setCancelOpen(action === 'cancel')
  }

  async function onAddActivity(body: {
    type: string
    notes: string
    outcome: string
    durationMin?: number | null
    nextAction: string
    createNextFollowUp: boolean
    nextDueAt?: string
    nextFollowUpType?: string
    nextFollowUpPriority?: string
  }) {
    try {
      if (body.createNextFollowUp && !body.nextDueAt) {
        toast.error('Follow-up date is required.')
        return
      }
      if (body.createNextFollowUp && !body.nextAction.trim()) {
        toast.error('Please enter the next action.')
        return
      }
      if (body.type === 'CALL' && body.outcome === 'Other' && !body.notes.trim()) {
        toast.error('Please provide a reason.')
        return
      }
      const result = await createActivity({
        type: body.type,
        notes: body.notes,
        outcome: body.outcome,
        durationMin: body.durationMin,
        nextAction: body.nextAction || undefined,
        nextDate: body.createNextFollowUp ? body.nextDueAt || null : null,
        createNextFollowUp: body.createNextFollowUp,
        nextFollowUpType: body.nextFollowUpType,
        nextFollowUpPriority: body.nextFollowUpPriority,
        relatedType: 'lead',
        relatedId: id,
        relatedName: lead?.name,
      }).unwrap()
      toast.success(
        result.nextFollowUp ? 'Activity saved and next follow-up scheduled.' : 'Activity added.',
      )
      setActivityOpen(false)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to add activity.'))
    }
  }

  async function onAssignOwner(ownerId: string, reason: string) {
    if (!id || !canChangeOwner) return
    try {
      const result = await assignLead({ id, body: { ownerId, reason: reason || undefined } }).unwrap()
      toast.success(result.message || 'Lead assigned successfully.')
      setOwnerOpen(false)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to assign the selected lead. Please try again.'))
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
        <PrimaryButton type="button" variant="outline" onClick={() => navigate('/leads')} label="Back to leads" />
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
            canChangeStatus={canChangeStatus}
            canClose={canClose}
            canReopen={canReopen}
            onEdit={() => navigate(`/leads/${id}/edit`)}
            onAddActivity={() => setActivityOpen(true)}
            onChangeStatus={() => {
              setStatusErrors({})
              setStatusOpen(true)
            }}
            onCloseLead={() => {
              setCloseErrors({})
              setCloseOpen(true)
            }}
            onReopenLead={() => {
              setReopenErrors({})
              setReopenOpen(true)
            }}
          />

          <div className="flex gap-1 overflow-x-auto border-b border-[#e6eef6] dark:border-border">
            {LEAD_TABS.filter(
              (item) =>
                (item.key !== 'followups' || canViewFollowUp) &&
                (item.key !== 'whatsapp' || canViewWhatsApp) &&
                (item.key !== 'email' || canViewEmail),
            ).map((item) => {
              const active = tab === item.key
              return (
                <PrimaryButton
                  key={item.key}
                  type="button"
                  className={`shrink-0 cursor-pointer border-0 border-b-2 bg-transparent px-4 py-2.5 text-[0.9rem] ${
                    active
                      ? 'border-primary font-semibold text-primary'
                      : 'border-transparent text-[#7d8b9a] hover:text-text'
                  }`}
                  onClick={() => setTab(item.key)} label={item.label} />
              )
            })}
            {canQualify ? (
              <PrimaryButton
                type="button"
                className="ml-auto shrink-0 cursor-pointer border-0 bg-transparent px-3 py-2.5 text-[0.82rem] font-medium text-primary hover:underline"
                onClick={() => setQualifyOpen(true)} label="Qualify" />
            ) : null}
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              {tab === 'overview' ? (
                <LeadOverviewPanels
                  lead={lead}
                  options={options}
                  canChangeSource={hasPermission(auth, 'lead:change_source')}
                  canChangeCampaign={hasPermission(auth, 'lead:change_source') || hasPermission(auth, 'campaign:manage')}
                />
              ) : null}
              {tab === 'academic' ? <LeadAcademicPanel lead={lead} options={options} /> : null}
              {tab === 'study' ? <LeadStudyVisaPanel lead={lead} options={options} /> : null}
              {tab === 'documents' ? <LeadDocumentsPanel /> : null}
              {tab === 'communications' && canViewCommunications ? (
                <LeadCommunicationsPanel items={communications} loading={communicationsLoading} />
              ) : null}
              {tab === 'whatsapp' && canViewWhatsApp ? (
                <LeadWhatsAppPanel leadId={lead.id} hasWhatsAppNumber={Boolean(lead.whatsapp || lead.phone)} />
              ) : null}
              {tab === 'email' && canViewEmail ? (
                <LeadEmailPanel leadId={lead.id} hasEmail={Boolean(lead.email)} />
              ) : null}
              {tab === 'activities' ? (
                <LeadActivitiesPanel activities={activities} canAdd={canAddActivity} onAdd={() => setActivityOpen(true)} />
              ) : null}
              {tab === 'followups' && canViewFollowUp ? (
                <LeadFollowUpHistoryPanel
                  items={followUps}
                  loading={followUpsLoading}
                  canCreate={canFollowUp}
                  canEdit={canEditFollowUp}
                  onCreate={() => setFollowUpOpen(true)}
                  onComplete={(item) => openFollowUpActions(item, 'complete')}
                  onReschedule={(item) => openFollowUpActions(item, 'reschedule')}
                  onCancel={(item) => openFollowUpActions(item, 'cancel')}
                />
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
              statusHistory={statusHistory}
              assignmentHistory={assignmentHistory}
              canFollowUp={canFollowUp}
              canEditFollowUp={canEditFollowUp}
              canChangeStatus={canChangeStatus}
              canClose={canClose}
              canReopen={canReopen}
              canChangeOwner={canChangeOwner}
              onViewCompletion={() => setTab('overview')}
              onViewActivities={() => setTab('activities')}
              onSetReminder={() => setFollowUpOpen(true)}
              onAddNote={openNotes}
              onScheduleFollowUp={() => setFollowUpOpen(true)}
              onSendEmail={sendEmail}
              onChangeOwner={() => setOwnerOpen(true)}
              onChangeStatus={() => {
                setStatusErrors({})
                setStatusOpen(true)
              }}
              onCloseLead={() => {
                setCloseErrors({})
                setCloseOpen(true)
              }}
              onReopenLead={() => {
                setReopenErrors({})
                setReopenOpen(true)
              }}
              onCompleteNextFollowUp={() => {
                const next =
                  followUps.find((item) => ['Pending', 'Due Soon', 'Overdue'].includes(item.status)) ||
                  (lead.nextFollowUp
                    ? ({
                        id: lead.nextFollowUp.id,
                        contact: lead.name,
                        contactName: lead.name,
                        type: lead.nextFollowUp.type,
                        due: lead.nextFollowUp.dueAt || '',
                        dueAt: lead.nextFollowUp.dueAt,
                        status: lead.nextFollowUp.status,
                        priority: lead.nextFollowUp.priority || 'Medium',
                        nextAction: lead.nextFollowUp.nextAction || null,
                        reminder: lead.nextFollowUp.reminder || 'No Reminder',
                      } as FollowUpRecord)
                    : null)
                if (next) openFollowUpActions(next, 'complete')
                else toast.info('No open follow-up to complete.')
              }}
            />
          </div>
        </>
      ) : null}

      <FollowUpFormModal
        open={followUpOpen && canFollowUp}
        saving={followUpSaving}
        fixedLeadId={id}
        fixedLeadLabel={lead ? `${lead.code} — ${lead.name}` : undefined}
        onClose={() => setFollowUpOpen(false)}
        onSubmit={onFollowUp}
      />
      <CompleteFollowUpModal
        open={completeOpen && canEditFollowUp}
        saving={completing}
        followUp={selectedFollowUp}
        onClose={() => {
          setCompleteOpen(false)
          setSelectedFollowUp(null)
        }}
        onSubmit={onCompleteFollowUp}
      />
      <RescheduleFollowUpModal
        open={rescheduleOpen && canEditFollowUp}
        saving={rescheduling}
        followUp={selectedFollowUp}
        onClose={() => {
          setRescheduleOpen(false)
          setSelectedFollowUp(null)
        }}
        onSubmit={onRescheduleFollowUp}
      />
      <CancelFollowUpModal
        open={cancelOpen && canEditFollowUp}
        saving={cancelling}
        followUp={selectedFollowUp}
        onClose={() => {
          setCancelOpen(false)
          setSelectedFollowUp(null)
        }}
        onSubmit={onCancelFollowUp}
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
      <ChangeStatusModal
        open={statusOpen && canChangeStatus}
        saving={statusSaving}
        currentStatus={lead?.status || ''}
        options={lead?.statusChange?.options || []}
        lostReasons={options.lostReason}
        errors={statusErrors}
        onClose={() => setStatusOpen(false)}
        onSubmit={onUpdateStatus}
      />
      <CloseLeadModal
        open={closeOpen && canClose}
        saving={closeSaving}
        currentStatus={lead?.status || ''}
        options={lead?.statusChange?.closeOptions || []}
        lostReasons={options.lostReason}
        closeReasons={options.closeReason}
        errors={closeErrors}
        onClose={() => setCloseOpen(false)}
        onSubmit={onCloseLead}
      />
      <ReopenLeadModal
        open={reopenOpen && canReopen}
        saving={reopenSaving}
        leadName={lead?.name}
        currentOwnerId={lead?.owner?.id || null}
        assignedTeamId={lead?.assignedTeam?.id || null}
        errors={reopenErrors}
        onClose={() => setReopenOpen(false)}
        onSubmit={onReopenLead}
      />
      <ChangeOwnerModal
        open={ownerOpen && canChangeOwner}
        lead={lead || null}
        saving={ownerSaving}
        onClose={() => setOwnerOpen(false)}
        onSubmit={onAssignOwner}
      />
    </div>
  )
}
