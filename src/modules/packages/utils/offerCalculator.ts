import type { DiscountType } from "../types";

// Mirrors campusly-crm-api/src/modules/packages/offer-calculator.ts; the API result is authoritative.

export type CalculatorDiscount = { type: DiscountType; value: number } | null;

export type CalculatorLine = {
  countsTowardTotal: boolean;
  price: number;
  quantity: number;
  discount: CalculatorDiscount;
};

export type CalculatedLine = {
  gross: number;
  discountAmount: number;
  lineTotal: number;
  discountExceedsTotal: boolean;
};

export type CalculatedOffer = {
  lines: CalculatedLine[];
  grossTotal: number;
  lineDiscountTotal: number;
  subtotal: number;
  overallDiscountAmount: number;
  overallDiscountExceedsSubtotal: boolean;
  finalPayable: number;
  discountPercentOfGross: number;
};

function toPaisa(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}

function fromPaisa(value: number) {
  return value / 100;
}

function discountPaisa(basePaisa: number, discount: CalculatorDiscount) {
  if (!discount || !(discount.value > 0)) return 0;
  if (discount.type === "PERCENTAGE") return Math.round((basePaisa * discount.value) / 100);
  return toPaisa(discount.value);
}

export function calculateOffer(input: {
  packagePrice: number | null;
  lines: CalculatorLine[];
  fileOpeningCharge: number;
  overallDiscount: CalculatorDiscount;
}): CalculatedOffer {
  let grossPaisa = toPaisa(input.packagePrice ?? 0) + toPaisa(input.fileOpeningCharge);
  let lineDiscountPaisa = 0;

  const lines = input.lines.map((line) => {
    if (!line.countsTowardTotal) {
      return { gross: 0, discountAmount: 0, lineTotal: 0, discountExceedsTotal: false };
    }
    const gross = toPaisa(line.price) * Math.max(0, Math.trunc(line.quantity || 0));
    const requested = discountPaisa(gross, line.discount);
    const applied = Math.min(requested, gross);
    grossPaisa += gross;
    lineDiscountPaisa += applied;
    return {
      gross: fromPaisa(gross),
      discountAmount: fromPaisa(applied),
      lineTotal: fromPaisa(gross - applied),
      discountExceedsTotal: requested > gross,
    };
  });

  const subtotalPaisa = grossPaisa - lineDiscountPaisa;
  const requestedOverall = discountPaisa(subtotalPaisa, input.overallDiscount);
  const overallPaisa = Math.min(requestedOverall, subtotalPaisa);
  const totalDiscountPaisa = lineDiscountPaisa + overallPaisa;

  return {
    lines,
    grossTotal: fromPaisa(grossPaisa),
    lineDiscountTotal: fromPaisa(lineDiscountPaisa),
    subtotal: fromPaisa(subtotalPaisa),
    overallDiscountAmount: fromPaisa(overallPaisa),
    overallDiscountExceedsSubtotal: requestedOverall > subtotalPaisa,
    finalPayable: fromPaisa(subtotalPaisa - overallPaisa),
    discountPercentOfGross: grossPaisa > 0 ? (totalDiscountPaisa / grossPaisa) * 100 : 0,
  };
}

const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? money.format(amount) : "—";
}
