import { toQuery } from "@/lib/api";
import { baseApi } from "@/redux/api/baseApi";
import type {
  ServiceItemFormValues,
  ServiceItemRecord,
} from "../types";

export type ServiceItemListParams = {
  search?: string;
  status?: string;
  categoryId?: string;
  countryId?: string;
  page?: number;
  limit?: number;
};

export type ServiceItemListResponse = {
  items: ServiceItemRecord[];
  total: number;
  page: number;
  limit: number;
};

export type ServiceItemOption = {
  value: string;
  label: string;
  name: string;
  description: string | null;
  defaultPrice: string;
  currency: "BDT";
  category: { id: string; name: string };
  countries: Array<{ id: string; name: string; code: string | null }>;
};

const serviceItemsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listServiceItems: builder.query<
      ServiceItemListResponse,
      ServiceItemListParams | void
    >({
      query: (params) =>
        `/service-items${toQuery({
          search: params?.search,
          status: params?.status,
          categoryId: params?.categoryId,
          countryId: params?.countryId,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "ServiceItem" as const,
                id,
              })),
              { type: "ServiceItems", id: "LIST" },
            ]
          : [{ type: "ServiceItems", id: "LIST" }],
    }),
    getServiceItem: builder.query<
      { serviceItem: ServiceItemRecord },
      string
    >({
      query: (id) => `/service-items/${id}`,
      providesTags: (_result, _error, id) => [{ type: "ServiceItem", id }],
    }),
    listServiceItemOptions: builder.query<
      { items: ServiceItemOption[] },
      { categoryId?: string; countryId?: string } | void
    >({
      query: (params) =>
        `/service-items/options${toQuery({
          categoryId: params?.categoryId,
          countryId: params?.countryId,
        })}`,
      providesTags: [{ type: "ServiceItems", id: "OPTIONS" }],
    }),
    checkServiceItemName: builder.query<
      { available: boolean },
      { name: string; excludeId?: string }
    >({
      query: ({ name, excludeId }) =>
        `/service-items/name-availability${toQuery({ name, excludeId })}`,
    }),
    createServiceItem: builder.mutation<
      { serviceItem: ServiceItemRecord; message: string },
      ServiceItemFormValues
    >({
      query: (body) => ({ url: "/service-items", method: "POST", body }),
      invalidatesTags: [
        { type: "ServiceItems", id: "LIST" },
        { type: "ServiceItems", id: "OPTIONS" },
      ],
    }),
    updateServiceItem: builder.mutation<
      { serviceItem: ServiceItemRecord; message: string },
      { id: string; body: ServiceItemFormValues }
    >({
      query: ({ id, body }) => ({
        url: `/service-items/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceItem", id },
        { type: "ServiceItems", id: "LIST" },
        { type: "ServiceItems", id: "OPTIONS" },
      ],
    }),
    updateServiceItemStatus: builder.mutation<
      { serviceItem: ServiceItemRecord; message: string },
      { id: string; status: "ACTIVE" | "INACTIVE" }
    >({
      query: ({ id, status }) => ({
        url: `/service-items/${id}/status`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceItem", id },
        { type: "ServiceItems", id: "LIST" },
        { type: "ServiceItems", id: "OPTIONS" },
      ],
    }),
  }),
});

export const {
  useListServiceItemsQuery,
  useGetServiceItemQuery,
  useListServiceItemOptionsQuery,
  useLazyCheckServiceItemNameQuery,
  useCreateServiceItemMutation,
  useUpdateServiceItemMutation,
  useUpdateServiceItemStatusMutation,
} = serviceItemsApi;
