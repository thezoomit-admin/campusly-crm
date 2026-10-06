import { useState } from "react";
import { Link } from "react-router-dom";
import { Select, Spin } from "antd";
import { toast } from "react-toastify";
import { PrimaryButton } from "@/components/ui";
import { getApiError } from "@/lib/api";
import LeadSectionCard from "@/modules/leads/components/details/LeadSectionCard";
import {
  useGetWhatsAppSettingsQuery,
  useListLeadWhatsAppQuery,
  useStartLeadWhatsAppMutation,
} from "../api/whatsappApi";
import ConversationView from "./ConversationView";

type Props = {
  leadId: string;
  hasWhatsAppNumber: boolean;
};

export default function LeadWhatsAppPanel({
  leadId,
  hasWhatsAppNumber,
}: Props) {
  const { data: settings } = useGetWhatsAppSettingsQuery();
  const { data, isLoading, isError } = useListLeadWhatsAppQuery(leadId, {
    pollingInterval: 15000,
  });
  const [start, { isLoading: starting }] = useStartLeadWhatsAppMutation();
  const conversations = data?.items || [];
  const [picked, setPicked] = useState<string | undefined>();
  const selected = conversations.some((c) => c.id === picked)
    ? picked
    : conversations[0]?.id;
  const templateName = settings?.defaultTemplate || "hello_world";

  async function onStart() {
    try {
      const result = await start(leadId).unwrap();
      toast.success(
        `WhatsApp conversation started with template “${templateName}”.`,
      );
      setPicked(result.conversation.id);
    } catch (error) {
      toast.error(getApiError(error, "Unable to send WhatsApp message."));
    }
  }

  return (
    <LeadSectionCard title="WhatsApp">
      {settings?.mockMode ? (
        <p className="m-0 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[0.8rem] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
          WhatsApp Business API is not configured. Messages are saved in the CRM
          but not delivered to WhatsApp. Set{" "}
          <code className="text-[0.75rem]">WHATSAPP_ACCESS_TOKEN</code> and{" "}
          <code className="text-[0.75rem]">WHATSAPP_PHONE_NUMBER_ID</code> on
          the API server to go live.
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid min-h-40 place-items-center">
          <Spin />
        </div>
      ) : isError ? (
        <p className="m-0 text-danger">Conversation could not be loaded.</p>
      ) : conversations.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-[#dbe4ee] px-4 py-10 text-center dark:border-border">
          <p className="m-0 text-[0.95rem] font-semibold text-text-strong">
            No WhatsApp conversation yet
          </p>
          <p className="m-0 max-w-md text-[0.84rem] text-text-muted">
            Messages from this student&apos;s WhatsApp number appear here
            automatically. You can also start the conversation with the approved
            template “{templateName}”.
          </p>
          <PrimaryButton
            size="sm"
            loading={starting}
            disabled={!hasWhatsAppNumber}
            onClick={() => void onStart()}
          >
            Start WhatsApp conversation
          </PrimaryButton>
          {!hasWhatsAppNumber ? (
            <p className="m-0 text-[0.78rem] text-text-muted">
              Add a phone or WhatsApp number to this lead first.
            </p>
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
                options={conversations.map((c) => ({
                  value: c.id,
                  label: c.phone,
                }))}
              />
            ) : (
              <span />
            )}
            {selected ? (
              <Link
                to={`/whatsapp?c=${selected}`}
                className="text-[0.82rem] font-medium text-primary"
              >
                Open in WhatsApp Inbox →
              </Link>
            ) : null}
          </div>
          {selected ? (
            <div className="overflow-hidden rounded-xl border border-border-subtle">
              <ConversationView
                key={selected}
                conversationId={selected}
                settings={settings}
                embedded
                className="h-[600px]"
              />
            </div>
          ) : null}
        </div>
      )}
    </LeadSectionCard>
  );
}
