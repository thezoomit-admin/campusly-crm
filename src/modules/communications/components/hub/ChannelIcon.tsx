import { HugeiconsIcon } from '@hugeicons/react'
import { FacebookIcon, Mail01Icon, MessengerIcon, WhatsappIcon } from '@hugeicons/core-free-icons'
import type { CommunicationChannel } from '../../types'

type Props = {
  channel: CommunicationChannel
  size?: number
  className?: string
}

export default function ChannelIcon({ channel, size = 14, className }: Props) {
  if (channel === 'WHATSAPP') {
    return (
      <HugeiconsIcon
        icon={WhatsappIcon}
        size={size}
        color="#25D366"
        strokeWidth={1.6}
        className={className}
      />
    )
  }
  if (channel === 'EMAIL') {
    return (
      <HugeiconsIcon
        icon={Mail01Icon}
        size={size}
        color="#F97316"
        strokeWidth={1.6}
        className={className}
      />
    )
  }
  if (channel === 'META_FACEBOOK' || channel === 'META_INSTAGRAM') {
    return (
      <HugeiconsIcon
        icon={channel === 'META_INSTAGRAM' ? FacebookIcon : MessengerIcon}
        size={size}
        color="#1877F2"
        strokeWidth={1.6}
        className={className}
      />
    )
  }
  return (
    <HugeiconsIcon
      icon={Mail01Icon}
      size={size}
      color="#64748B"
      strokeWidth={1.6}
      className={className}
    />
  )
}
