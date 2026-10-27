import { useState } from "react";
import { Dropdown } from "antd";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import type { LeadDetailsTabConfig, LeadWorkspaceTabKey } from "../../utils/leadDetails";

const tabButtonClass = (active: boolean) =>
  `inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 px-3 py-2 text-[0.84rem] transition-colors sm:px-4 sm:text-[0.9rem] ${
    active
      ? "bg-section-tab-active-bg font-semibold text-section-tab-active-fg"
      : "bg-section-tab-bg text-section-tab-fg hover:bg-section-tab-hover-bg"
  }`;

function tabLabel(tab: LeadDetailsTabConfig) {
  if (!tab.badgeCount) return tab.label;
  return `${tab.label} (${tab.badgeCount})`;
}

export default function LeadDetailsTabBar({
  primaryTabs,
  moreTabs,
  activeKey,
  onSelect,
}: {
  primaryTabs: LeadDetailsTabConfig[];
  moreTabs: LeadDetailsTabConfig[];
  activeKey: LeadWorkspaceTabKey;
  onSelect: (key: LeadWorkspaceTabKey) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const activeMore = moreTabs.find((tab) => tab.key === activeKey) ?? null;

  return (
    <div className="-mx-1 flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-none">
      {primaryTabs.map((item) => {
        const active = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            aria-current={active ? "page" : undefined}
            className={tabButtonClass(active)}
            onClick={() => onSelect(item.key)}
          >
            {tabLabel(item)}
          </button>
        );
      })}
      {moreTabs.length > 0 ? (
        <Dropdown
          open={moreOpen}
          onOpenChange={setMoreOpen}
          trigger={["click"]}
          placement="bottomLeft"
          popupRender={() => (
            <div
              role="menu"
              className="min-w-55 overflow-hidden rounded-xl border border-[#e7eef5] bg-surface py-1 shadow-[0_12px_32px_rgba(22,50,79,0.12)] dark:border-border"
            >
              {moreTabs.map((item) => {
                const active = activeKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 w-full cursor-pointer items-center border-0 px-3 text-left text-[0.86rem] transition-colors ${
                      active
                        ? "bg-section-tab-active-bg font-semibold text-section-tab-active-fg"
                        : "bg-transparent text-section-tab-fg hover:bg-section-tab-hover-bg"
                    }`}
                    onClick={() => {
                      onSelect(item.key);
                      setMoreOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-current={activeMore ? "page" : undefined}
            className={tabButtonClass(Boolean(activeMore))}
          >
            {activeMore ? activeMore.label : "More"}
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.8}
            />
          </button>
        </Dropdown>
      ) : null}
    </div>
  );
}
