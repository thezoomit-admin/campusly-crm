import type { RecordStatus } from "@/types";

export type ServiceItemReference = {
  id: string;
  name: string;
  status: RecordStatus;
};

export type ServiceItemCountry = ServiceItemReference & {
  code: string | null;
};

export type ServiceItemRecord = {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: string;
  currency: "BDT";
  status: RecordStatus;
  category: ServiceItemReference;
  countries: ServiceItemCountry[];
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; fullName: string } | null;
  updatedBy: { id: string; fullName: string } | null;
};

export type ServiceItemFormValues = {
  name: string;
  categoryId: string;
  description?: string;
  defaultPrice: number;
  countryIds?: string[];
  status: RecordStatus;
};
