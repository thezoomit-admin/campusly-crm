import {
  FOLLOW_UP_TABS,
  tabCount,
  type FollowUpSummary,
  type FollowUpTab,
} from '../utils/followUpList'

type FollowUpStatusTabsProps = {
  value: FollowUpTab
  summary: FollowUpSummary
  onChange: (value: FollowUpTab) => void
}

export default function FollowUpStatusTabs({
  value,
  summary,
  onChange,
}: FollowUpStatusTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FOLLOW_UP_TABS.map((tab) => {
        const active = value === tab.key
        const count = tabCount(summary, tab.key)
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`inline-flex h-9 cursor-pointer items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
              active
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text'
            }`}
          >
            {tab.label} ({count})
          </button>
        )
      })}
    </div>
  )
}
