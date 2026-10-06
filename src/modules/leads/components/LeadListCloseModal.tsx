import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import { useCloseLeadMutation, useGetLeadQuery } from '../api/leadsApi'
import { useLeadMasterOptions } from '../hooks/useLeadMasterOptions'
import { CloseLeadModal } from './details/LeadDetailsModals'

type LeadListCloseModalProps = {
  leadId: string | null
  open: boolean
  auth: AuthSession
  onClose: () => void
}

export default function LeadListCloseModal({
  leadId,
  open,
  auth,
  onClose,
}: LeadListCloseModalProps) {
  const canClosePermission = hasPermission(auth, 'lead:close')
  const options = useLeadMasterOptions()
  const { data, isFetching, isError } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canClosePermission,
  })
  const lead = data?.lead
  const canClose = Boolean(canClosePermission && lead?.statusChange?.canClose)
  const [closeLead, { isLoading: saving }] = useCloseLeadMutation()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) {
      setReady(false)
      setErrors({})
      return
    }
    if (!leadId || !canClosePermission) {
      onClose()
      return
    }
    if (isFetching || !lead) return
    if (isError) {
      toast.error('Unable to load lead for close.')
      onClose()
      return
    }
    if (!lead.statusChange?.canClose) {
      toast.info(lead.statusChange?.lockedReason || 'This lead cannot be closed.')
      onClose()
      return
    }
    setReady(true)
  }, [open, leadId, canClosePermission, isFetching, isError, lead, onClose])

  async function onSubmit(body: { statusCode: string; reasonCode: string; remarks: string }) {
    if (!canClose || !leadId) return
    setErrors({})
    try {
      await closeLead({ id: leadId, body }).unwrap()
      toast.success('Lead closed successfully.')
      onClose()
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) setErrors(fields)
      toast.error(getApiError(error, 'Unable to complete this action. Please try again.'))
    }
  }

  return (
    <CloseLeadModal
      open={open && ready && canClose}
      saving={saving}
      currentStatus={lead?.status || ''}
      options={lead?.statusChange?.closeOptions || []}
      lostReasons={options.lostReason}
      closeReasons={options.closeReason}
      errors={errors}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}
