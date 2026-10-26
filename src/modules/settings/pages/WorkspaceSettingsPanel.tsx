import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { FormInput, FormSelect } from '@/components/common/Forms'
import { PrimaryButton } from '@/components/ui'
import { getApiError, getApiErrorFields, isGloballyToastedApiError } from '@/lib/api'
import { adminCard, adminForm } from '@/styles/admin'
import { useGetWorkspaceSettingsQuery, useUpdateWorkspaceSettingsMutation } from '../api/settingsApi'
import { SettingRow, SettingsSaveBar } from '../components/SettingRow'

export default function WorkspaceSettingsPanel() {
  const { data, isFetching, isError, error, refetch } = useGetWorkspaceSettingsQuery()
  const [save, { isLoading }] = useUpdateWorkspaceSettingsMutation()
  const saved = data?.workspace
  const [name, setName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [timezone, setTimezone] = useState('Asia/Dhaka')
  const [currency, setCurrency] = useState('BDT')
  const [dateFormat, setDateFormat] = useState('DD MMM YYYY')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!saved) return
    setName(saved.name)
    setSupportEmail(saved.supportEmail)
    setTimezone(saved.timezone)
    setCurrency(saved.currency)
    setDateFormat(saved.dateFormat)
    setErrors({})
  }, [saved])

  const dirty = useMemo(() => {
    if (!saved) return false
    return (
      name !== saved.name ||
      supportEmail !== saved.supportEmail ||
      timezone !== saved.timezone ||
      currency !== saved.currency ||
      dateFormat !== saved.dateFormat
    )
  }, [currency, dateFormat, name, saved, supportEmail, timezone])

  const canConfigure = Boolean(data?.canConfigure)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!saved || !canConfigure) return
    setErrors({})
    try {
      await save({ name, supportEmail, timezone, currency, dateFormat, updatedAt: saved.updatedAt }).unwrap()
      toast.success('Workspace settings saved.')
    } catch (error) {
      const fields = getApiErrorFields(error)
      setErrors(fields)
      const status = error && typeof error === 'object' && 'status' in error ? (error as { status?: number }).status : undefined
      if (status === 409) void refetch()
      if (!isGloballyToastedApiError(error)) toast.error(getApiError(error, 'Unable to save workspace settings.'))
    }
  }

  if (isError) {
    return (
      <section className={`${adminCard} grid gap-3`}>
        <p className="m-0 text-sm text-text-muted">{getApiError(error, 'Workspace settings could not be loaded.')}</p>
        <div>
          <PrimaryButton variant="outline" label="Try again" onClick={() => void refetch()} />
        </div>
      </section>
    )
  }

  return (
    <section className={`${adminCard} grid max-w-3xl gap-5`}>
      <header className="grid gap-1 border-b border-border-subtle pb-4">
        <h2 className="m-0 text-lg font-semibold text-text-strong">Workspace</h2>
        <p className="m-0 text-sm text-text-muted">
          These values apply to the whole consultancy. Page titles, new receipts, new payments, and outbound email use them.
        </p>
      </header>

      {isFetching && !saved ? <p className="m-0 text-sm text-text-muted">Loading workspace settings…</p> : null}

      {saved ? (
        <form className={adminForm} onSubmit={handleSubmit}>
          <SettingRow
            label="Workspace name"
            hint="Shown in the browser title, the dashboard footer, receipt headers, and the From name on outbound email."
            error={errors.name}
          >
            <FormInput value={name} maxLength={80} disabled={!canConfigure} onChange={(event) => setName(event.target.value)} />
          </SettingRow>

          <SettingRow
            label="Support email"
            hint="Public reply-to address. The sending mailbox stays in the server environment and is not edited here."
            error={errors.supportEmail}
          >
            <FormInput
              type="email"
              value={supportEmail}
              maxLength={120}
              disabled={!canConfigure}
              onChange={(event) => setSupportEmail(event.target.value)}
            />
          </SettingRow>

          <SettingRow
            label="Timezone"
            hint="Used when the CRM stamps an assignment time."
            error={errors.timezone}
          >
            <FormSelect
              value={timezone}
              disabled={!canConfigure}
              allowClear={false}
              options={(data?.options.timezones || []).map((value) => ({ value, label: value }))}
              onChange={(value) => setTimezone(String(value))}
            />
          </SettingRow>

          <SettingRow
            label="Currency"
            hint="Default for new payments and for payment summaries. Payments already saved keep their own currency."
            error={errors.currency}
          >
            <FormSelect
              value={currency}
              disabled={!canConfigure}
              allowClear={false}
              options={(data?.options.currencies || []).map((value) => ({ value, label: value }))}
              onChange={(value) => setCurrency(String(value))}
            />
          </SettingRow>

          <SettingRow
            label="Date format"
            hint="Used on new receipts and on assignment timestamps."
            error={errors.dateFormat}
          >
            <FormSelect
              value={dateFormat}
              disabled={!canConfigure}
              allowClear={false}
              options={(data?.options.dateFormats || []).map((value) => ({ value, label: value }))}
              onChange={(value) => setDateFormat(String(value))}
            />
          </SettingRow>

          <SettingsSaveBar
            dirty={dirty}
            updatedAt={saved.updatedAt}
            canSave={canConfigure}
            readOnlyHint="You can view these settings. Changing them needs the configure permission."
          >
            {canConfigure ? (
              <PrimaryButton type="submit" disabled={!dirty || isLoading} label={isLoading ? 'Saving…' : 'Save changes'} />
            ) : null}
          </SettingsSaveBar>
        </form>
      ) : null}
    </section>
  )
}
