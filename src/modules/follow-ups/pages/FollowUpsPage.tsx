import { Button, Form } from "antd";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect, useMemo, useState } from "react";
import { FormSelect } from "@/components/common/Forms";
import { AntModal } from "@/components/common/Modals";
import { PageHeader } from "@/components/common/Navigation";
import { PageMeta } from "@/components/common/Meta";
import { getApiError } from "@/lib/api";
import { hasPermission } from "@/lib/access";
import { useDebounce } from "@/hooks/useDebounce";
import type { AuthSession } from "@/types";
import {
  useCancelFollowUpMutation,
  useCompleteFollowUpMutation,
  useCreateFollowUpMutation,
  useGetFollowUpQuery,
  useListFollowUpsQuery,
  useRescheduleFollowUpMutation,
  useUpdateFollowUpReminderMutation,
} from "../api/followUpsApi";
import { adminCard, adminPage } from "../../../styles/admin";
import FollowUpFilters from "../components/FollowUpFilters";
import FollowUpFormModal from "../components/FollowUpFormModal";
import {
  CancelFollowUpModal,
  CompleteFollowUpModal,
  RescheduleFollowUpModal,
} from "../components/FollowUpLifecycleModals";
import FollowUpsTable from "../components/FollowUpsTable";
import {
  FOLLOW_UP_REMINDERS,
  type CompleteFollowUpValues,
  type FollowUpFormValues,
  type FollowUpRecord,
  type RescheduleFollowUpValues,
} from "../types";

export default function FollowUpsPage() {
  const auth = useOutletContext<AuthSession>();
  const canCreate = hasPermission(auth, "follow_up:create");
  const canEdit = hasPermission(auth, "follow_up:edit");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<FollowUpRecord | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get("followUpId") || "";
  const focusAction = searchParams.get("action");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching, isError } = useListFollowUpsQuery({
    search: debouncedSearch,
  });
  const [createFollowUp, { isLoading: creating }] = useCreateFollowUpMutation();
  const [completeFollowUp, { isLoading: completing }] =
    useCompleteFollowUpMutation();
  const [rescheduleFollowUp, { isLoading: rescheduling }] =
    useRescheduleFollowUpMutation();
  const [cancelFollowUp, { isLoading: cancelling }] =
    useCancelFollowUpMutation();
  const [updateReminder, { isLoading: savingReminder }] =
    useUpdateFollowUpReminderMutation();
  const { data: focused } = useGetFollowUpQuery(focusId, { skip: !focusId });

  const rows = useMemo(() => data?.items || [], [data?.items]);

  useEffect(() => {
    if (!focusId || !focused?.followUp || focused.followUp.id !== focusId)
      return;
    setSelected(focused.followUp);
    if (focusAction === "reschedule") setRescheduleOpen(true);
    else if (focusAction === "reminder") setReminderOpen(true);
    else setCompleteOpen(true);
    setSearchParams({}, { replace: true });
  }, [focusAction, focusId, focused, setSearchParams]);

  async function onCreate(values: FollowUpFormValues) {
    try {
      await createFollowUp(values).unwrap();
      toast.success("Follow-up created.");
      setFormOpen(false);
    } catch (error) {
      toast.error(getApiError(error, "Unable to create follow-up."));
      throw error;
    }
  }

  async function onComplete(values: CompleteFollowUpValues) {
    if (!selected) return;
    try {
      await completeFollowUp({ id: selected.id, body: values }).unwrap();
      toast.success(
        values.createNextFollowUp
          ? "Follow-up completed and next scheduled."
          : "Follow-up completed.",
      );
      setCompleteOpen(false);
      setSelected(null);
    } catch (error) {
      toast.error(getApiError(error, "Unable to complete follow-up."));
    }
  }

  async function onReschedule(values: RescheduleFollowUpValues) {
    if (!selected) return;
    try {
      await rescheduleFollowUp({ id: selected.id, body: values }).unwrap();
      toast.success("Follow-up rescheduled.");
      setRescheduleOpen(false);
      setSelected(null);
    } catch (error) {
      toast.error(getApiError(error, "Unable to reschedule follow-up."));
    }
  }

  async function onReminder(values: { reminder: string }) {
    if (!selected) return;
    try {
      await updateReminder({
        id: selected.id,
        reminder: values.reminder,
      }).unwrap();
      toast.success("Reminder updated.");
      setReminderOpen(false);
      setSelected(null);
    } catch (error) {
      toast.error(
        getApiError(
          error,
          "Unable to process the notification request. Please try again.",
        ),
      );
    }
  }

  async function onCancel(reason: string) {
    if (!selected) return;
    try {
      await cancelFollowUp({ id: selected.id, body: { reason } }).unwrap();
      toast.success("Follow-up cancelled.");
      setCancelOpen(false);
      setSelected(null);
    } catch (error) {
      toast.error(getApiError(error, "Unable to cancel follow-up."));
    }
  }

  return (
    <div className={adminPage}>
      <PageMeta
        title="Follow-ups"
        description="Plan and complete follow-up calls, emails, and tasks with leads and students."
      />
      <PageHeader
        title="Follow-ups"
        subtitle="Plan and complete follow-up calls, emails, and tasks with leads and students."
        breadcrumbs={[
          { title: "Dashboard", path: "/dashboard" },
          { title: "Follow-ups" },
        ]}
        extra={
          canCreate ? (
            <Button type="primary" onClick={() => setFormOpen(true)}>
              Add follow-up
            </Button>
          ) : null
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <FollowUpFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">
            Could not load records. Check API connection.
          </p>
        ) : null}

        <FollowUpsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          canEdit={canEdit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onComplete={(row) => {
            setSelected(row);
            setCompleteOpen(true);
          }}
          onReschedule={(row) => {
            setSelected(row);
            setRescheduleOpen(true);
          }}
          onCancel={(row) => {
            setSelected(row);
            setCancelOpen(true);
          }}
          onEditReminder={(row) => {
            setSelected(row);
            setReminderOpen(true);
          }}
        />
      </div>

      <FollowUpFormModal
        open={formOpen && canCreate}
        saving={creating}
        onClose={() => setFormOpen(false)}
        onSubmit={onCreate}
      />
      <CompleteFollowUpModal
        open={completeOpen && canEdit}
        saving={completing}
        followUp={selected}
        onClose={() => {
          setCompleteOpen(false);
          setSelected(null);
        }}
        onSubmit={onComplete}
      />
      <RescheduleFollowUpModal
        open={rescheduleOpen && canEdit}
        saving={rescheduling}
        followUp={selected}
        onClose={() => {
          setRescheduleOpen(false);
          setSelected(null);
        }}
        onSubmit={onReschedule}
      />
      <CancelFollowUpModal
        open={cancelOpen && canEdit}
        saving={cancelling}
        followUp={selected}
        onClose={() => {
          setCancelOpen(false);
          setSelected(null);
        }}
        onSubmit={onCancel}
      />
      <AntModal
        open={reminderOpen && canEdit}
        onClose={() => {
          setReminderOpen(false);
          setSelected(null);
        }}
        title="Edit reminder"
        width={420}
      >
        <Form
          key={selected?.id || "reminder"}
          layout="vertical"
          initialValues={{
            reminder: selected?.reminder || "30 Minutes Before",
          }}
          onFinish={onReminder}
        >
          <FormSelect
            name="reminder"
            label="Reminder"
            options={FOLLOW_UP_REMINDERS.map((value) => ({
              value,
              label: value,
            }))}
          />
          <Button type="primary" htmlType="submit" loading={savingReminder}>
            Save reminder
          </Button>
        </Form>
      </AntModal>
    </div>
  );
}
