import { Link } from 'react-router-dom'
import { Spin } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Calendar03Icon,
  CalendarAdd01Icon,
  DocumentAttachmentIcon,
  LinkSquare02Icon,
  Location01Icon,
  Mail01Icon,
  MailSend01Icon,
  NoteEditIcon,
  SmartPhone01Icon,
  SourceCodeIcon,
  Tag01Icon,
} from '@hugeicons/core-free-icons'
import dayjs from 'dayjs'
import UserAvatar from '@/components/ui/Avatar/UserAvatar'
import type { LeadRecord } from '@/modules/leads/types'
import { avatarTone, hubInitials } from '../../utils/hubFormat'
import type { HubItem } from '../../utils/hubItems'

type Props = {
  selected: HubItem | null
  lead?: LeadRecord
  leadLoading?: boolean
}

export default function LeadDetailPanel({ selected, lead, leadLoading }: Props) {
  if (!selected) {
    return <aside className="hidden min-h-0 border-l border-[#e8edf5] bg-white xl:block" />
  }

  const name = lead?.name || selected.name
  const phone = lead?.phone || selected.phone
  const email = lead?.email || selected.email
  const location =
    lead?.currentLocation || selected.location || lead?.country || selected.lead?.country
  const source =
    lead?.source ||
    lead?.latestSource ||
    selected.event?.campaign?.name ||
    selected.event?.sourceCode ||
    (selected.source === 'whatsapp' ? 'WhatsApp' : selected.source === 'email' ? 'Email' : null)
  const createdAt =
    lead?.createdAt ||
    selected.event?.createdAt ||
    selected.whatsapp?.createdAt ||
    selected.emailThread?.createdAt
  const ownerName = lead?.owner?.name || selected.assignedUserName || selected.lead?.ownerName
  const tags = [
    lead?.preferredCourse,
    lead?.preferredDegreeCode,
    lead?.status || selected.lead?.status,
    lead?.priority,
  ].filter(Boolean) as string[]
  const leadPath = selected.leadId ? `/leads/${selected.leadId}` : undefined

  return (
    <aside className="hidden min-h-0 min-w-0 flex-col overflow-y-auto border-l border-[#e8edf5] bg-white xl:flex">
      <div className="grid justify-items-center gap-2 border-b border-[#e8edf5] px-4 py-5 text-center">
        <div className="relative">
          <span
            className={`grid size-16 place-items-center rounded-full text-[1.05rem] font-bold ${avatarTone(selected.channel)}`}
          >
            {hubInitials(name)}
          </span>
          <span className="absolute right-1 bottom-1 size-3 rounded-full border-2 border-white bg-[#22c55e]" />
        </div>
        <div>
          <h3 className="m-0 text-[1rem] font-semibold text-[#0f172a]">{name}</h3>
          <p className="m-0 mt-0.5 text-[0.78rem] text-[#22c55e]">Online</p>
        </div>
        {leadPath ? (
          <Link
            to={leadPath}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbeafe] bg-[#eff6ff] px-3 py-1.5 text-[0.78rem] font-semibold text-[#2563eb] no-underline hover:bg-[#dbeafe]"
          >
            View Full Profile
            <HugeiconsIcon icon={LinkSquare02Icon} size={14} color="currentColor" strokeWidth={1.7} />
          </Link>
        ) : (
          <span className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-[0.78rem] text-[#64748b]">
            Not linked to a lead
          </span>
        )}
      </div>

      {leadLoading ? (
        <div className="grid place-items-center py-10">
          <Spin />
        </div>
      ) : (
        <>
          <div className="grid gap-3 border-b border-[#e8edf5] px-4 py-4">
            <InfoRow icon={SmartPhone01Icon} value={phone || '—'} />
            <InfoRow icon={Mail01Icon} value={email || '—'} />
            <InfoRow icon={Location01Icon} value={location || '—'} />
            <InfoRow icon={SourceCodeIcon} value={source || '—'} label="Lead Source" />
            <InfoRow
              icon={Calendar03Icon}
              value={createdAt ? dayjs(createdAt).format('D MMM YYYY') : '—'}
              label="Created At"
            />
          </div>

          <div className="grid gap-2 border-b border-[#e8edf5] px-4 py-4">
            <p className="m-0 text-[0.72rem] font-semibold tracking-wide text-[#94a3b8] uppercase">
              Assigned Counselor
            </p>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <UserAvatar
                  name={ownerName || 'Unassigned'}
                  photoUrl={lead?.owner?.photoUrl}
                  className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#dbeafe] text-[0.7rem] font-bold text-[#1d4ed8] [&_img]:size-full [&_img]:object-cover"
                />
                <div className="min-w-0">
                  <p className="m-0 truncate text-[0.84rem] font-semibold text-[#0f172a]">
                    {ownerName || 'Unassigned'}
                  </p>
                  <p className="m-0 text-[0.72rem] text-[#94a3b8]">Counselor</p>
                </div>
              </div>
              {leadPath ? (
                <Link
                  to={leadPath}
                  className="shrink-0 text-[0.75rem] font-semibold text-[#2563eb] no-underline hover:underline"
                >
                  Reassign
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2 border-b border-[#e8edf5] px-4 py-4">
            <p className="m-0 text-[0.72rem] font-semibold tracking-wide text-[#94a3b8] uppercase">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.length === 0 ? (
                <span className="text-[0.78rem] text-[#94a3b8]">No tags yet</span>
              ) : (
                tags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${
                      index % 2 === 0
                        ? 'bg-[#eff6ff] text-[#2563eb]'
                        : 'bg-[#ecfdf5] text-[#047857]'
                    }`}
                  >
                    <HugeiconsIcon icon={Tag01Icon} size={12} color="currentColor" strokeWidth={1.7} />
                    {tag}
                  </span>
                ))
              )}
              <button
                type="button"
                className="inline-flex cursor-pointer items-center rounded-full border border-dashed border-[#cbd5e1] bg-transparent px-2.5 py-1 text-[0.72rem] font-semibold text-[#64748b]"
              >
                + Add Tag
              </button>
            </div>
          </div>

          <div className="grid gap-2 px-4 py-4">
            <p className="m-0 text-[0.72rem] font-semibold tracking-wide text-[#94a3b8] uppercase">
              Quick Actions
            </p>
            <div className="grid gap-1.5">
              <ActionRow icon={DocumentAttachmentIcon} label="Create Application" to={leadPath} />
              <ActionRow icon={MailSend01Icon} label="Send Email" to={leadPath} />
              <ActionRow icon={NoteEditIcon} label="Add Note" to={leadPath} />
              <ActionRow icon={CalendarAdd01Icon} label="Schedule Follow-up" to={leadPath} />
            </div>
          </div>
        </>
      )}
    </aside>
  )
}

function InfoRow({
  icon,
  value,
  label,
}: {
  icon: typeof Mail01Icon
  value: string
  label?: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#64748b]">
        <HugeiconsIcon icon={icon} size={14} color="currentColor" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        {label ? <p className="m-0 text-[0.7rem] text-[#94a3b8]">{label}</p> : null}
        <p className="m-0 break-words text-[0.84rem] text-[#0f172a]">{value}</p>
      </div>
    </div>
  )
}

function ActionRow({
  icon,
  label,
  to,
}: {
  icon: typeof Mail01Icon
  label: string
  to?: string
}) {
  const className =
    'flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#e8edf5] bg-[#fbfcfe] px-3 py-2.5 text-left text-[0.84rem] font-medium text-[#0f172a] no-underline transition-colors hover:border-[#bfdbfe] hover:bg-[#eff6ff]'
  const content = (
    <>
      <span className="inline-flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-white text-[#2563eb] shadow-sm">
          <HugeiconsIcon icon={icon} size={15} color="currentColor" strokeWidth={1.7} />
        </span>
        {label}
      </span>
      <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#94a3b8" strokeWidth={1.7} />
    </>
  )
  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" className={className}>
      {content}
    </button>
  )
}
