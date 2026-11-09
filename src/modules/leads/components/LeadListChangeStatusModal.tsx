import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import { useCreateActivityMutation, useListActivityFeedQuery } from '@/redux/features/activities/activitiesApi'
import { useCreateMeetingMutation } from '@/modules/meetings/api/meetingsApi'
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
  /** Keep false until the page list query has been dispatched. */
  loadOptions?: boolean
}

export default function LeadListChangeStatusModal({
  leadId,
  open,
  auth,
  onClose,
  loadOptions = true,
}: LeadListChangeStatusModalProps) {
  const options = useLeadMasterOptions({ skip: !loadOptions })
  const canUpdateStatus = hasPermission(auth, 'lead:update_status')
  const canFollowUp = hasPermission(auth, 'follow_up:create')
  const canAddActivity = hasPermission(auth, 'activity:create')
  const canViewActivity = hasPermission(auth, 'activity:view')
  const canUploadDocument = hasPermission(auth, 'document:upload')

  const { data, isFetching, isError, isUninitialized } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canUpdateStatus,
  })
  const lead = data?.lead
  const canChangeStatus = Boolean(canUpdateStatus && lead?.statusChange?.canUpdate)
  const loading = Boolean(
    open && leadId && canUpdateStatus && (isUninitialized || isFetching || (!lead && !isError)),
  )

  const { data: activityData } = useListActivityFeedQuery(
    { relatedId: leadId || '' },
    { skip: !open || !leadId || !canViewActivity || loading },
  )

  const [updateStatus, { isLoading: statusSaving }] = useUpdateLeadStatusMutation()
  const [createMeeting, { isLoading: meetingSaving }] = useCreateMeetingMutation()
  const [createActivity, { isLoading: activitySaving }] = useCreateActivityMutation()
  const [uploadLeadDocument, { isLoading: documentUploading }] = useUploadLeadDocumentMutation()
  const [startLeadEmail] = useStartLeadEmailMutation()
  const [sendEmailMessage, { isLoading: emailSending }] = useSendEmailMessageMutation()

  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      setStatusErrors({})
      return
    }
    if (!leadId || !canUpdateStatus) {
      onClose()
      return
    }
    if (loading) return
    if (isError) {
      toast.error('Unable to load lead for status change.')
      onClose()
      return
    }
    if (lead && !lead.statusChange?.canUpdate) {
      toast.info(lead.statusChange?.lockedReason || 'Status cannot be changed for this lead.')
      onClose()
    }
  }, [open, leadId, canUpdateStatus, loading, isError, lead, onClose])

  async function onUpdateStatus(body: ChangeStatusSubmitPayload) {
    if (!canUpdateStatus || !leadId || !lead) return
    setStatusErrors({})
    try {
      const channelNote = body.channels.length > 0 ? `Channel: ${body.channels.join(', ')}` : ''
      const remarks = [body.remarks.trim(), channelNote].filter(Boolean).join('\n')

      const followUpType = body.channels.includes('CALL')
        ? 'Call'
        : body.channels.includes('WHATSAPP')
          ? 'WhatsApp'
          : body.channels.includes('EMAIL')
            ? 'Email'
            : 'Call'

      const previousDue = lead.nextFollowUp?.dueAt ? dayjs(lead.nextFollowUp.dueAt) : null
      const nextDueAt = body.nextFollowUpAt
        ? previousDue?.isValid()
          ? dayjs(body.nextFollowUpAt)
              .hour(previousDue.hour())
              .minute(previousDue.minute())
              .second(0)
              .millisecond(0)
              .toISOString()
          : dayjs(body.nextFollowUpAt).hour(10).minute(0).second(0).millisecond(0).toISOString()
        : undefined

      await updateStatus({
        id: leadId,
        body: {
          statusCode: body.statusCode,
          remarks,
          lostReasonCode: body.lostReasonCode,
          override: body.override,
          overrideReason: body.overrideReason,
          nextFollowUpAt: nextDueAt,
          followUpType,
          channels: body.channels,
        },
      }).unwrap()

      toast.success('Lead status updated.')
      onClose()
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) setStatusErrors(fields)
      toast.error(getApiError(error, 'Unable to update the lead status. Please try again.'))
      return
    }

    try {
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

        if (canFollowUp && startIso) {
          await createMeeting({
            leadId,
            dueAt: startIso,
            priority: 'Medium',
            purpose: 'Other',
            purposeOther: meeting.type || 'Scheduled meeting',
            notes: meetingNotes,
            nextAction: meeting.agenda || meeting.title || 'Scheduled meeting',
            reminder: '30 Minutes Before',
          }).unwrap()
        } else if (canAddActivity && startIso) {
          const scheduledLabel = dayjs(startIso).format('MMM D, YYYY, h:mm A')
          await createActivity({
            type: 'MEETING',
            notes: [`Scheduled for ${scheduledLabel}`, meetingNotes].filter(Boolean).join('\n'),
            outcome: 'Scheduled',
            nextAction: meeting.agenda || meeting.title || 'Scheduled meeting',
            relatedType: 'lead',
            relatedId: leadId,
            relatedName: lead.name,
          }).unwrap()
        }
      }

      if (canUploadDocument && body.attachment) {
        const attachmentName =
          body.attachment.name.replace(/\.[^.]+$/, '') || body.attachment.name
        await uploadLeadDocument({
          id: leadId,
          file: body.attachment,
          categoryCode: 'OTHER',
          typeCode: 'OTHER',
          name: attachmentName.slice(0, 150),
          fileName: body.attachment.name,
        }).unwrap()
      }
    } catch (error) {
      toast.error(
        getApiError(
          error,
          'Status updated, but a follow-up action failed. Please try again from the lead workspace.',
        ),
      )
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
      open={Boolean(open && leadId && canUpdateStatus)}
      loading={loading || (Boolean(lead) && !canChangeStatus && !isError)}
      saving={statusSaving || meetingSaving || activitySaving || documentUploading}
      emailSending={emailSending}
      leadName={lead?.name || 'Lead'}
      leadEmail={lead?.email}
      currentStatus={lead?.statusChange?.current?.name || lead?.status}
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
