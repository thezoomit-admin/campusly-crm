import { FormCheckbox } from "@/components/common/Forms";
import { PrimaryButton } from "@/components/ui";
import NavIcon from "@/components/ui/Icon/NavIcon";
import type { NavIconName } from "@/config/navigation";
import { modalBackdrop, modalClose } from "@/styles/admin";
import type { PermissionRecord } from "@/types";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type RolePermissionsModalProps = {
  roleName: string;
  permissions: PermissionRecord[];
  checked: string[];
  saving: boolean;
  canSave: boolean;
  onCheckedChange: (ids: string[]) => void;
  onClose: () => void;
  onSave: () => void;
};

const LEAD_PAGE_LABELS: Record<string, string> = {
  "lead:view": "All Leads",
  "lead:create": "Create Lead",
  "lead:assign": "Lead Pool",
  "lead:view_closed": "Close Lost Lead",
  "role:edit": "Edit role",
  "role:delete": "Delete role",
};

const LEAD_PAGE_ORDER = [
  "lead:view",
  "lead:create",
  "lead:assign",
  "lead:view_closed",
];

const ROLE_ACTION_ORDER = ["role:view", "role:edit", "role:delete", "role:create"];

const MODULE_META: Record<string, { description: string; icon: NavIconName }> = {
  "Lead Management": {
    description: "View, create, assign, and manage student leads.",
    icon: "users",
  },
  "Follow-up": {
    description: "Schedule follow-ups and keep outreach on track.",
    icon: "bell",
  },
  Activities: {
    description: "Manage activities, notes and follow-ups.",
    icon: "activity",
  },
  "Service & Package": {
    description: "Configure services, packages, offers, and pricing.",
    icon: "card",
  },
  Payment: {
    description: "Record, edit, and approve payments.",
    icon: "card",
  },
  Receipt: {
    description: "Generate, download, and manage receipts.",
    icon: "file",
  },
  Documents: {
    description: "Manage documents and file uploads.",
    icon: "folder",
  },
  Reports: {
    description: "View and export reports.",
    icon: "chart",
  },
  "Employee Management": {
    description: "View and manage employee records.",
    icon: "id",
  },
  "Employee Documents": {
    description: "Access employee related documents.",
    icon: "user",
  },
  "Employee Performance": {
    description: "Review employee performance.",
    icon: "chart",
  },
  Notifications: {
    description: "View and configure notifications.",
    icon: "bell",
  },
  Integrations: {
    description: "View and configure external integrations.",
    icon: "globe",
  },
  "Communication Hub": {
    description: "Handle email, WhatsApp and other communications.",
    icon: "message",
  },
  Campaigns: {
    description: "Manage marketing campaigns and view campaign data.",
    icon: "chart",
  },
  "User Management": {
    description: "Create and manage system users.",
    icon: "users",
  },
  "Role & Permission": {
    description: "Manage roles and who can configure access.",
    icon: "shield",
  },
  "Master Data": {
    description: "Maintain shared lists and master records.",
    icon: "database",
  },
  Settings: {
    description: "View and update system settings.",
    icon: "settings",
  },
  "Lead Assignment": {
    description: "Manage preferred-country assignment rules.",
    icon: "assignments",
  },
  "Audit Log": {
    description: "View system audit logs and history.",
    icon: "shield",
  },
};

