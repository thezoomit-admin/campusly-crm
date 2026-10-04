import type { RecordStatus } from "@/types";

export type PackageInclusion = "INCLUDED" | "OPTIONAL";

export type PackageServiceLine = {
  id: string;
  serviceItemId: string;
  serviceName: string;
  serviceStatus: RecordStatus;
  inclusion: PackageInclusion;
  unitPrice: string;
  sortOrder: number;
};

export type PackageVersionRecord = {
  id: string;
  versionNumber: number;
  price: string;
  individualTotal: string;
  saving: string;
  currency: "BDT";
  createdAt: string;
  createdBy: { id: string; fullName: string } | null;
  items: PackageServiceLine[];
};

export type PackageCountry = {
  id: string;
  name: string;
  code: string | null;
  status: RecordStatus;
};

export type PackageRecord = {
  id: string;
  name: string;
  description: string | null;
  status: RecordStatus;
  country: PackageCountry | null;
  price: string;
  individualTotal: string;
  saving: string;
  currency: "BDT";
  versionNumber: number;
  services: PackageServiceLine[];
  versions?: PackageVersionRecord[];
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; fullName: string } | null;
  updatedBy: { id: string; fullName: string } | null;
};

export type PackageFormValues = {
  name: string;
  countryId?: string;
  description?: string;
  price: number;
  status: RecordStatus;
};

export type PackageOption = {
  value: string;
  label: string;
  name: string;
  description: string | null;
  country: PackageCountry | null;
  price: string;
  individualTotal: string;
  saving: string;
  currency: "BDT";
  versionNumber: number;
  services: PackageServiceLine[];
};

export type ServiceOfferStatus =
  | "DRAFT"
  | "GENERATED"
  | "SENT"
  | "ACCEPTED"
  | "PAYMENT_PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type DiscountType = "AMOUNT" | "PERCENTAGE";

export type OfferLineKind =
  | "PACKAGE_INCLUDED"
  | "PACKAGE_OPTIONAL"
  | "SERVICE"
  | "ADDITIONAL"
  | "CUSTOM_SERVICE"
  | "CUSTOM_CHARGE";

export type EditableOfferLineKind = Exclude<OfferLineKind, "PACKAGE_INCLUDED">;

export type ServiceOfferItem = {
  id: string;
  kind: OfferLineKind;
  serviceItemId: string | null;
  serviceName: string;
  remarks: string | null;
  defaultPrice: string | null;
  offeredPrice: string;
  quantity: number;
  discountType: DiscountType | null;
  discountValue: string | null;
  discountAmount: string;
  discountReason: string | null;
  lineTotal: string;
  sortOrder: number;
};

export type ServiceOfferInstallment = {
  id: string;
  sequence: number;
  amount: string;
  purpose: string;
  dueDate: string | null;
  status: string;
  paidAt: string | null;
  paidBy: UserRef;
};

type UserRef = { id: string; fullName: string } | null;

export type ServiceOfferStatusHistoryEntry = {
  id: string;
  fromStatus: ServiceOfferStatus | null;
  toStatus: ServiceOfferStatus;
  reason: string | null;
  changedBy: UserRef;
  createdAt: string;
};

export type ServiceOfferRecord = {
  id: string;
  leadId: string;
  status: ServiceOfferStatus;
  offerVersion: number;
  revisedFrom: { id: string; offerVersion: number } | null;
  allowedTransitions: ServiceOfferStatus[];
  revisable: boolean;
  statusHistory: ServiceOfferStatusHistoryEntry[];
  sentAt: string | null;
  sentBy: UserRef;
  validUntil: string | null;
  acceptedAt: string | null;
  acceptedBy: UserRef;
  rejectedAt: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  cancelledBy: UserRef;
  cancelReason: string | null;
  sourcePackageId: string | null;
  sourcePackageVersionId: string | null;
  packageName: string | null;
  versionNumber: number | null;
  packageDefaultPrice: string | null;
  packagePrice: string | null;
  individualTotal: string;
  saving: string;
  fileOpeningDefault: string | null;
  fileOpeningCharge: string;
  grossTotal: string;
  lineDiscountTotal: string;
  subtotal: string;
  overallDiscountType: DiscountType | null;
  overallDiscountValue: string | null;
  overallDiscountAmount: string;
  overallDiscountReason: string | null;
  finalPayable: string;
  expectedDealValue: string;
  initialPayment: string | null;
  remainingAfterInitial: string;
  paidAmount: string;
  dueAmount: string;
  currency: "BDT";
  items: ServiceOfferItem[];
  installments: ServiceOfferInstallment[];
  generatedAt: string | null;
  generatedBy: UserRef;
  createdAt: string;
  updatedAt: string;
  createdBy: UserRef;
  updatedBy: UserRef;
};

export type ServiceOfferContext = {
  lead: {
    id: string;
    name: string;
    preferredCountryCode: string | null;
    preferredCountryName: string | null;
  };
  fileOpeningChargeDefault: string;
  discountLimitPercent: number;
  permissions: {
    canOffer: boolean;
    canDiscount: boolean;
    canApproveDiscount: boolean;
    canOverridePrice: boolean;
    canCustomCharge: boolean;
    canRecordPayment: boolean;
  };
};

export type ServiceOfferLineInput = {
  kind: EditableOfferLineKind;
  serviceItemId?: string | null;
  name?: string;
  amount?: number;
  offeredPrice?: number;
  quantity: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  discountReason?: string | null;
  remarks?: string | null;
};

export type ServiceOfferWriteBody = {
  packageId?: string | null;
  packagePrice?: number | null;
  lines: ServiceOfferLineInput[];
  fileOpeningCharge: number;
  overallDiscountType?: DiscountType | null;
  overallDiscountValue?: number | null;
  overallDiscountReason?: string | null;
  expectedDealValue?: number | null;
  initialPayment?: number | null;
  installments: Array<{ amount: number; purpose: string; dueDate?: string | null }>;
  generate?: boolean;
  revisionReason?: string | null;
};
