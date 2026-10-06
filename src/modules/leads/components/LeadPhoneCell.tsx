import { emptyLeadValue } from '../utils/leadList'

type LeadPhoneCellProps = {
  phone?: string | null
  isDuplicate?: boolean
  hasPhoneDuplicate?: boolean
}

export default function LeadPhoneCell({ phone, isDuplicate, hasPhoneDuplicate }: LeadPhoneCellProps) {
  const showDuplicate = Boolean(isDuplicate || hasPhoneDuplicate)
  return (
    <div className="leading-tight">
      <span className="whitespace-nowrap text-[13px] text-text">{emptyLeadValue(phone)}</span>
      {showDuplicate ? (
        <span className="mt-0.5 inline-flex rounded-full bg-[#fff7ed] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#c2410c]">
          Duplicate
        </span>
      ) : null}
    </div>
  )
}
