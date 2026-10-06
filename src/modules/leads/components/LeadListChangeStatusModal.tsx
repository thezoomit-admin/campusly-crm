import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import { useCreateActivityMutation, useListActivityFeedQuery } from '@/redux/features/activities/activitiesApi'
import {
  useCancelFollowUpMutation,
  useCreateFollowUpMutation,
  useListLeadFollowUpsQuery,
  useRescheduleFollowUpMutation,
} from '@/modules/follow-ups/api/followUpsApi'
import {
  useSendEmailMessageMutation,
  useStartLeadEmailMutation,
} from '@/modules/email/api/emailApi'
import {
  useGetLeadQuery,
  useUpdateLeadStatusMutation,
  useUploadLeadDocumentMutation,
} from '../api/leadsApi'
import { useLeadMasterOptions } from '../hooks/useLeadMasterOptions'
import ChangeStatusModal, {
  type ChangeStatusEmailPayload,
  type ChangeStatusSubmitPayload,
} from './details/ChangeStatusModal'

type LeadListChangeStatusModalProps = {
  leadId: string | null
  open: boolean
  auth: AuthSession
  onClose: () => void
}

export default function LeadListChangeStatusModal({
  leadId,
  open,
  auth,
  onClose,
}: LeadListChangeStatusModalProps) {
  const options = useLeadMasterOptions()
  const canUpdateStatus = hasPermission(auth, 'lead:update_status')
  const canFollowUp = hasPermission(auth, 'follow_up:create')
  const canEditFollowUp = hasPermission(auth, 'follow_up:edit')
  const canAddActivity = hasPermission(auth, 'activity:create')
  const canViewActivity = hasPermission(auth, 'activity:view')
  const canUploadDocument = hasPermission(auth, 'document:upload')

  const { data, isFetching, isError } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canUpdateStatus,
  })
  const lead = data?.lead
  const canChangeStatus = Boolean(canUpdateStatus && lead?.statusChange?.canUpdate)

  const { data: activityData } = useListActivityFeedQuery(
    { relatedId: leadId || '' },
    { skip: !open || !leadId || !canViewActivity },
  )
  const { data: followUpData } = useListLeadFollowUpsQuery(leadId || '', {
    skip: !open || !leadId || (!canFollowUp && !canEditFollowUp),
  })

  const [updateStatus, { isLoading: statusSaving }] = useUpdateLeadStatusMutation()
  const [createFollowUp, { isLoading: followUpSaving }] = useCreateFollowUpMutation()
  const [rescheduleFollowUp, { isLoading: rescheduling }] = useRescheduleFollowUpMutation()
  const [cancelFollowUp, { isLoading: cancelling }] = useCancelFollowUpMutation()
  const [createActivity, { isLoading: activitySaving }] = useCreateActivityMutation()
  const [uploadLeadDocument, { isLoading: documentUploading }] = useUploadLeadDocumentMutation()
  const [startLeadEmail] = useStartLeadEmailMutation()
  const [sendEmailMessage, { isLoading: emailSending }] = useSendEmailMessageMutation()

  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) {
      setReady(false)
      setStatusErrors({})
      return
    }
    if (!leadId || !canUpdateStatus) {
      onClose()
      return
    }
    if (isFetching || !lead) return
    if (isError) {
      toast.error('Unable to load lead for status change.')
      onClose()
      return
    }
    if (!lead.statusChange?.canUpdate) {
      toast.info(lead.statusChange?.lockedReason || 'Status cannot be changed for this lead.')
      onClose()
      return
    }
    setReady(true)
  }, [open, leadId, canUpdateStatus, isFetching, isError, lead, onClose])

  async function onUpdateStatus(body: ChangeStatusSubmitPayload) {
    if (!canUpdateStatus || !leadId || !lead) return
    setStatusErrors({})
    try {
      const channelNote = body.channels.length > 0 ? `Channel: ${body.channels.join(', ')}` : ''
      const remarks = [body.remarks.trim(), channelNote].filter(Boolean).join('\n')

      await updateStatus({
        id: leadId,
        body: {
          statusCode: body.statusCode,
          remarks,
          lostReasonCode: body.lostReasonCode,
          override: body.override,
          overrideReason: body.overrideReason,
        },
      }).unwrap()

      if (body.nextFollowUpAt) {
        const followUpType = body.channels.includes('CALL')
          ? 'Call'
          : body.channels.includes('WHATSAPP')
            ? 'WhatsApp'
            : body.channels.includes('EMAIL')
              ? 'Email'
              : body.channels.includes('SMS')
                ? 'SMS'
                : 'Call'
        const reason = body.remarks.trim() || 'Next follow-up updated with status change'
        const previousDue = lead.nextFollowUp?.dueAt ? dayjs(lead.nextFollowUp.dueAt) : null
        const nextDueAt = previousDue?.isValid()
          ? dayjs(body.nextFollowUpAt)
              .hour(previousDue.hour())
              .minute(previousDue.minute())
              .second(0)
              .millisecond(0)
              .toISOString()
          : dayjs(body.nextFollowUpAt).hour(10).minute(0).second(0).millisecond(0).toISOString()

        const followUps = followUpData?.items || []
        if (lead.nextFollowUp && canEditFollowUp) {
          const currentNextId = lead.nextFollowUp.id
          await rescheduleFollowUp({
            id: currentNextId,
            body: { dueAt: nextDueAt, reason },
          }).unwrap()

          const otherOpen = followUps.filter(
            (item) =>
              item.id !== currentNextId &&
              ['Pending', 'Due Soon', 'Overdue'].includes(item.status),
          )
          for (const item of otherOpen) {
            await cancelFollowUp({
              id: item.id,
              body: { reason: 'Superseded by status change follow-up' },
            }).unwrap()
          }
        } else if (canFollowUp) {
          await createFollowUp({
            leadId,
            type: followUpType,
            dueAt: nextDueAt,
            priority: 'Medium',
            purpose: 'Other',
            purposeOther: 'Status change follow-up',
            notes: body.remarks,
            nextAction: body.remarks.slice(0, 200) || 'Follow up after status change',
            reminder: 'No Reminder',
          }).unwrap()
        }
      }

      if (body.scheduleMeeting && body.meeting) {
        const meeting = body.meeting
        const startIso =
          meeting.date && meeting.startTime
            ? dayjs(`${meeting.date}T${meeting.startTime}:00`).toISOString()
            : meeting.date
              ? dayjs(`${meeting.date}T09:00:00`).toISOString()
              : body.nextFollowUpAt
        const meetingNotes = [
          meeting.title,
          `Type: ${meeting.type}`,
          `Mode: ${meeting.mode}`,
          meeting.location ? `Location: ${meeting.location}` : '',
          meeting.endTime ? `End: ${meeting.endTime}` : '',
          meeting.agenda ? `Agenda: ${meeting.agenda}` : '',
        ]
          .filter(Boolean)
          .join('\n')

        if (canAddActivity) {
          await createActivity({
            type: 'MEETING',
            notes: meetingNotes,
            outcome: 'Scheduled',
            nextAction: meeting.agenda || meeting.title || 'Scheduled meeting',
            relatedType: 'lead',
            relatedId: leadId,
            relatedName: lead.name,
          }).unwrap()
        }

        if (canFollowUp && startIso) {
          await createFollowUp({
            leadId,
            type: 'Meeting',
            dueAt: startIso,
            priority: 'Medium',
            purpose: 'Other',
            purposeOther: meeting.type || 'Scheduled meeting',
            notes: meetingNotes,
            nextAction: meeting.agenda || meeting.title || 'Scheduled meeting',
            reminder: 'No Reminder',
          }).unwrap()
        }
      }

      if (canUploadDocument && body.attachment) {
        await uploadLeadDocument({
          id: leadId,
          fileName: body.attachment.name.replace(/\.[^.]+$/, '') || body.attachment.name,
          file: body.attachment,
        }).unwrap()
      }

      toast.success('Lead status updated.')
      onClose()
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) setStatusErrors(fields)
      toast.error(getApiError(error, 'Unable to update the lead status. Please try again.'))
    }
  }

  async function onSendStatusEmail(body: ChangeStatusEmailPayload) {
    if (!leadId || !lead?.email) {
      toast.error('This lead has no email address.')
      return
    }
    try {
      const started = await startLeadEmail(leadId).unwrap()
      await sendEmailMessage({
        id: started.thread.id,
        to: lead.email,
        subject: body.subject,
        text: body.body,
      }).unwrap()
      toast.success('Email sent.')
      onClose()
    } catch (error) {
      toast.error(getApiError(error, 'Unable to send email. Please try again.'))
    }
  }

  return (
    <ChangeStatusModal
      open={open && ready && canChangeStatus}
      saving={
        statusSaving || followUpSaving || rescheduling || cancelling || activitySaving || documentUploading
      }
      emailSending={emailSending}
      leadName={lead?.name || 'Lead'}
      leadEmail={lead?.email}
      activities={activityData?.items || []}
      options={lead?.statusChange?.options || []}
      lostReasons={options.lostReason}
      errors={statusErrors}
      onClose={onClose}
      onSubmit={onUpdateStatus}
      onSendEmail={onSendStatusEmail}
    />
  )
}
