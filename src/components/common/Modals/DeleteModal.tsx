import type { ReactNode } from 'react'
import { CancelCircleIcon } from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import HugeIcon from '@/components/ui/Icon/HugeIcon'
import AntModal from './AntModal'

type DeleteModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  title?: string
  message?: ReactNode
  itemName?: string
  loading?: boolean
  width?: number | string
}

export default function DeleteModal({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  itemName = 'this item',
  loading = false,
  width = 340,
}: DeleteModalProps) {
  function handleClose() {
    if (!loading) {
      onCancel()
    }
  }

  return (
    <AntModal open={open} onClose={handleClose} width={width} footer={null}>
      <div className="flex flex-col items-center">
        <HugeIcon icon={CancelCircleIcon} size={64} className="mb-3 text-red-500" />
        <h2 className="mb-2 text-center text-lg font-bold text-text-strong">
          {title || `Delete ${itemName}?`}
        </h2>
        <p className="mb-5 text-center text-[0.95rem] leading-relaxed text-text-muted">
          {message || (
            <>
              Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be
              undone.
            </>
          )}
        </p>
        <div className="flex w-full justify-center gap-3">
          <PrimaryButton variant="outline" onClick={handleClose} disabled={loading} label="Cancel" />
          <PrimaryButton
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            label="Delete"
          />
        </div>
      </div>
    </AntModal>
  )
}
