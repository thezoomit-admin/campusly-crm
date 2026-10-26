import { useEffect, useMemo, useRef, useState } from "react";
import { Dropdown, Input, Modal, Spin, type MenuProps } from "antd";
import { toast } from "react-toastify";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  PinIcon,
  PinOffIcon,
} from "@hugeicons/core-free-icons";
import { DeleteModal } from "@/components/common/Modals";
import { PrimaryButton } from "@/components/ui";
import { getApiError, isGloballyToastedApiError } from "@/lib/api";
import {
  useDeleteLeadNoteMutation,
  useSetLeadNotePinMutation,
  useUpdateLeadNoteMutation,
} from "../../api/leadsApi";
import type { LeadNoteItem } from "../../types";
import { formatDisplayDateTime } from "../../utils/leadDetails";
import LeadSectionCard from "./LeadSectionCard";
import {
  LeadListPagination,
  useLeadListPagination,
} from "./LeadListPagination";

const NOTE_MAX_LENGTH = 2000;

function notePreview(body: string) {
  const line = body
    .split("\n")
    .map((part) => part.trim())
    .find(Boolean);
  if (!line) return "This note";
  return line.length > 140 ? `${line.slice(0, 137)}…` : line;
}

function noteActions(item: LeadNoteItem) {
  return (
    item.permissions ?? {
      edit: false,
      pin: false,
      delete: false,
    }
  );
}

