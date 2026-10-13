import { Empty, Input, Spin } from 'antd'
import { avatarTone, formatRelativeTime, hubInitials } from '../../utils/hubFormat'
import type { HubItem } from '../../utils/hubItems'
import ChannelIcon from './ChannelIcon'

export type ListTab = 'all' | 'unread' | 'assigned'

type Props = {
  items: HubItem[]
  selectedId: string | null
  loading?: boolean
  search: string
  listTab: ListTab
  counts: { all: number; unread: number; assigned: number }
  onSearchChange: (value: string) => void
  onListTabChange: (tab: ListTab) => void
  onSelect: (hubId: string) => void
}

export default function ConversationListPanel({
  items,
  selectedId,
  loading,
  search,
  listTab,
  counts,
  onSearchChange,
  onListTabChange,
  onSelect,
}: Props) {
  return (
    <aside className="flex min-h-0 w-full min-w-0 flex-col overflow-x-hidden border-r border-[#e8edf5] bg-white">
      <div className="grid gap-3 border-b border-[#e8edf5] p-3">
        <Input.Search
          allowClear
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search conversations"
          className="w-full min-w-0 [&_.ant-input-affix-wrapper]:!rounded-lg [&_.ant-input-affix-wrapper]:!bg-white [&_.ant-input-search-button]:!rounded-e-lg"
        />

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f1f5f9] p-1">
          {(
            [
              { key: 'all', label: 'All', count: counts.all },
              { key: 'unread', label: 'Unread', count: counts.unread },
              { key: 'assigned', label: 'Assigned', count: counts.assigned },
            ] as const
          ).map((tab) => {
            const active = listTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onListTabChange(tab.key)}
                className={`min-w-0 cursor-pointer truncate rounded-lg border-0 px-1.5 py-1.5 text-[0.72rem] font-semibold transition-colors ${
                  active
                    ? 'bg-white text-[#2563eb] shadow-sm'
                    : 'bg-transparent text-[#64748b] hover:text-text'
                }`}
              >
                {tab.label} {tab.count}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="grid min-h-60 place-items-center">
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <div className="grid min-h-60 place-items-center px-4">
            <Empty description="No conversations found" />
          </div>
        ) : (
          <ul className="m-0 grid list-none gap-0 p-2">
            {items.map((item) => {
              const active = item.hubId === selectedId
              const unread = item.unreadCount > 0
              return (
                <li key={item.hubId}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.hubId)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                      active
                        ? 'border-[#93c5fd] bg-[#eff6ff]'
                        : 'border-transparent hover:bg-[#f8fafc]'
                    }`}
                  >
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-full text-[0.78rem] font-bold ${avatarTone(item.channel)}`}
                    >
                      {hubInitials(item.name)}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="flex items-start justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span
                            className={`truncate text-[0.9rem] text-[#0f172a] ${
                              unread ? 'font-bold' : 'font-semibold'
                            }`}
                          >
                            {item.name}
                          </span>
                          <ChannelIcon channel={item.channel} size={13} />
                        </span>
                        <time className="shrink-0 text-[0.7rem] text-[#94a3b8]">
                          {formatRelativeTime(item.at)}
                        </time>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-[0.8rem] ${
                            unread ? 'text-[#334155]' : 'text-[#94a3b8]'
                          }`}
                        >
                          {item.preview}
                        </span>
                        {unread ? (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[#3b82f6] px-1.5 text-[0.68rem] font-bold text-white">
                            {item.unreadCount > 99 ? '99+' : item.unreadCount}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
