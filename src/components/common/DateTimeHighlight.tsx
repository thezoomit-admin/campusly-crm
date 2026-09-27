import dayjs from 'dayjs'

type DateTimeHighlightProps = {
  value?: string | Date | null
  className?: string
}

export default function DateTimeHighlight({ value, className = '' }: DateTimeHighlightProps) {
  if (!value) {
    return <span className={`text-xs text-text-faint ${className}`}>-</span>
  }

  const dt = dayjs(value)
  if (!dt.isValid()) {
    return <span className={`text-xs text-text-faint ${className}`}>-</span>
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border border-primary/20 bg-primary/8 px-2 py-1 text-xs font-semibold text-primary-active ${className}`}
    >
      {dt.format('DD MMM YYYY, hh:mm A')}
    </span>
  )
}
