import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon } from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'

export default function LeadSectionCard({
  title,
  canEdit,
  editing,
  saving,
  actionLabel = 'Edit',
  extra,
  onEdit,
  onCancel,
  onSave,
  children,
}: {
  title: string
  canEdit?: boolean
  editing?: boolean
  saving?: boolean
  actionLabel?: string
  extra?: ReactNode
  onEdit?: () => void
  onCancel?: () => void
  onSave?: () => void
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h3 className="m-0 flex items-center gap-2.5 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">
          <span className="h-4 w-[3px] rounded-full bg-primary" />
          {title}
        </h3>
        {extra ? (
          extra
        ) : canEdit && editing ? (
          <div className="flex items-center gap-2">
            <PrimaryButton type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </PrimaryButton>
            <PrimaryButton type="button" size="sm" loading={saving} onClick={onSave}>
              Save
            </PrimaryButton>
          </div>
        ) : canEdit ? (
          <PrimaryButton
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-transparent px-1.5 py-1 text-[0.82rem] font-medium text-[#8b97a8] hover:bg-hover-bg hover:text-primary"
            onClick={onEdit}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={14} color="currentColor" strokeWidth={1.8} />
            {actionLabel}
          </PrimaryButton>
        ) : null}
      </header>
      {children}
    </section>
  )
}
