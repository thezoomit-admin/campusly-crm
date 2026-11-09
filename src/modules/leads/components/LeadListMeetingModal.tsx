import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import { useCreateActivityMutation } from '@/redux/features/activities/activitiesApi'
import { useCreateMeetingMutation } from '@/modules/meetings/api/meetingsApi'
import { useGetLeadQuery } from '../api/leadsApi'
import ScheduleMeetingModal, {
  buildMeetingNotes,
  meetingStartIso,
  type ScheduleMeetingPayload,
} from './details/ScheduleMeetingModal'

type LeadListMeetingModalProps = {
  leadId: string | null
  open: boolean
  auth: AuthSession
  onClose: () => void
}

export default function LeadListMeetingModal({
  leadId,
  open,
  auth,
  onClose,
}: LeadListMeetingModalProps) {
  const canFollowUp = hasPermission(auth, 'follow_up:create')
  const canAddActivity = hasPermission(auth, 'activity:create')
  const canSchedule = canFollowUp || canAddActivity
  const { data, isFetching, isError, isUninitialized } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canSchedule,
  })
  const lead = data?.lead
  const loading = Boolean(
    open && leadId && canSchedule && (isUninitialized || isFetching || (!lead && !isError)),
  )
  const [createMeeting] = useCreateMeetingMutation()
  const [createActivity] = useCreateActivityMutation()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!leadId || !canSchedule) {
      onClose()
      return
    }
    if (loading) return
    if (isError) {
      toast.error('Unable to load lead for meeting.')
      onClose()
    }
  }, [open, leadId, canSchedule, loading, isError, onClose])

  async function onSubmit(payload: ScheduleMeetingPayload) {
    if (!leadId || !lead) return
    const startIso = meetingStartIso(payload)
    if (!startIso) {
      toast.error('Please choose a valid meeting date and time.')
      return
    }
    const meetingNotes = buildMeetingNotes(payload)
    setSaving(true)
    try {
      if (canFollowUp) {
        await createMeeting({
          leadId,
          dueAt: startIso,
          priority: 'Medium',
          purpose: 'Other',
          purposeOther: payload.type || 'Scheduled meeting',
          notes: meetingNotes,
          nextAction: payload.agenda || payload.title || 'Scheduled meeting',
          reminder: payload.reminder || 'No Reminder',
        }).unwrap()
      } else {
        const scheduledLabel = dayjs(startIso).format('MMM D, YYYY, h:mm A')
        await createActivity({
          type: 'MEETING',
          notes: [`Scheduled for ${scheduledLabel}`, meetingNotes]
            .filter(Boolean)
            .join('\n'),
          outcome: 'Scheduled',
          nextAction: payload.agenda || payload.title || 'Scheduled meeting',
          relatedType: 'lead',
          relatedId: leadId,
          relatedName: lead.name,
        }).unwrap()
      }
      toast.success('Meeting scheduled.')
      onClose()
    } catch (error) {
      toast.error(getApiError(error, 'Unable to schedule the meeting. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScheduleMeetingModal
      open={Boolean(open && leadId && canSchedule)}
      loading={loading}
      saving={saving}
      mode="schedule"
      leadName={lead?.name}
      leadCode={lead?.code}
      leadStatus={lead?.status}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}
