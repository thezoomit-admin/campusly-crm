import {
  adminCard,
  adminFilters,
  adminForm,
  adminFormField,
  adminFormFields,
  adminFormSpan,
  adminPage,
  adminTable,
  formActions,
  matrix,
  matrixActions,
  matrixGroup,
  matrixModal,
  modalBackdrop,
  modalBody,
  modalClose,
  modalFooter,
  modalHeader,
  modalPanel,
  modalPanelFlex,
  modalPanelWide,
  muted,
  rowActions,
  tableWrap,
} from "../../../styles/admin";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useOutletContext, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useLazyListPermissionsQuery,
  useLazyListRolesQuery,
  useSetRolePermissionsMutation,
  useUpdateRoleMutation,
  useUpdateRoleStatusMutation,
} from "@/redux/features/roles/rolesApi";
import { getApiError, isGloballyToastedApiError } from "@/lib/api";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Cancel01Icon,
  Delete02Icon,
  Key01Icon,
  PencilEdit02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { Spin } from "antd";
import { PrimaryButton } from "@/components/ui";
import {
  FormCheckbox,
  FormInput,
  FormInputNumber,
  FormSelect,
  FormSwitch,
  FormTextArea,
} from "@/components/common/Forms";
import { DeleteModal } from "@/components/common/Modals";
import { PageHeader } from "@/components/common/Navigation";
import { PageMeta } from "@/components/common/Meta";
import {
  RowActionMenu,
  type RowActionItem,
} from "@/components/common/Dropdowns";
import { hasPermission } from "../../../lib/access";
import { readUrlSearchQuery } from "@/lib/url";
import type {
  AuthSession,
  PermissionRecord,
  RecordStatus,
  RoleRecord,
} from "../../../types";
type FormMode = "create" | "view" | "edit";

function showApiError(err: unknown, fallback: string) {
  if (isGloballyToastedApiError(err)) {
    return;
  }
  toast.error(getApiError(err, fallback));
}

function ActionIcon({ icon }: { icon: IconSvgElement }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={16}
      color="currentColor"
      strokeWidth={1.5}
    />
  );
}

type RoleForm = {
  name: string;
  description: string;
  status: RecordStatus;
};

const EMPTY_FORM: RoleForm = { name: "", description: "", status: "ACTIVE" };

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

function permissionChoiceLabel(permission: PermissionRecord) {
  return LEAD_PAGE_LABELS[permission.key] || permission.action;
}

function comparePermissionOrder(aKey: string, bKey: string, order: string[]) {
  const aIndex = order.indexOf(aKey);
  const bIndex = order.indexOf(bKey);
  if (aIndex === -1 && bIndex === -1) return 0;
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
}

function formFromRole(role: RoleRecord): RoleForm {
  return {
    name: role.name || "",
    description: role.description || "",
    status: role.status || "ACTIVE",
  };
}

