import { CancelCircleIcon } from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import HugeIcon from '@/components/ui/Icon/HugeIcon'
import AntModal from './AntModal'

type DeleteModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  title?: string
  message?: string
  itemName?: string
  loading?: boolean
}

export default function DeleteModal({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  itemName = 'this item',
  loading = false,
}: DeleteModalProps) {
  return (
    <AntModal open={open} onClose={onCancel} width={400} footer={null}>
      <div className="flex flex-col items-center">
        <HugeIcon icon={CancelCircleIcon} size={72} className="mb-4 text-red-500" />
        <h2 className="mb-3 text-center text-xl font-bold text-text-strong">
          {title || `Delete ${itemName}?`}
        </h2>
        <p className="mb-6 text-center leading-relaxed text-text-muted">
          {message ||
            `This action cannot be undone. Are you sure you want to permanently delete ${itemName}?`}
        </p>
        <div className="flex w-full justify-center gap-3">
          <PrimaryButton variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </PrimaryButton>
          <PrimaryButton onClick={onConfirm} loading={loading} className="!bg-red-500 hover:enabled:!bg-red-600">
            Delete
          </PrimaryButton>
        </div>
      </div>
    </AntModal>
  )
}
