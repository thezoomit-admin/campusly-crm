import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FormSwitch } from '@/components/common/Forms'
import { PrimaryButton } from '@/components/ui'
import { getApiError, isGloballyToastedApiError } from '@/lib/api'
import { useAppSelector } from '@/redux/features/hooks'
import { selectPermissions } from '@/redux/features/auth/authSlice'
import { adminCard } from '@/styles/admin'
import { useGetMyPreferencesQuery, useUpdateMyPreferencesMutation } from '../api/settingsApi'
import { SettingSwitchRow, SettingsSaveBar } from '../components/SettingRow'

export default function PreferencesSettingsPanel() {
  const permissions = useAppSelector(selectPermissions)
  const canOpenNotifications = permissions.includes('notification:view')
  const { data, isFetching, isError, error, refetch } = useGetMyPreferencesQuery()
  const [save, { isLoading }] = useUpdateMyPreferencesMutation()
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    if (!data) return
    setCompact(data.compactTables)
  }, [data])

  const dirty = Boolean(data) && compact !== data?.compactTables

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await save({ compactTables: compact }).unwrap()
      toast.success('Your preferences were saved.')
    } catch (error) {
      if (!isGloballyToastedApiError(error)) toast.error(getApiError(error, 'Unable to save preferences.'))
    }
  }

  if (isError) {
    return (
      <section className={`${adminCard} grid gap-3`}>
        <p className="m-0 text-sm text-text-muted">{getApiError(error, 'Preferences could not be loaded.')}</p>
        <div>
          <PrimaryButton variant="outline" label="Try again" onClick={() => void refetch()} />
        </div>
      </section>
    )
  }

  return (
    <section className={`${adminCard} grid max-w-3xl gap-5`}>
      <header className="grid gap-1 border-b border-border-subtle pb-4">
        <h2 className="m-0 text-lg font-semibold text-text-strong">My preferences</h2>
        <p className="m-0 text-sm text-text-muted">
          These choices affect only your account. They do not change the workspace for the rest of the team.
        </p>
      </header>

      {isFetching && !data ? <p className="m-0 text-sm text-text-muted">Loading your preferences…</p> : null}

      {data ? (
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <SettingSwitchRow
            label="Compact table density"
            hint="Tightens row padding on lists such as leads, payments, and employees."
          >
            <FormSwitch checked={compact} onChange={setCompact} />
          </SettingSwitchRow>

          {canOpenNotifications ? (
            <Link
              to="/notifications/settings"
              className="grid gap-0.5 rounded-xl border border-border-subtle px-3 py-3 no-underline hover:border-primary"
            >
              <span className="text-sm font-semibold text-text-strong">Notification preferences</span>
              <span className="text-[0.78rem] text-text-muted">
                Choose in-app, email, WhatsApp, and browser alerts for each event.
              </span>
            </Link>
          ) : null}

          <SettingsSaveBar dirty={dirty} updatedAt={data.updatedAt} canSave>
            <PrimaryButton type="submit" disabled={!dirty || isLoading} label={isLoading ? 'Saving…' : 'Save changes'} />
          </SettingsSaveBar>
        </form>
      ) : null}
    </section>
  )
}
