import type { ReactNode } from 'react'

export function SettingRow({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-text-strong">{label}</span>
      {children}
      {error ? <span className="text-[0.78rem] text-[#b42318]">{error}</span> : null}
      {hint ? <span className="text-[0.78rem] leading-snug text-text-muted">{hint}</span> : null}
    </label>
  )
}

export function SettingSwitchRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle px-3 py-3">
      <div className="grid gap-1">
        <span className="text-sm font-medium text-text-strong">{label}</span>
        {hint ? <span className="text-[0.78rem] leading-snug text-text-muted">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

export function SettingsSaveBar({
  dirty,
  updatedAt,
  canSave,
  readOnlyHint,
  children,
}: {
  dirty: boolean
  updatedAt?: string | null
  canSave: boolean
  readOnlyHint?: string
  children?: ReactNode
}) {
  const updated = updatedAt ? new Date(updatedAt) : null
  const updatedLabel =
    updated && !Number.isNaN(updated.getTime())
      ? `Last saved ${updated.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
      : 'Not saved yet'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
      <p className="m-0 text-[0.78rem] text-text-muted">{canSave ? (dirty ? 'Unsaved changes' : updatedLabel) : readOnlyHint}</p>
      {children}
    </div>
  )
}
