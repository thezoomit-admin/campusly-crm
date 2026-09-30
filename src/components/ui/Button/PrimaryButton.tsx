import { Button as AntButton } from 'antd'
import type { ButtonProps as AntButtonProps } from 'antd'
import type { ReactNode } from 'react'

/**
 * App button variants (mapped to Ant Design color/type/variant).
 *
 * | variant   | Look                                      |
 * |-----------|-------------------------------------------|
 * | primary   | Filled brand/solid CTA                    |
 * | default   | Neutral solid / default button            |
 * | outline   | Bordered, transparent fill                |
 * | dashed    | Dashed border                             |
 * | filled    | Soft filled background                    |
 * | text      | Text-only (no border/bg)                  |
 * | link      | Link-styled text                          |
 * | danger    | Destructive solid (red)                   |
 */
type AppButtonVariant =
  | 'default'
  | 'primary'
  | 'outline'
  | 'dashed'
  | 'filled'
  | 'text'
  | 'link'
  | 'danger'

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
    case 'filled':
      return { color: 'default', variant: 'filled' }
    case 'text':
      return { type: 'text' }
    case 'link':
      return { type: 'link' }
    case 'danger':
      return { color: 'danger', variant: 'solid' }
    case 'default':
    default:
      return { type: 'default' }
  }
}

export type PrimaryButtonProps = Omit<AntButtonProps, 'type' | 'size' | 'variant' | 'color' | 'children'> & {
  /** Visual style — see AppButtonVariant table above. */
  variant?: AppButtonVariant
  /** App sizes (`sm`/`md`/`lg`) or Ant Design sizes. */
  size?: AppButtonSize | AntButtonProps['size']
  /** Native HTML button type. */
  type?: HtmlButtonType
  /** Button text. Same as children — use either `label` or children. */
  label?: ReactNode
  children?: ReactNode
  fullWidth?: boolean
  icon?: ReactNode
}

export default function PrimaryButton({
  variant = 'primary',
  size = 'sm',
  type = 'button',
  label,
  children,
  fullWidth = false,
  block,
  htmlType,
  className,
  icon,
  ...rest
}: PrimaryButtonProps) {
  const antSize = isAppSize(size) ? SIZE_MAP[size] : size
  const visual = resolveVariant(variant)
  const content = children ?? label

  return (
    <AntButton
      {...visual}
      htmlType={htmlType ?? type}
      size={antSize}
      block={block ?? fullWidth}
      icon={icon}
      className={['rounded-lg', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {content}
    </AntButton>
  )
}