function formatAction(action: string) {
  return action
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function permissionChoiceLabel(permission: PermissionRecord) {
  return LEAD_PAGE_LABELS[permission.key] || formatAction(permission.action);
}

function comparePermissionOrder(aKey: string, bKey: string, order: string[]) {
  const aIndex = order.indexOf(aKey);
  const bIndex = order.indexOf(bKey);
  if (aIndex === -1 && bIndex === -1) return 0;
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
}

function moduleMeta(name: string) {
  return (
    MODULE_META[name] || {
      description: `Control access for ${name}.`,
      icon: "grid" as NavIconName,
    }
  );
}

function labelsFor(items: PermissionRecord[]) {
  const base = items.map((item) => permissionChoiceLabel(item));
  const counts = new Map<string, number>();
  for (const label of base) counts.set(label, (counts.get(label) || 0) + 1);
  return items.map((item, index) => {
    const label = base[index];
    if ((counts.get(label) || 0) < 2) return label;
    return item.description || `${label} (${formatAction(item.resource)})`;
  });
}

function countLabel(count: number) {
  return `${count} permission${count === 1 ? "" : "s"}`;
}

function CountPill({
  value,
  active = false,
}: {
  value: number;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-4 ${
        active
          ? "bg-[color-mix(in_srgb,var(--color-primary)_18%,var(--color-surface))] text-primary-active"
          : "bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-page-bg))] text-text-muted"
      }`}
    >
      {value}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 text-text-faint transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="mt-0.5 shrink-0 text-primary"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export default function RolePermissionsModal({
  roleName,
  permissions,
  checked,
  saving,
  canSave,
  onCheckedChange,
  onClose,
  onSave,
}: RolePermissionsModalProps) {
  const [query, setQuery] = useState("");
  const [activeModule, setActiveModule] = useState("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const map = new Map<string, PermissionRecord[]>();
    for (const permission of permissions) {
      const meta = moduleMeta(permission.module);
      if (
        needle &&
        !`${permission.module} ${meta.description} ${permission.key} ${permission.resource} ${permission.description || ""} ${permissionChoiceLabel(permission)}`
          .toLowerCase()
          .includes(needle)
      ) {
        continue;
      }
      const list = map.get(permission.module) || [];
      list.push(permission);
      map.set(permission.module, list);
    }
    for (const [moduleName, items] of map) {
      if (moduleName === "Lead Management") {
        items.sort((a, b) =>
          comparePermissionOrder(a.key, b.key, LEAD_PAGE_ORDER),
        );
      }
      if (moduleName === "Role & Permission") {
        items.sort((a, b) =>
          comparePermissionOrder(a.key, b.key, ROLE_ACTION_ORDER),
        );
      }
    }
    return [...map.entries()];
  }, [permissions, query]);

  useEffect(() => {
    if (
      activeModule !== "all" &&
      !groups.some(([moduleName]) => moduleName === activeModule)
    ) {
      setActiveModule("all");
    }
  }, [activeModule, groups]);

  const visibleGroups =
    activeModule === "all"
      ? groups
      : groups.filter(([moduleName]) => moduleName === activeModule);

  const visibleCount = visibleGroups.reduce(
    (total, [, items]) => total + items.length,
    0,
  );
  const allIds = permissions.map((item) => item.id);
  const checkedSet = useMemo(() => new Set(checked), [checked]);
  const selectedCount = allIds.filter((id) => checkedSet.has(id)).length;
  const allChecked = allIds.length > 0 && selectedCount === allIds.length;
  const someChecked = selectedCount > 0 && !allChecked;

  const summary = useMemo(() => {
    const map = new Map<string, { count: number; icon: NavIconName }>();
    for (const permission of permissions) {
      const current = map.get(permission.module) || {
        count: 0,
        icon: moduleMeta(permission.module).icon,
      };
      if (checkedSet.has(permission.id)) current.count += 1;
      map.set(permission.module, current);
    }
    return [...map.entries()]
      .map(([moduleName, value]) => ({ moduleName, ...value }))
      .filter((item) => item.count > 0);
  }, [permissions, checkedSet]);

  const activeMeta =
    activeModule === "all" ? null : moduleMeta(activeModule);
  const heading =
    activeModule === "all" ? "All Permissions" : activeModule;
  const subtitle =
    activeMeta?.description ||
    "Select the permissions you want to grant for this role.";

  function togglePermission(id: string, next: boolean) {
    onCheckedChange(
      next ? [...checked, id] : checked.filter((item) => item !== id),
    );
  }

  function toggleModule(items: PermissionRecord[], next: boolean) {
    const ids = new Set(items.map((item) => item.id));
    if (next) {
      onCheckedChange([...new Set([...checked, ...items.map((item) => item.id)])]);
      return;
    }
    onCheckedChange(checked.filter((id) => !ids.has(id)));
  }

  return createPortal(
    <div className={`${modalBackdrop} p-4 sm:p-6`} onClick={onClose}>
      <div
        className="flex h-[min(860px,calc(100vh-32px))] w-[min(1180px,calc(100vw-32px))] flex-col overflow-hidden rounded-[20px] bg-surface text-text shadow-[0_24px_80px_rgb(16_24_40/0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-surface))] text-primary">
              <NavIcon name="shield" size={20} />
            </span>
            <div className="min-w-0">
              <h3
                id="permission-modal-title"
                className="m-0 text-lg font-semibold tracking-tight text-text-strong"
              >
                Permissions
              </h3>
              <p className="mt-0.5 mb-0 text-sm text-text-muted">
                Control what {roleName} can access and do in the system.
              </p>
            </div>
          </div>
          <PrimaryButton
            type="button"
            variant="text"
            className={`${modalClose}`}
            aria-label="Close"
            onClick={onClose}
            disabled={saving}
            icon={
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
              />
            }
          />
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto px-5 py-4 lg:grid-cols-[252px_minmax(0,1fr)_240px] lg:overflow-hidden lg:px-6">
          <aside className="flex flex-col gap-3 lg:min-h-0">
            <label className="relative block">
              <SearchIcon />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search permissions..."
                aria-label="Search permissions"
                className="h-10 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm text-text outline-none placeholder:text-text-faint focus:border-primary"
              />
            </label>
            <div className="flex flex-col gap-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-3">
              <button
                type="button"
                onClick={() => setActiveModule("all")}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-0 px-2.5 py-2 text-left ${
                  activeModule === "all"
                    ? "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-primary-active"
                    : "bg-transparent text-text hover:bg-hover-bg"
                }`}
              >
                <span
                  className={
                    activeModule === "all" ? "text-primary" : "text-icon"
                  }
                >
                  <NavIcon name="grid" size={16} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  All permissions
                </span>
                <CountPill
                  value={groups.reduce((total, [, items]) => total + items.length, 0)}
                  active={activeModule === "all"}
                />
              </button>
              {groups.map(([moduleName, items]) => {
                const active = activeModule === moduleName;
                const meta = moduleMeta(moduleName);
                return (
                  <button
                    key={moduleName}
                    type="button"
                    title={moduleName}
                    onClick={() => setActiveModule(moduleName)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-0 px-2.5 py-2 text-left ${
                      active
                        ? "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-primary-active"
                        : "bg-transparent text-text hover:bg-hover-bg"
                    }`}
                  >
                    <span className={active ? "text-primary" : "text-icon"}>
                      <NavIcon name={meta.icon} size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                      {moduleName}
                    </span>
                    <CountPill value={items.length} active={active} />
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-w-0 flex-col lg:min-h-0">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="m-0 text-[15px] font-semibold text-text-strong">
                  {heading}
                </h4>
                <p className="mt-0.5 mb-0 text-sm text-text-muted">{subtitle}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] px-2.5 py-1 text-xs font-semibold text-primary-active">
                {countLabel(visibleCount)}
              </span>
            </div>

            <div className="mb-3 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_28%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))] px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <FormCheckbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  disabled={saving || allIds.length === 0}
                  onChange={(event) => {
                    onCheckedChange(event.target.checked ? allIds : []);
                  }}
                >
                  <span className="text-sm font-medium text-text-strong">
                    All permissions
                  </span>
                </FormCheckbox>
                <span className="shrink-0 text-xs text-text-muted">
                  {selectedCount} of {allIds.length} selected
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
              {visibleGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-text-muted">
                  No permissions match your search.
                </div>
              ) : (
                visibleGroups.map(([moduleName, items]) => {
                  const meta = moduleMeta(moduleName);
                  const open = !collapsed[moduleName];
                  const moduleSelected = items.filter((item) =>
                    checkedSet.has(item.id),
                  ).length;
                  const moduleAll =
                    items.length > 0 && moduleSelected === items.length;
                  const moduleSome = moduleSelected > 0 && !moduleAll;
                  const labels = labelsFor(items);
                  return (
                    <article
                      key={moduleName}
                      className="rounded-xl border border-border bg-surface"
                    >
                      <div className="flex items-center gap-3 px-3.5 py-3">
                        <FormCheckbox
                          checked={moduleAll}
                          indeterminate={moduleSome}
                          disabled={saving}
                          aria-label={`All ${moduleName} permissions`}
                          onChange={(event) => {
                            toggleModule(items, event.target.checked);
                          }}
                        />
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left"
                          aria-expanded={open}
                          onClick={() =>
                            setCollapsed((current) => ({
                              ...current,
                              [moduleName]: !current[moduleName],
                            }))
                          }
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-surface))] text-primary">
                            <NavIcon name={meta.icon} size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-text-strong">
                              {moduleName}
                            </span>
                            <span className="mt-0.5 block text-xs leading-4 text-text-muted">
                              {meta.description}
                            </span>
                          </span>
                          <span className="hidden shrink-0 text-xs text-text-faint sm:inline">
                            {countLabel(items.length)}
                          </span>
                          <ChevronIcon open={open} />
                        </button>
                      </div>
                      {open ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-2.5 border-t border-border-subtle px-4 py-3">
                          {items.map((item, index) => (
                            <FormCheckbox
                              key={item.id}
                              checked={checkedSet.has(item.id)}
                              disabled={saving}
                              className="min-w-30"
                              onChange={(event) => {
                                togglePermission(item.id, event.target.checked);
                              }}
                            >
                              <span className="text-sm font-medium text-text-strong">
                                {labels[index]}
                              </span>
                            </FormCheckbox>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <aside className="flex flex-col lg:min-h-0">
            <h4 className="m-0 mb-3 text-[15px] font-semibold text-text-strong">
              Permission Summary
            </h4>
            <div className="flex flex-col gap-2.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-3">
              {summary.length === 0 ? (
                <p className="m-0 text-sm text-text-muted">
                  No permissions selected yet.
                </p>
              ) : (
                summary.map((item) => (
                  <div
                    key={item.moduleName}
                    className="flex items-center gap-2.5 text-sm text-text"
                  >
                    <span className="text-icon">
                      <NavIcon name={item.icon} size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {item.moduleName}
                    </span>
                    <span className="shrink-0 font-medium text-text-muted">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
              <span className="text-sm font-semibold text-text-strong">
                Total Permissions
              </span>
              <CountPill value={selectedCount} active />
            </div>
            <div className="mt-3 flex gap-2 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] px-3 py-3 text-xs leading-5 text-text-muted">
              <InfoIcon />
              <p className="m-0">
                These permissions will be assigned to {roleName}. You can
                modify them anytime.
              </p>
            </div>
          </aside>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-6">
          <PrimaryButton
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={saving}
            label="Cancel"
          />
          {canSave ? (
            <PrimaryButton
              size="md"
              onClick={onSave}
              loading={saving}
              label="Save Permissions"
            />
          ) : null}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
