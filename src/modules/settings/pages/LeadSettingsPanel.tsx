import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { FormInput, FormSwitch } from '@/components/common/Forms'
import { PrimaryButton } from '@/components/ui'
import { getApiError, getApiErrorFields, isGloballyToastedApiError } from '@/lib/api'
import { adminCard, adminForm } from '@/styles/admin'
import { useGetWorkspaceSettingsQuery, useUpdateLeadSettingsMutation } from '../api/settingsApi'
import { SettingRow, SettingSwitchRow, SettingsSaveBar } from '../components/SettingRow'

export default function LeadSettingsPanel() {
  const { data, isFetching, isError, error, refetch } = useGetWorkspaceSettingsQuery()
  const [save, { isLoading }] = useUpdateLeadSettingsMutation()
  const saved = data?.leads
  const [days, setDays] = useState('1')
  const [prefix, setPrefix] = useState('L')
  const [duplicateCheck, setDuplicateCheck] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!saved) return
    setDays(String(saved.defaultFollowUpDays))
    setPrefix(saved.leadCodePrefix)
    setDuplicateCheck(saved.duplicateCheckEnabled)
    setErrors({})
  }, [saved])

  const dirty = useMemo(() => {
    if (!saved) return false
    return (
      Number(days) !== saved.defaultFollowUpDays ||
      prefix !== saved.leadCodePrefix ||
      duplicateCheck !== saved.duplicateCheckEnabled
    )
  }, [days, duplicateCheck, prefix, saved])

  const canConfigure = Boolean(data?.canConfigure)
  const sample = `${(prefix || 'L').toUpperCase()}-0001`

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!saved || !canConfigure) return
    setErrors({})
    try {
      await save({
        defaultFollowUpDays: Number(days),
        leadCodePrefix: prefix,
        duplicateCheckEnabled: duplicateCheck,
        updatedAt: saved.updatedAt,
      }).unwrap()
      toast.success('Lead settings saved.')
    } catch (error) {
      setErrors(getApiErrorFields(error))
      const status = error && typeof error === 'object' && 'status' in error ? (error as { status?: number }).status : undefined
      if (status === 409) void refetch()
      if (!isGloballyToastedApiError(error)) toast.error(getApiError(error, 'Unable to save lead settings.'))
    }
  }

  if (isError) {
    return (
      <section className={`${adminCard} grid gap-3`}>
        <p className="m-0 text-sm text-text-muted">{getApiError(error, 'Lead settings could not be loaded.')}</p>
        <div>
          <PrimaryButton variant="outline" label="Try again" onClick={() => void refetch()} />
        </div>
      </section>
    )
  }

  return (
    <section className={`${adminCard} grid max-w-3xl gap-5`}>
      <header className="grid gap-1 border-b border-border-subtle pb-4">
        <h2 className="m-0 text-lg font-semibold text-text-strong">Lead operations</h2>
        <p className="m-0 text-sm text-text-muted">
          Operating rules for new leads. Statuses, sources, and countries stay in Master Data.
        </p>
      </header>

      {isFetching && !saved ? <p className="m-0 text-sm text-text-muted">Loading lead settings…</p> : null}

      {saved ? (
        <form className={adminForm} onSubmit={handleSubmit}>
          <SettingRow
            label="First follow-up due"
            hint="Days after a lead is assigned, including leads created from the website, email, WhatsApp, or Meta. Counselling and payment follow-ups keep their own schedule."
            error={errors.defaultFollowUpDays}
          >
            <FormInput
              type="number"
              min={1}
              max={30}
              value={days}
              disabled={!canConfigure}
              onChange={(event) => setDays(event.target.value)}
            />
          </SettingRow>

          <SettingRow
            label="Lead number prefix"
            hint={`New leads are numbered like ${sample}. Existing lead numbers stay as they are. A new prefix starts a new sequence.`}
            error={errors.leadCodePrefix}
          >
            <FormInput
              value={prefix}
              maxLength={6}
              disabled={!canConfigure}
              onChange={(event) => setPrefix(event.target.value.toUpperCase())}
            />
          </SettingRow>

          <SettingSwitchRow
            label="Block duplicate phone numbers"
            hint="When on, creating or changing a lead to a phone that already exists is stopped unless someone has permission to create a duplicate."
          >
            <FormSwitch checked={duplicateCheck} disabled={!canConfigure} onChange={setDuplicateCheck} />
          </SettingSwitchRow>

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
