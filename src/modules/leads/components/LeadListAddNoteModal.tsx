import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import { useCreateActivityMutation } from '@/redux/features/activities/activitiesApi'
import { useCreateFollowUpMutation } from '@/modules/follow-ups/api/followUpsApi'
import { useCreateMeetingMutation } from '@/modules/meetings/api/meetingsApi'
import { useCreateLeadNoteMutation, useGetLeadQuery } from '../api/leadsApi'
import AddNoteModal, {
  AddNotePartialError,
  type AddNoteMeetingPayload,
  type AddNoteSavedState,
  type AddNoteSubmitPayload,
} from './details/AddNoteModal'

type LeadListAddNoteModalProps = {
  leadId: string | null
  open: boolean
  auth: AuthSession
  onClose: () => void
}

function successMessage(payload: AddNoteSubmitPayload) {
  if (payload.meeting) return 'Note saved and meeting scheduled.'
  if (payload.followUp) return 'Note saved and follow-up scheduled.'
  return 'Note saved.'
}

export default function LeadListAddNoteModal({
  leadId,
  open,
  auth,
  onClose,
}: LeadListAddNoteModalProps) {
  const canAddActivity = hasPermission(auth, 'activity:create')
  const canEdit = hasPermission(auth, 'lead:edit')
  const canFollowUp = hasPermission(auth, 'follow_up:create')
  const canScheduleMeeting = canFollowUp || canAddActivity

  const { data, isFetching, isError, isUninitialized } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canAddActivity,
  })
  const lead = data?.lead
  const loading = Boolean(
    open && leadId && canAddActivity && (isUninitialized || isFetching || (!lead && !isError)),
  )
  const [createLeadNote] = useCreateLeadNoteMutation()
  const [createActivity] = useCreateActivityMutation()
  const [createFollowUp] = useCreateFollowUpMutation()
  const [createMeeting] = useCreateMeetingMutation()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!leadId || !canAddActivity) {
      onClose()
      return
    }
    if (loading) return
    if (isError) {
      toast.error('Unable to load lead for note.')
      onClose()
    }
  }, [open, leadId, canAddActivity, loading, isError, onClose])

  async function saveMeeting(meeting: AddNoteMeetingPayload, noteText: string) {
    if (!leadId || !lead) return
    const startIso = dayjs(`${meeting.date}T${meeting.startTime}:00`).toISOString()
    const meetingNotes = [
      meeting.title,
      `Type: ${meeting.type}`,
      `Mode: ${meeting.mode}`,
      meeting.location ? `Location: ${meeting.location}` : '',
      meeting.link ? `Link: ${meeting.link}` : '',
      meeting.endTime ? `End: ${meeting.endTime}` : '',
      meeting.agenda ? `Agenda: ${meeting.agenda}` : '',
      noteText ? `Note: ${noteText}` : '',
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, 1000)
    const nextAction = meeting.agenda || meeting.title || 'Scheduled meeting'

    if (canFollowUp) {
      await createMeeting({
        leadId,
        dueAt: startIso,
        priority: 'Medium',
        purpose: 'Other',
        purposeOther: meeting.type || 'Scheduled meeting',
        notes: meetingNotes,
        nextAction,
        reminder: 'No Reminder',
        sourceReason: 'Created from lead note',
      }).unwrap()
      return
    }

    await createActivity({
      type: 'MEETING',
      notes: [`Scheduled for ${dayjs(startIso).format('MMM D, YYYY, h:mm A')}`, meetingNotes]
        .filter(Boolean)
        .join('\n'),
      outcome: 'Scheduled',
      nextAction,
      relatedType: 'lead',
      relatedId: leadId,
      relatedName: lead.name,
    }).unwrap()
  }

  async function onSubmit(payload: AddNoteSubmitPayload) {
    if (!leadId || !lead) return
    setSaving(true)
    const saved: AddNoteSavedState = { ...payload.committed }
    try {
      if (!saved.note) {
        const noteBody = [
          payload.channelLabel ? `Channel: ${payload.channelLabel}` : '',
          payload.notes,
        ]
          .filter(Boolean)
          .join('\n\n')
        if (canEdit) {
          await createLeadNote({ id: leadId, body: noteBody }).unwrap()
        } else {
          await createActivity({
            type: 'NOTE',
            notes: noteBody,
            outcome: 'Note added',
            relatedType: 'lead',
            relatedId: leadId,
            relatedName: lead.name,
          }).unwrap()
        }
        saved.note = true
      }

      if (payload.followUp && !saved.followUp) {
        if (!canFollowUp) {
          throw new Error('You do not have permission to schedule a follow-up.')
        }
        await createFollowUp({
          leadId,
          type: payload.followUp.type,
          dueAt: payload.followUp.dueAt,
          priority: 'Medium',
          purpose: 'Information Sharing',
          notes: payload.notes.slice(0, 1000),
          nextAction: payload.followUp.nextAction,
          reminder: payload.followUp.reminder,
          ownerId: payload.followUp.assigneeId,
          source: 'Manual',
          sourceReason: 'Created from lead note',
        }).unwrap()
        saved.followUp = true
      }

      if (payload.meeting && !saved.meeting) {
        await saveMeeting(payload.meeting, payload.notes)
        saved.meeting = true
      }

      toast.success(successMessage(payload))
      onClose()
    } catch (error) {
      if (error instanceof AddNotePartialError) throw error
      const anythingSaved = saved.note || saved.followUp || saved.meeting
      if (anythingSaved && (payload.followUp || payload.meeting)) {
        toast.error(getApiError(error, 'Unable to finish saving.'))
        throw new AddNotePartialError(saved)
      }
      toast.error(getApiError(error, 'Unable to save note.'))
      throw error
    } finally {
      setSaving(false)
    }
  }

  return (
    <AddNoteModal
      open={Boolean(open && leadId && canAddActivity)}
      loading={loading}
      saving={saving}
      lead={lead || null}
      canScheduleFollowUp={canFollowUp}
      canScheduleMeeting={canScheduleMeeting}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}