function formatCreatedAt(value?: string | Date | null) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} • ${time}`;
}

function asSelectString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default function RolesPage() {
  const auth = useOutletContext<AuthSession>();
  const location = useLocation();
  const canCreate = hasPermission(auth, "role:create");
  const canEdit = hasPermission(auth, "role:edit");
  const canDelete = hasPermission(auth, "role:delete");
  const canAssignPermissions =
    hasPermission(auth, "permission:configure") &&
    (auth.role?.key === "admin" ||
      auth.role?.key === "ceo" ||
      auth.roles?.includes("admin") ||
      auth.roles?.includes("ceo"));

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [search, setSearch] = useState(() =>
    readUrlSearchQuery(location.search),
  );
  const [permissionSearch, setPermissionSearch] = useState("");
  const [status, setStatus] = useState("");
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [selected, setSelected] = useState<RoleRecord | null>(null);
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM);
  const [checked, setChecked] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const syncedSearch = useRef(false);
  const formLocked = formMode === "view";

  const [listRoles] = useLazyListRolesQuery();
  const [listPermissions] = useLazyListPermissionsQuery();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [updateRoleStatus] = useUpdateRoleStatusMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [setRolePermissions] = useSetRolePermissionsMutation();

  const grouped = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    const map = new Map<string, PermissionRecord[]>();
    for (const permission of permissions) {
      if (
        query &&
        !`${permission.module} ${permission.key} ${permission.description} ${permissionChoiceLabel(permission)}`
          .toLowerCase()
          .includes(query)
      ) {
        continue;
      }
      const list = map.get(permission.module) || [];
      list.push(permission);
      map.set(permission.module, list);
    }
    for (const [moduleName, items] of map) {
      if (moduleName === "Lead Management") {
        items.sort((a, b) => comparePermissionOrder(a.key, b.key, LEAD_PAGE_ORDER));
      }
      if (moduleName === "Role & Permission") {
        items.sort((a, b) => comparePermissionOrder(a.key, b.key, ROLE_ACTION_ORDER));
      }
    }
    return [...map.entries()];
  }, [permissions, permissionSearch]);

  async function load(options?: { silent?: boolean; search?: string }) {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const data = await listRoles({
        search: options?.search ?? search,
        status,
        assignedUserCount: userCount === null ? undefined : String(userCount),
      }).unwrap();
      setRoles(data.roles);
    } catch (err) {
      showApiError(err, "Unable to load roles.");
    }
    if (!options?.silent) {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status, userCount]);

  useEffect(() => {
    const next = readUrlSearchQuery(location.search);
    setSearch(next);
    if (syncedSearch.current) {
      void load({ search: next });
    }
    syncedSearch.current = true;
  }, [location.search]);

  useEffect(() => {
    void listPermissions()
      .unwrap()
      .then((data) => setPermissions(data.permissions))
      .catch(() => undefined);
  }, [listPermissions]);

  function openCreate() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFormMode("create");
    setFormOpen(true);
  }

  function openRole(role: RoleRecord, mode: FormMode) {
    setSelected(role);
    setForm(formFromRole(role));
    setFormMode(mode);
    setFormOpen(true);
  }

  function openPermissions(role: RoleRecord) {
    setSelected(role);
    setChecked(role.permissionIds || []);
    setPermissionSearch("");
    setPermissionOpen(true);
  }

  function closeForm() {
    if (formSaving) {
      return;
    }
    setFormOpen(false);
  }

  function closePermissions() {
    if (permissionSaving) {
      return;
    }
    setPermissionOpen(false);
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formSaving) {
      return;
    }
    setFormSaving(true);
    try {
      if (selected) {
        await updateRole({ id: selected.id, body: form }).unwrap();
      } else {
        await createRole(form).unwrap();
      }
      toast.success(selected ? "Role updated." : "Role created.");
      setFormOpen(false);
      await load();
    } catch (err) {
      showApiError(err, "Unable to save role.");
    } finally {
      setFormSaving(false);
    }
  }

  function askDelete(role: RoleRecord) {
    setDeleteTarget(role);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteSaving) {
      return;
    }
    setDeleteSaving(true);
    try {
      await deleteRole(deleteTarget.id).unwrap();
      toast.success("Role deleted.");
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
        setFormOpen(false);
        setPermissionOpen(false);
      }
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showApiError(err, "Unable to delete role.");
    } finally {
      setDeleteSaving(false);
    }
  }

  async function setRoleActive(role: RoleRecord, next: RecordStatus) {
    if (statusUpdatingId) {
      return;
    }
    setStatusUpdatingId(role.id);
    try {
      await updateRoleStatus({ id: role.id, status: next }).unwrap();
      toast.success(
        `Role successfully ${next === "ACTIVE" ? "activated" : "deactivated"}.`,
      );
      await load({ silent: true });
    } catch (err) {
      showApiError(err, "Unable to update status.");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function savePermissions() {
    if (!selected || permissionSaving) {
      return;
    }
    setPermissionSaving(true);
    try {
      await setRolePermissions({
        id: selected.id,
        permissionIds: checked,
      }).unwrap();
      toast.success("Permissions saved. Changes apply on the next request.");
      setPermissionOpen(false);
      await load();
    } catch (err) {
      showApiError(err, "Unable to save permissions.");
    } finally {
      setPermissionSaving(false);
    }
  }

  return (
    <div className={`${adminPage}`}>
      <PageMeta
        title="Roles & Permissions"
        description="Configure role-based permissions for modules and actions across EduConsult CRM."
      />
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure role-wise, module-wise, and action-level access."
        breadcrumbs={[
          { title: "Dashboard", path: "/dashboard" },
          { title: "Roles & Permissions" },
        ]}
        extra={
          canCreate ? (
            <PrimaryButton onClick={openCreate} label="Create Role" />
          ) : undefined
        }
      />

      <section
        className={`${adminFilters} min-[961px]:!grid-cols-[minmax(220px,1.6fr)_minmax(160px,240px)_minmax(150px,200px)]`}
      >
        <FormInput.Search
          allowClear
          enterButton="Search"
          loading={loading}
          placeholder="Filter by role name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={() => {
            void load();
          }}
        />
        <FormSelect
          allowClear
          placeholder="All statuses"
          value={status || undefined}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
          onChange={(value) => setStatus(asSelectString(value))}
        />
        <FormInputNumber
          min={0}
          precision={0}
          placeholder="Assigned users"
          value={userCount ?? undefined}
          onChange={(value) => setUserCount(typeof value === "number" ? value : null)}
        />
      </section>

      <section className={`${adminCard} ${tableWrap}`}>
        <Spin spinning={loading}>
          <table className={`${adminTable}`}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Status</th>
                <th>Total users</th>
                <th>Created at</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && roles.length === 0 ? (
                <tr>
                  <td colSpan={5}>No roles found.</td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <strong>{role.name}</strong>
                      <div className={`${muted}`}>{role.description}</div>
                    </td>
                    <td>
                      <FormSwitch
                        checked={role.status === "ACTIVE"}
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        disabled={!canEdit || role.isSystem}
                        loading={statusUpdatingId === role.id}
                        onChange={(checked) => {
                          void setRoleActive(
                            role,
                            checked ? "ACTIVE" : "INACTIVE",
                          );
                        }}
                      />
                    </td>
                    <td>{role.assignedUserCount}</td>
                    <td>{formatCreatedAt(role.createdAt)}</td>
                    <td className={`${rowActions}`}>
                      <RowActionMenu
                        items={(
                          [
                            {
                              key: "view",
                              label: "View",
                              icon: <ActionIcon icon={ViewIcon} />,
                              onSelect: () => openRole(role, "view"),
                            },
                            canEdit
                              ? {
                                  key: "edit",
                                  label: "Edit",
                                  icon: <ActionIcon icon={PencilEdit02Icon} />,
                                  onSelect: () => openRole(role, "edit"),
                                }
                              : null,
                            canAssignPermissions
                              ? {
                                  key: "permission",
                                  label: "Assign permissions",
                                  icon: <ActionIcon icon={Key01Icon} />,
                                  onSelect: () => openPermissions(role),
                                }
                              : null,
                            canDelete && !role.isSystem
                              ? {
                                  key: "delete",
                                  label: "Delete",
                                  icon: <ActionIcon icon={Delete02Icon} />,
                                  danger: true,
                                  onSelect: () => askDelete(role),
                                }
                              : null,
                          ] satisfies Array<RowActionItem | null>
                        ).filter((item) => item !== null)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Spin>
      </section>

      {formOpen
        ? createPortal(
            <div className={`${modalBackdrop}`} onClick={closeForm}>
              <div
                className={`${modalPanel}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="role-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`${modalHeader}`}>
                  <h3 id="role-modal-title">
                    {formMode === "create"
                      ? "Create Role"
                      : formMode === "view"
                        ? "View Role"
                        : "Edit Role"}
                  </h3>
                  <PrimaryButton
                    type="button"
                    className={`${modalClose}`}
                    aria-label="Close"
                    onClick={closeForm}
                    disabled={formSaving}
                    icon={
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={18}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    }
                  />
                </div>
                <form
                  className={`${adminForm}`}
                  onSubmit={(event) => {
                    if (formLocked) {
                      event.preventDefault();
                      return;
                    }
                    void saveRole(event);
                  }}
                >
                  <fieldset
                    className={`${adminFormFields}`}
                    disabled={formLocked || formSaving}
                  >
                    <label className={`${adminFormSpan}`}>
                      Role Name
                      <FormInput
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        required
                        disabled={formLocked || formSaving}
                      />
                    </label>
                    <label className={`${adminFormSpan}`}>
                      Description
                      <FormTextArea
                        rows={3}
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        disabled={formLocked || formSaving}
                      />
                    </label>
                    <div className={`${adminFormSpan} ${adminFormField}`}>
                      <span>Status</span>
                      <span className="inline-flex w-fit">
                        <FormSwitch
                          checked={form.status === "ACTIVE"}
                          checkedChildren="Active"
                          unCheckedChildren="Inactive"
                          disabled={formLocked || formSaving}
                          onChange={(checked) =>
                            setForm((current) => ({
                              ...current,
                              status: checked ? "ACTIVE" : "INACTIVE",
                            }))
                          }
                        />
                      </span>
                    </div>
                  </fieldset>
                  <div className={`${formActions}`}>
                    <PrimaryButton
                      type="button"
                      variant="outline"
                      onClick={closeForm}
                      disabled={formSaving}
                      label={formLocked ? "Close" : "Cancel"}
                    />
                    {!formLocked && (selected ? canEdit : canCreate) ? (
                      <PrimaryButton
                        type="submit"
                        loading={formSaving}
                        label="Save"
                      />
                    ) : null}
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}

      {permissionOpen && selected
        ? createPortal(
            <div className={`${modalBackdrop}`} onClick={closePermissions}>
              <div
                className={`${modalPanelFlex} ${modalPanelWide}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="permission-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`${modalHeader}`}>
                  <h3 id="permission-modal-title">
                    Permissions · {selected.name}
                  </h3>
                  <PrimaryButton
                    type="button"
                    className={`${modalClose}`}
                    aria-label="Close"
                    onClick={closePermissions}
                    disabled={permissionSaving}
                    icon={
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={18}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    }
                  />
                </div>
                <div className={`${modalBody} ${matrix} ${matrixModal}`}>
                  <FormInput.Search
                    allowClear
                    placeholder="Search permissions, e.g. Lead"
                    value={permissionSearch}
                    onChange={(event) =>
                      setPermissionSearch(event.target.value)
                    }
                  />
                  {grouped.map(([moduleName, items]) => (
                    <div key={moduleName} className={`${matrixGroup}`}>
                      <strong>{moduleName}</strong>
                      <div className={`${matrixActions}`}>
                        {items.map((item) => (
                          <label key={item.id}>
                            <FormCheckbox
                              checked={checked.includes(item.id)}
                              disabled={permissionSaving}
                              onChange={(event) => {
                                setChecked((current) =>
                                  event.target.checked
                                    ? [...current, item.id]
                                    : current.filter((id) => id !== item.id),
                                );
                              }}
                            >
                              {permissionChoiceLabel(item)}
                            </FormCheckbox>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`${modalFooter} ${formActions}`}>
                  <PrimaryButton
                    type="button"
                    variant="outline"
                    onClick={closePermissions}
                    disabled={permissionSaving}
                    label="Cancel"
                  />
                  {canAssignPermissions ? (
                    <PrimaryButton
                      onClick={() => void savePermissions()}
                      loading={permissionSaving}
                      label="Save permissions"
                    />
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <DeleteModal
        open={Boolean(deleteTarget)}
        loading={deleteSaving}
        title="Delete Role?"
        itemName={deleteTarget?.name || "this role"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
