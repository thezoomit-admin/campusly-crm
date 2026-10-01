import type { LeadListSummary } from '../types'
import { LEAD_PIPELINE_TABS, tabCount, type LeadPipelineTab } from '../utils/leadList'

type LeadStatusTabsProps = {
  value: LeadPipelineTab
  summary?: LeadListSummary
  onChange: (value: LeadPipelineTab) => void
}

export default function LeadStatusTabs({ value, summary, onChange }: LeadStatusTabsProps) {
  return (
    <div className="leads-status-tabs flex w-full min-w-0 items-center gap-1 overflow-x-auto min-[961px]:w-auto min-[961px]:flex-1">
      {LEAD_PIPELINE_TABS.map((tab) => {
        const active = value === tab.key
        const count = tabCount(summary, tab.key)
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex h-[58px] shrink-0 cursor-pointer items-center border-0 border-b-2 bg-transparent px-3 text-[13px] whitespace-nowrap transition-colors ${
              active
                ? 'border-primary font-semibold text-primary'
                : 'border-transparent font-medium text-text-muted hover:text-text'
            }`}
          >
            {tab.label} ({count})
          </button>
        )
      })}
    </div>
  )
}
