import { useMemo } from 'react'
import { Input, Select, Space } from 'antd'
import {
  FlagImage,
  defaultCountries,
  parseCountry,
  removeDialCode,
  usePhoneInput,
  type CountryIso2,
} from 'react-international-phone'
import 'react-international-phone/style.css'
import './LeadPhoneInput.css'

type LeadPhoneInputProps = {
  id?: string
  countryCode: string
  phone: string
  disabled?: boolean
  /** Lock dial/flag selector (e.g. WhatsApp reuses Phone country). */
  countryCodeDisabled?: boolean
  placeholder?: string
  status?: 'error' | 'warning'
  onCountryCodeChange: (countryCode: string) => void
  onPhoneChange: (phone: string) => void
}

function dialCodeToIso2(dialCode: string): CountryIso2 {
  const digits = dialCode.replace(/\D/g, '') || '880'
  const match = defaultCountries
    .map((row) => parseCountry(row))
    .find((country) => country.dialCode === digits)
  return (match?.iso2 || 'bd') as CountryIso2
}

function toE164(countryCode: string, phone: string) {
  const dial = countryCode.replace(/\D/g, '') || '880'
  const national = phone.replace(/\D/g, '')
  if (!national) return `+${dial}`
  if (national.startsWith(dial)) return `+${national}`
  return `+${dial}${national}`
}

const COUNTRY_OPTIONS = defaultCountries.map((row) => {
  const country = parseCountry(row)
  return {
    value: country.iso2,
    // searchable text
    label: `${country.name} +${country.dialCode}`,
    country,
  }
})

/** Flag country selector + formatted phone — matches Ant Design phone input pattern. */
export default function LeadPhoneInput({
  id,
  countryCode,
  phone,
  disabled,
  countryCodeDisabled,
  placeholder = 'Phone number',
  status,
  onCountryCodeChange,
  onPhoneChange,
}: LeadPhoneInputProps) {
  const defaultCountry = useMemo(() => dialCodeToIso2(countryCode || '880'), [countryCode])
  const e164Value = useMemo(() => toE164(countryCode || '880', phone), [countryCode, phone])

  const { inputValue, handlePhoneValueChange, inputRef, country, setCountry } = usePhoneInput({
    defaultCountry,
    value: e164Value,
    countries: defaultCountries,
    preferredCountries: ['bd', 'in', 'pk', 'np', 'lk', 'ae', 'sa', 'gb', 'us', 'ca', 'au'],
    forceDialCode: true,
    onChange: (data) => {
      onCountryCodeChange(data.country.dialCode)
      const national = removeDialCode({
        phone: data.phone,
        dialCode: data.country.dialCode,
        prefix: '+',
      }).replace(/\D/g, '')
      onPhoneChange(national)
    },
  })

  return (
    <Space.Compact block size="large" className="lead-phone-input w-full">
      <Select
        aria-label="Country"
        disabled={disabled || countryCodeDisabled}
        showSearch
        optionFilterProp="label"
        popupMatchSelectWidth={280}
        style={{ width: 72 }}
        className="lead-phone-input__country"
        value={country.iso2}
        options={COUNTRY_OPTIONS}
        optionRender={(option) => {
          const item = option.data.country as (typeof COUNTRY_OPTIONS)[number]['country']
          return (
            <span className="flex items-center gap-2">
              <FlagImage iso2={item.iso2} size="20px" />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <span className="shrink-0 text-[#8b97a8]">+{item.dialCode}</span>
            </span>
          )
        }}
        labelRender={() => (
          <span className="inline-flex items-center justify-center">
            <FlagImage iso2={country.iso2} size="22px" />
          </span>
        )}
        onChange={(iso2) => {
          if (countryCodeDisabled) return
          setCountry(iso2 as CountryIso2, { focusOnInput: true })
        }}
      />
      <Input
        id={id}
        ref={(node) => {
          // Keep react-international-phone caret handling wired to the DOM input.
          inputRef.current = node?.input ?? null
        }}
        disabled={disabled}
        status={status}
        value={inputValue}
        placeholder={placeholder}
        inputMode="tel"
        autoComplete="tel"
        onChange={handlePhoneValueChange}
      />
    </Space.Compact>
  )
}
