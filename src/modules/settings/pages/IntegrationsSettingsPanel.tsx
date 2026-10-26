import { Link } from 'react-router-dom'
import { PrimaryButton } from '@/components/ui'
import { hasPermission } from '@/lib/access'
import { useAppSelector } from '@/redux/features/hooks'
import { selectAuthSession } from '@/redux/features/auth/authSlice'
import { getApiError } from '@/lib/api'
import { adminCard } from '@/styles/admin'
import { useGetWorkspaceSettingsQuery, type IntegrationState } from '../api/settingsApi'

const STATE_LABEL: Record<IntegrationState | 'mock', string> = {
  live: 'Connected',
  mock: 'Mock',
  off: 'Not configured',
}

function stateClass(state: string) {
  if (state === 'live') return 'bg-[#e8f7f0] text-[#0f7a4a]'
  if (state === 'mock') return 'bg-[#fff6e5] text-[#b54708]'
  return 'bg-[#f3f4f6] text-[#4b5563]'
}

function StatusCard({
  title,
  state,
  detail,
  meta,
  to,
  linkLabel,
}: {
  title: string
  state: string
  detail: string
  meta?: string
  to?: string
  linkLabel?: string
}) {
  return (
    <article className="grid gap-2 rounded-xl border border-border-subtle p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 text-[0.95rem] font-semibold text-text-strong">{title}</h3>
        <span className={`rounded-full px-2 py-1 text-[0.72rem] font-bold ${stateClass(state)}`}>
          {STATE_LABEL[state as IntegrationState] || state}
        </span>
      </div>
      <p className="m-0 text-sm text-text-muted">{detail}</p>
      {meta ? <p className="m-0 text-[0.78rem] text-text-strong">{meta}</p> : null}
      {to && linkLabel ? (
        <Link to={to} className="text-sm font-medium text-primary no-underline hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </article>
  )
}

export default function IntegrationsSettingsPanel() {
  const auth = useAppSelector(selectAuthSession)
  const { data, isFetching, isError, error, refetch } = useGetWorkspaceSettingsQuery()
  const integrations = data?.integrations
  const canOpenInbox = hasPermission(auth, 'communication:view')
  const canOpenMeta = hasPermission(auth, ['communication:view', 'campaign:view'])

  const shortcuts = [
    hasPermission(auth, 'notification:view')
      ? { to: '/notifications/settings', label: 'Notification events', detail: 'Channels and which events the CRM sends.' }
      : null,
    hasPermission(auth, 'country_assignment:view')
      ? { to: '/master-data/country-assignment', label: 'Country assignment', detail: 'Which team receives leads for each country.' }
      : null,
    hasPermission(auth, 'master_data:view')
      ? { to: '/master-data', label: 'Master data', detail: 'Statuses, sources, universities, and other lists.' }
      : null,
    hasPermission(auth, 'role:view')
      ? { to: '/roles', label: 'Roles and permissions', detail: 'Who can view or change each module.' }
      : null,
    hasPermission(auth, 'audit:view')
      ? { to: '/audit-logs', label: 'Audit log', detail: 'Workspace and lead setting changes are recorded here.' }
      : null,
  ].filter((item): item is { to: string; label: string; detail: string } => Boolean(item))

  if (isError) {
    return (
      <section className={`${adminCard} grid gap-3`}>
        <p className="m-0 text-sm text-text-muted">{getApiError(error, 'Integration status could not be loaded.')}</p>
        <div>
          <PrimaryButton variant="outline" label="Try again" onClick={() => void refetch()} />
        </div>
      </section>
    )
  }

  return (
    <div className="grid max-w-3xl gap-4">
      <section className={`${adminCard} grid gap-4`}>
        <header className="grid gap-1 border-b border-border-subtle pb-4">
          <h2 className="m-0 text-lg font-semibold text-text-strong">Integrations</h2>
          <p className="m-0 text-sm text-text-muted">
            Connection status only. Tokens, SMTP passwords, and API secrets stay in the server environment.
          </p>
        </header>
        {isFetching && !integrations ? <p className="m-0 text-sm text-text-muted">Checking connections…</p> : null}
        {integrations ? (
          <div className="grid gap-3">
            <StatusCard
              title="Email"
              state={integrations.email.state}
              detail={integrations.email.detail}
              meta={`Mailbox ${integrations.email.fromAddress}${integrations.email.imap ? ' · IMAP inbound on' : ' · IMAP inbound off'}`}
              to={canOpenInbox ? '/email' : undefined}
              linkLabel={canOpenInbox ? 'Open email inbox' : undefined}
            />
            <StatusCard
              title="WhatsApp"
              state={integrations.whatsapp.state}
              detail={integrations.whatsapp.detail}
              meta={`Default template ${integrations.whatsapp.defaultTemplate}`}
              to={canOpenInbox ? '/whatsapp' : undefined}
              linkLabel={canOpenInbox ? 'Open WhatsApp inbox' : undefined}
            />
            <StatusCard
              title="Meta Lead Ads"
              state={integrations.meta.state}
              detail={integrations.meta.detail}
              meta={`Webhook ${integrations.meta.webhookPath}`}
              to={canOpenMeta ? '/meta-leads' : undefined}
              linkLabel={canOpenMeta ? 'Open Meta leads' : undefined}
            />
          </div>
        ) : null}
      </section>

      {shortcuts.length ? (
        <section className={`${adminCard} grid gap-3`}>
          <h2 className="m-0 text-lg font-semibold text-text-strong">Configured elsewhere</h2>
          <div className="grid gap-2">
            {shortcuts.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="grid gap-0.5 rounded-xl border border-border-subtle px-3 py-3 no-underline hover:border-primary"
              >
                <span className="text-sm font-semibold text-text-strong">{item.label}</span>
                <span className="text-[0.78rem] text-text-muted">{item.detail}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
