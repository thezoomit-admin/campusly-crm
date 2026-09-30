import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Select, Spin } from 'antd'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui'
import { getApiError } from '@/lib/api'
import LeadSectionCard from '@/modules/leads/components/details/LeadSectionCard'
import { useGetWhatsAppSettingsQuery, useListLeadWhatsAppQuery, useStartLeadWhatsAppMutation } from '../api/whatsappApi'
import ConversationView from './ConversationView'

type Props = {
  leadId: string
  hasWhatsAppNumber: boolean
}

export default function LeadWhatsAppPanel({ leadId, hasWhatsAppNumber }: Props) {
  const { data: settings } = useGetWhatsAppSettingsQuery()
  const { data, isLoading, isError } = useListLeadWhatsAppQuery(leadId, { pollingInterval: 15000 })
  const [start, { isLoading: starting }] = useStartLeadWhatsAppMutation()
  const conversations = data?.items || []
  const [picked, setPicked] = useState<string | undefined>()
  const selected = conversations.some((c) => c.id === picked) ? picked : conversations[0]?.id

  async function onStart() {
    try {
      const result = await start(leadId).unwrap()
      toast.success('WhatsApp conversation started.')
      setPicked(result.conversation.id)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to send WhatsApp message.'))
    }
  }

  return (
    <LeadSectionCard title="WhatsApp">
      {isLoading ? (
        <div className="grid min-h-40 place-items-center">
          <Spin />
        </div>
      ) : isError ? (
        <p className="m-0 text-danger">Conversation could not be loaded.</p>
      ) : conversations.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-[#dbe4ee] px-4 py-10 text-center dark:border-border">
          <p className="m-0 text-[0.95rem] font-semibold text-text-strong">No WhatsApp conversation yet</p>
          <p className="m-0 max-w-md text-[0.84rem] text-text-muted">
            Messages from this student's WhatsApp number appear here automatically. You can also start the
            conversation with an approved template message.
          </p>
          <Button size="sm" loading={starting} disabled={!hasWhatsAppNumber} onClick={() => void onStart()}>
            Start WhatsApp conversation
          </Button>
          {!hasWhatsAppNumber ? (
            <p className="m-0 text-[0.78rem] text-text-muted">Add a phone or WhatsApp number to this lead first.</p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {conversations.length > 1 ? (
              <Select
                size="small"
                className="min-w-[220px]"
                value={selected}
                onChange={setPicked}
                options={conversations.map((c) => ({ value: c.id, label: c.phone }))}
              />
            ) : (
              <span />
            )}
            {selected ? (
              <Link to={`/whatsapp?c=${selected}`} className="text-[0.82rem] font-medium text-primary">
                Open in WhatsApp Inbox →
              </Link>
            ) : null}
          </div>
          {selected ? (
            <div className="overflow-hidden rounded-xl border border-border-subtle">
              <ConversationView key={selected} conversationId={selected} settings={settings} embedded className="h-[600px]" />
            </div>
          ) : null}
        </div>
      )}
    </LeadSectionCard>
  )
}
