import { HugeiconsIcon, type HugeiconsIconProps } from '@hugeicons/react'

export type HugeIconProps = Omit<HugeiconsIconProps, 'color'> & {
  color?: string
}

export default function HugeIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.5,
  ...props
}: HugeIconProps) {
  return <HugeiconsIcon size={size} color={color} strokeWidth={strokeWidth} {...props} />
}
