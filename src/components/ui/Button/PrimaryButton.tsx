import { Button as AntButton } from 'antd'
import type { ButtonProps as AntButtonProps } from 'antd'
import type { ReactNode } from 'react'

type AppButtonVariant = 'default' | 'primary' | 'outline' | 'dashed'
type AppButtonSize = 'sm' | 'md' | 'lg'
type HtmlButtonType = 'button' | 'submit' | 'reset'

const SIZE_MAP: Record<AppButtonSize, NonNullable<AntButtonProps['size']>> = {
  sm: 'small',
  md: 'middle',
  lg: 'large',
}

function isAppSize(value: unknown): value is AppButtonSize {
  return value === 'sm' || value === 'md' || value === 'lg'
}

function resolveVariant(variant: AppButtonVariant): Pick<AntButtonProps, 'type' | 'color' | 'variant'> {
  switch (variant) {
    case 'primary':
      return { type: 'primary' }
    case 'outline':
      return { color: 'default', variant: 'outlined' }
    case 'dashed':
      return { type: 'dashed' }
    case 'default':
    default:
      return { type: 'default' }
  }
}

export type PrimaryButtonProps = Omit<AntButtonProps, 'type' | 'size' | 'variant' | 'color'> & {
  /** Visual style: `default` | `primary` | `outline` | `dashed`. */
  variant?: AppButtonVariant
  /** App sizes (`sm`/`md`/`lg`) or Ant Design sizes. */
  size?: AppButtonSize | AntButtonProps['size']
  /** Native HTML button type. */
  type?: HtmlButtonType
  fullWidth?: boolean
  icon?: ReactNode
}

export default function PrimaryButton({
  variant = 'primary',
  size = 'sm',
  type = 'button',
  fullWidth = false,
  block,
  htmlType,
  className,
  ...rest
}: PrimaryButtonProps) {
  const antSize = isAppSize(size) ? SIZE_MAP[size] : size
  const visual = resolveVariant(variant)

  return (
    <AntButton
      {...visual}
      htmlType={htmlType ?? type}
      size={antSize}
      block={block ?? fullWidth}
      className={['rounded-lg', className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}
