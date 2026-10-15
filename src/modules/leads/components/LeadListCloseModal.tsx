import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'
import type { AuthSession } from '@/types'
import { useCloseLeadMutation, useGetLeadQuery } from '../api/leadsApi'
import type { MasterOption } from '../hooks/useLeadMasterOptions'
import { CloseLeadModal } from './details/LeadDetailsModals'

type LeadListCloseModalProps = {
  leadId: string | null
  open: boolean
  auth: AuthSession
  currentStatus?: string
  onClose: () => void
}

function toMasterOptions(
  items?: Array<{ code?: string | null; name: string }>,
): MasterOption[] {
  return (items || [])
    .filter((item) => item.code)
    .map((item) => ({ value: item.code as string, label: item.name }))
}

export default function LeadListCloseModal({
  leadId,
  open,
  auth,
  currentStatus = '',
  onClose,
}: LeadListCloseModalProps) {
  const canClosePermission = hasPermission(auth, 'lead:close')
  const { data, isFetching, isError, isUninitialized } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canClosePermission,
  })
  const { data: lostReasonData } = useListMasterDataOptionsQuery(
    { category: 'LEAD_LOST_REASON' },
    { skip: !open },
  )
  const { data: closeReasonData } = useListMasterDataOptionsQuery(
    { category: 'LEAD_CLOSE_REASON' },
    { skip: !open },
  )
  const lead = data?.lead
  const canClose = Boolean(canClosePermission && lead?.statusChange?.canClose)
  const [closeLead, { isLoading: saving }] = useCloseLeadMutation()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const lostReasons = useMemo(
    () => toMasterOptions(lostReasonData?.items),
    [lostReasonData?.items],
  )
  const closeReasons = useMemo(
    () => toMasterOptions(closeReasonData?.items),
    [closeReasonData?.items],
  )

  const loading = Boolean(open && leadId && (isUninitialized || isFetching || !lead))

  useEffect(() => {
    if (!open) {
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
    }
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
      open={Boolean(open && leadId && canClosePermission && (loading || canClose))}
      saving={saving}
      loading={loading}
      currentStatus={lead?.status || currentStatus}
      options={lead?.statusChange?.closeOptions || []}
      lostReasons={lostReasons}
      closeReasons={closeReasons}
      errors={errors}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}
