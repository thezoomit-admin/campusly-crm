import { adminCard, adminForm, adminPage, formActions } from '../../../styles/admin'
import { useState } from 'react'
import { Switch } from 'antd'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui'
import { FormInput } from '@/components/common/Forms'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState('EduConsult CRM')
  const [supportEmail, setSupportEmail] = useState('support@campusly.com')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)
  const [denseTables, setDenseTables] = useState(false)

  function handleSave() {
    toast.success('Settings saved for this session (preview).')
  }

  return (
    <div className={adminPage}>
      <PageMeta
        title="Settings"
        description="Configure CRM preferences, notifications, and workspace defaults for your team."
      />
      <PageHeader
        title="Settings"
        subtitle="Configure CRM preferences, notifications, and workspace defaults for your team."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Settings' }]}
      />

      <div className={`${adminCard} grid max-w-2xl gap-5`}>
        <p className="m-0 text-[0.85rem] text-text-muted">
          Preview settings UI. Persistence will connect when the settings API is ready.
        </p>

        <form
          className={adminForm}
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
        >
          <label>
            Workspace name
            <FormInput value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
          </label>

          <label>
            Support email
            <FormInput
              type="email"
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
            />
          </label>

          <label className="flex items-center justify-between gap-3 font-medium">
            Email alerts
            <Switch checked={emailAlerts} onChange={setEmailAlerts} />
          </label>

          <label className="flex items-center justify-between gap-3 font-medium">
            SMS alerts
            <Switch checked={smsAlerts} onChange={setSmsAlerts} />
          </label>

          <label className="flex items-center justify-between gap-3 font-medium">
            Compact table density
            <Switch checked={denseTables} onChange={setDenseTables} />
          </label>

          <div className={formActions}>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
