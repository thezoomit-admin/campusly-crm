import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Spin } from 'antd'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui'
import { getApiError } from '@/lib/api'
import LeadSectionCard from '@/modules/leads/components/details/LeadSectionCard'
import { useGetEmailSettingsQuery, useListLeadEmailQuery, useStartLeadEmailMutation } from '../api/emailApi'
import ThreadView from './ThreadView'

type Props = {
  leadId: string
  hasEmail: boolean
}

export default function LeadEmailPanel({ leadId, hasEmail }: Props) {
  const { data: settings } = useGetEmailSettingsQuery()
  const { data, isLoading, isError } = useListLeadEmailQuery(leadId, { pollingInterval: 15000 })
  const [start, { isLoading: starting }] = useStartLeadEmailMutation()
  const threads = data?.items || []
  const [picked, setPicked] = useState<string | undefined>()
  const selected = threads.some((item) => item.id === picked) ? picked : threads[0]?.id

  async function onStart() {
    try {
      const result = await start(leadId).unwrap()
      toast.success('Email conversation ready.')
      setPicked(result.thread.id)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to send email. Please try again.'))
    }
  }

  return (
    <LeadSectionCard title="Email">
      {isLoading ? (
        <div className="grid min-h-40 place-items-center">
          <Spin />
        </div>
      ) : isError ? (
        <p className="m-0 text-danger">Email conversation not found.</p>
      ) : threads.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-[#dbe4ee] px-4 py-10 text-center dark:border-border">
          <p className="m-0 text-[0.95rem] font-semibold text-text-strong">No email conversation yet</p>
          <p className="m-0 max-w-md text-[0.84rem] text-text-muted">
            Emails from this student's address appear here automatically. You can also write the first message from the
            CRM.
          </p>
          <Button size="sm" loading={starting} disabled={!hasEmail} onClick={() => void onStart()}>
            Send email
          </Button>
          {!hasEmail ? (
            <p className="m-0 text-[0.78rem] text-text-muted">Add an email address to this lead first.</p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="flex justify-end">
            {selected ? (
              <Link to={`/email?c=${selected}`} className="text-[0.82rem] font-medium text-primary">
                Open in Email Inbox
              </Link>
            ) : null}
          </div>
          {selected ? (
            <div className="overflow-hidden rounded-xl border border-border-subtle">
              <ThreadView key={selected} threadId={selected} settings={settings} embedded className="h-[680px]" />
            </div>
          ) : null}
        </div>
      )}
    </LeadSectionCard>
  )
}
