import { baseApi } from "@/redux/api/baseApi";
import type {
  CancelFollowUpValues,
  CompleteFollowUpValues,
  FollowUpFormValues,
  FollowUpRecord,
  RescheduleFollowUpValues,
} from "@/modules/follow-ups/types";

export type CreateMeetingValues = Omit<FollowUpFormValues, "type"> & {
  type?: "Meeting";
};

function meetingInvalidateTags(leadId?: string | null) {
  return [
    { type: "FollowUps" as const, id: "LIST" },
    ...(leadId
      ? [
          { type: "FollowUps" as const, id: leadId },
          { type: "Leads" as const, id: leadId },
        ]
      : [{ type: "Leads" as const }]),
    { type: "Leads" as const, id: "LIST" },
    { type: "Leads" as const, id: "MINE" },
    "Activities" as const,
    "Dashboard" as const,
  ];
}

const meetingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createMeeting: builder.mutation<
      { followUp: FollowUpRecord },
      CreateMeetingValues
    >({
      query: (body) => ({
        url: "/meetings",
        method: "POST",
        body: { ...body, type: "Meeting" },
      }),
      invalidatesTags: (result, _e, body) => {
        const leadId =
          body.leadId ||
          result?.followUp?.leadId ||
          result?.followUp?.lead?.id ||
          undefined;
        return meetingInvalidateTags(leadId);
      },
    }),
    completeMeeting: builder.mutation<
      { followUp: FollowUpRecord; nextFollowUp: FollowUpRecord | null },
      { id: string; body: CompleteFollowUpValues }
    >({
      query: ({ id, body }) => ({
        url: `/meetings/${id}/complete`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result) => {
        const leadId =
          result?.followUp?.leadId || result?.followUp?.lead?.id || undefined;
        return meetingInvalidateTags(leadId);
      },
    }),
    rescheduleMeeting: builder.mutation<
      { followUp: FollowUpRecord; nextFollowUp: FollowUpRecord },
      { id: string; body: RescheduleFollowUpValues }
    >({
      query: ({ id, body }) => ({
        url: `/meetings/${id}/reschedule`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result) => {
        const leadId =
          result?.followUp?.leadId || result?.followUp?.lead?.id || undefined;
        return meetingInvalidateTags(leadId);
      },
    }),
    cancelMeeting: builder.mutation<
      { followUp: FollowUpRecord },
      { id: string; body: CancelFollowUpValues }
    >({
      query: ({ id, body }) => ({
        url: `/meetings/${id}/cancel`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result) => {
        const leadId =
          result?.followUp?.leadId || result?.followUp?.lead?.id || undefined;
        return meetingInvalidateTags(leadId);
      },
    }),
  }),
});

export const {
  useCreateMeetingMutation,
  useCompleteMeetingMutation,
  useRescheduleMeetingMutation,
  useCancelMeetingMutation,
} = meetingsApi;
