import { toQuery } from "@/lib/api";
import { baseApi } from "@/redux/api/baseApi";
import type {
  PackageFormValues,
  PackageInclusion,
  PackageOption,
  PackageRecord,
  ServiceOfferContext,
  ServiceOfferRecord,
  ServiceOfferWriteBody,
} from "../types";

export type PackageListParams = {
  search?: string;
  status?: string;
  countryId?: string;
  serviceItemId?: string;
  page?: number;
  limit?: number;
};

export type PackageListResponse = {
  items: PackageRecord[];
  total: number;
  page: number;
  limit: number;
};

export type PackageServiceInput = {
  serviceItemId: string;
  inclusion: PackageInclusion;
};

export type PackageWriteBody = Omit<PackageFormValues, "countryId"> & {
  countryId?: string | null;
  services: PackageServiceInput[];
};

const packagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPackages: builder.query<PackageListResponse, PackageListParams | void>({
      query: (params) =>
        `/packages${toQuery({
          search: params?.search,
          status: params?.status,
          countryId: params?.countryId,
          serviceItemId: params?.serviceItemId,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Package" as const, id })),
              { type: "Packages" as const, id: "LIST" },
            ]
          : [{ type: "Packages", id: "LIST" }],
    }),
    getPackage: builder.query<{ package: PackageRecord }, string>({
      query: (id) => `/packages/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Package", id }],
    }),
    listPackageOptions: builder.query<
      { items: PackageOption[] },
      { preferredCountryCode?: string; countryId?: string } | void
    >({
      query: (params) =>
        `/packages/options${toQuery({
          preferredCountryCode: params?.preferredCountryCode,
          countryId: params?.countryId,
        })}`,
      providesTags: [{ type: "Packages", id: "OPTIONS" }],
    }),
    checkPackageName: builder.query<{ available: boolean }, { name: string; excludeId?: string }>({
      query: ({ name, excludeId }) => `/packages/name-availability${toQuery({ name, excludeId })}`,
    }),
    createPackage: builder.mutation<{ package: PackageRecord; message: string }, PackageWriteBody>({
      query: (body) => ({ url: "/packages", method: "POST", body }),
      invalidatesTags: [
        { type: "Packages", id: "LIST" },
        { type: "Packages", id: "OPTIONS" },
      ],
    }),
    updatePackage: builder.mutation<
      { package: PackageRecord; message: string },
      { id: string; body: PackageWriteBody }
    >({
      query: ({ id, body }) => ({ url: `/packages/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Package", id },
        { type: "Packages", id: "LIST" },
        { type: "Packages", id: "OPTIONS" },
      ],
    }),
    updatePackageStatus: builder.mutation<
      { package: PackageRecord; message: string },
      { id: string; status: "ACTIVE" | "INACTIVE" }
    >({
      query: ({ id, status }) => ({
        url: `/packages/${id}/status`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Package", id },
        { type: "Packages", id: "LIST" },
        { type: "Packages", id: "OPTIONS" },
      ],
    }),
    listLeadServiceOffers: builder.query<{ offers: ServiceOfferRecord[] }, string>({
      query: (leadId) => `/leads/${leadId}/service-offers`,
      providesTags: (_result, _error, leadId) => [{ type: "ServiceOffers", id: leadId }],
    }),
    getServiceOfferContext: builder.query<ServiceOfferContext, string>({
      query: (leadId) => `/leads/${leadId}/service-offers/context`,
    }),
    createLeadServiceOffer: builder.mutation<
      { offer: ServiceOfferRecord; message: string },
      { leadId: string; body: ServiceOfferWriteBody }
    >({
      query: ({ leadId, body }) => ({
        url: `/leads/${leadId}/service-offers`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        ...offerChangeTags(_result, _error, { leadId }),
        { type: "FollowUps", id: "LIST" },
      ],
    }),
    updateLeadServiceOffer: builder.mutation<
      { offer: ServiceOfferRecord; message: string },
      { leadId: string; offerId: string; body: ServiceOfferWriteBody }
    >({
      query: ({ leadId, offerId, body }) => ({
        url: `/leads/${leadId}/service-offers/${offerId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        ...offerChangeTags(_result, _error, { leadId }),
        { type: "FollowUps", id: "LIST" },
      ],
    }),
    generateLeadServiceOffer: builder.mutation<
      { offer: ServiceOfferRecord; message: string },
      { leadId: string; offerId: string }
    >({
      query: ({ leadId, offerId }) => ({
        url: `/leads/${leadId}/service-offers/${offerId}/generate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        ...offerChangeTags(_result, _error, { leadId }),
        { type: "FollowUps", id: "LIST" },
      ],
    }),
    deleteLeadServiceOffer: builder.mutation<{ message: string }, { leadId: string; offerId: string }>({
      query: ({ leadId, offerId }) => ({
        url: `/leads/${leadId}/service-offers/${offerId}`,
        method: "DELETE",
      }),
      invalidatesTags: offerChangeTags,
    }),
    changeLeadServiceOfferStatus: builder.mutation<
      { offer: ServiceOfferRecord; message: string },
      { leadId: string; offerId: string; action: OfferStatusAction; reason?: string }
    >({
      query: ({ leadId, offerId, action, reason }) => ({
        url: `/leads/${leadId}/service-offers/${offerId}/${action}`,
        method: "POST",
        body: reason === undefined ? undefined : { reason },
      }),
      invalidatesTags: offerChangeTags,
    }),
    reviseLeadServiceOffer: builder.mutation<
      { offer: ServiceOfferRecord; message: string },
      { leadId: string; offerId: string; body: ServiceOfferWriteBody }
    >({
      query: ({ leadId, offerId, body }) => ({
        url: `/leads/${leadId}/service-offers/${offerId}/revise`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        ...offerChangeTags(_result, _error, { leadId }),
        { type: "FollowUps", id: "LIST" },
      ],
    }),
    recordOfferInstallmentPayment: builder.mutation<
      { offer: ServiceOfferRecord; message: string },
      { leadId: string; offerId: string; installmentId: string }
    >({
      query: ({ leadId, offerId, installmentId }) => ({
        url: `/leads/${leadId}/service-offers/${offerId}/installments/${installmentId}/pay`,
        method: "POST",
      }),
      invalidatesTags: offerChangeTags,
    }),
  }),
});

export type OfferStatusAction = "send" | "accept" | "reject" | "cancel";

function offerChangeTags(_result: unknown, _error: unknown, { leadId }: { leadId: string }) {
  return [{ type: "ServiceOffers" as const, id: leadId }, "Activities" as const];
}

export const {
  useListPackagesQuery,
  useGetPackageQuery,
  useListPackageOptionsQuery,
  useLazyCheckPackageNameQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useUpdatePackageStatusMutation,
  useListLeadServiceOffersQuery,
  useGetServiceOfferContextQuery,
  useCreateLeadServiceOfferMutation,
  useUpdateLeadServiceOfferMutation,
  useGenerateLeadServiceOfferMutation,
  useDeleteLeadServiceOfferMutation,
  useChangeLeadServiceOfferStatusMutation,
  useReviseLeadServiceOfferMutation,
  useRecordOfferInstallmentPaymentMutation,
} = packagesApi;