function NoteBody({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <>
      <p
        ref={ref}
        className={`m-0 whitespace-pre-wrap text-[0.88rem] text-[#17324f] [overflow-wrap:anywhere] dark:text-text-strong ${
          expanded ? "" : "line-clamp-6"
        }`}
      >
        {text}
      </p>
      {overflows || expanded ? (
        <button
          type="button"
          className="mt-1 cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-medium text-primary"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </>
  );
}

export function LeadNotesPanel({
  leadId,
  notes,
  loading,
  canAdd,
  onAdd,
}: {
  leadId: string;
  notes: LeadNoteItem[];
  loading?: boolean;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(notes);
  const [updateLeadNote, { isLoading: saving }] = useUpdateLeadNoteMutation();
  const [setLeadNotePin] = useSetLeadNotePinMutation();
  const [deleteLeadNote, { isLoading: deleting }] = useDeleteLeadNoteMutation();
  const [editing, setEditing] = useState<LeadNoteItem | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<LeadNoteItem | null>(null);
  const [busyNoteId, setBusyNoteId] = useState<string | null>(null);

  const pinArrangement = useMemo(
    () => notes.map((item) => `${item.id}:${item.pinnedAt ?? ""}`).join("|"),
    [notes],
  );

  useEffect(() => {
    setPage(1);
  }, [pinArrangement, setPage]);

  function openEdit(item: LeadNoteItem) {
    setEditing(item);
    setDraft(item.body);
  }

  async function saveEdit() {
    if (!editing) return;
    const text = draft.trim();
    if (!text) {
      toast.error("Note cannot be empty.");
      return;
    }
    if (text.length > NOTE_MAX_LENGTH) {
      toast.error(`Note cannot exceed ${NOTE_MAX_LENGTH} characters.`);
      return;
    }
    if (text === editing.body.trim()) {
      setEditing(null);
      return;
    }
    try {
      await updateLeadNote({
        id: leadId,
        noteId: editing.id,
        body: text,
      }).unwrap();
      toast.success("Note updated.");
      setEditing(null);
    } catch (error) {
      if (!isGloballyToastedApiError(error)) {
        toast.error(getApiError(error, "Unable to update this note."));
      }
    }
  }

  async function togglePin(item: LeadNoteItem) {
    const pinned = !item.pinnedAt;
    setBusyNoteId(item.id);
    try {
      await setLeadNotePin({
        id: leadId,
        noteId: item.id,
        pinned,
      }).unwrap();
      toast.success(pinned ? "Note pinned." : "Note unpinned.");
    } catch (error) {
      if (!isGloballyToastedApiError(error)) {
        toast.error(
          getApiError(
            error,
            pinned ? "Unable to pin this note." : "Unable to unpin this note.",
          ),
        );
      }
    } finally {
      setBusyNoteId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteLeadNote({
        id: leadId,
        noteId: pendingDelete.id,
      }).unwrap();
      toast.success("Note deleted.");
      setPendingDelete(null);
    } catch (error) {
      if (!isGloballyToastedApiError(error)) {
        toast.error(getApiError(error, "Unable to delete this note."));
      }
    }
  }

  function menuFor(item: LeadNoteItem): MenuProps["items"] {
    const actions = noteActions(item);
    const busy = busyNoteId === item.id || deleting;
    const items: MenuProps["items"] = [];
    if (actions.edit) {
      items.push({
        key: "edit",
        disabled: busy,
        label: (
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
            Edit note
          </span>
        ),
        onClick: () => openEdit(item),
      });
    }
    if (actions.pin) {
      items.push({
        key: "pin",
        disabled: busy,
        label: (
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={item.pinnedAt ? PinOffIcon : PinIcon} size={14} />
            {item.pinnedAt ? "Unpin note" : "Pin note"}
          </span>
        ),
        onClick: () => void togglePin(item),
      });
    }
    if (actions.delete) {
      if (items.length) items.push({ type: "divider" });
      items.push({
        key: "delete",
        danger: true,
        disabled: busy,
        label: (
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={Delete02Icon} size={14} />
            Delete note
          </span>
        ),
        onClick: () => setPendingDelete(item),
      });
    }
    return items;
  }

  return (
    <LeadSectionCard
      title="Note history"
      extra={
        canAdd ? (
          <PrimaryButton
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-transparent px-1.5 py-1 text-[0.82rem] font-medium text-primary hover:bg-hover-bg"
            onClick={onAdd}
            label="Add note"
          />
        ) : null
      }
    >
      {loading ? (
        <div className="grid min-h-40 place-items-center py-8">
          <Spin />
        </div>
      ) : notes.length === 0 ? (
        <p className="m-0 text-[0.84rem] text-[#8b97a8]">
          No notes recorded for this lead yet.
        </p>
      ) : (
        <>
          <ol className="m-0 grid list-none gap-0 p-0">
            {pageItems.map((item, index) => {
              const actions = noteActions(item);
              const hasMenu = actions.edit || actions.pin || actions.delete;
              const author = item.createdBy?.name || "System";
              return (
                <li
                  key={item.id}
                  className="relative flex gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
                >
                  <span className="mt-1.5 size-3.5 shrink-0 rounded-full border-[3px] border-[#e7f8ef] bg-primary" />
                  {index < pageItems.length - 1 ? (
                    <span className="absolute top-7 bottom-[-6px] left-[6px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="m-0 flex min-w-0 items-center gap-1.5 text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
                          {item.pinnedAt ? (
                            <span className="inline-flex shrink-0 text-primary" title="Pinned">
                              <HugeiconsIcon
                                icon={PinIcon}
                                size={14}
                                color="currentColor"
                              />
                            </span>
                          ) : null}
                          <span className="truncate">{author}</span>
                        </p>
                        <p className="mt-0.5 mb-0 text-[0.75rem] text-[#8b97a8]">
                          {formatDisplayDateTime(item.createdAt)}
                          {item.edited ? <span> · Edited</span> : null}
                        </p>
                      </div>
                      {hasMenu ? (
                        <Dropdown
                          menu={{ items: menuFor(item) }}
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <button
                            type="button"
                            aria-label={`Actions for note by ${author}`}
                            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-[#6b7280] hover:bg-hover-bg hover:text-primary"
                          >
                            <HugeiconsIcon
                              icon={MoreVerticalIcon}
                              size={16}
                              color="currentColor"
                              strokeWidth={1.7}
                            />
                          </button>
                        </Dropdown>
                      ) : null}
                    </div>
                    <div className="mt-2">
                      <NoteBody
                        key={`${item.id}-${item.updatedAt}`}
                        text={item.body}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <LeadListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Modal
        title="Edit note"
        open={Boolean(editing)}
        onCancel={() => {
          if (!saving) setEditing(null);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <PrimaryButton
              type="button"
              variant="outline"
              label="Cancel"
              disabled={saving}
              onClick={() => setEditing(null)}
            />
            <PrimaryButton
              type="button"
              label="Save"
              loading={saving}
              onClick={() => void saveEdit()}
            />
          </div>
        }
        destroyOnHidden
        styles={{
          body: {
            maxHeight: "calc(100vh - 220px)",
            overflowY: "auto",
          },
        }}
      >
        <Input.TextArea
          key={editing?.id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoSize={{ minRows: 2 }}
          maxLength={NOTE_MAX_LENGTH}
          showCount
          placeholder="Update this note"
        />
      </Modal>

      <DeleteModal
        open={Boolean(pendingDelete)}
        title="Delete this note?"
        width={420}
        loading={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
        message={
          pendingDelete ? (
            <>
              <span className="mb-2 block font-medium text-text-strong">
                {notePreview(pendingDelete.body)}
              </span>
              This note will be hidden from the lead. The removal stays in the
              activity log.
            </>
          ) : null
        }
      />
    </LeadSectionCard>
  );
}
