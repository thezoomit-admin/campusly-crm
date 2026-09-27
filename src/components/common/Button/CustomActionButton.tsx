import { Button as AntButton } from 'antd'
import { forwardRef, type ReactNode } from 'react'

type CustomActionButtonProps = {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  text?: string
  icon?: ReactNode
  icon2?: ReactNode
  iconSize?: number
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  size?: 'small' | 'middle' | 'large'
  fontSize?: number
  width?: number | string
}

const CustomActionButton = forwardRef<HTMLButtonElement, CustomActionButtonProps>(
  (
    {
      type = 'default',
      text,
      icon,
      icon2,
      iconSize = 16,
      disabled = false,
      onClick,
      loading = false,
      size = 'middle',
      fontSize,
      width,
    },
    ref,
  ) => {
    return (
      <AntButton
        ref={ref}
        type={type}
        loading={loading}
        onClick={onClick}
        disabled={disabled}
        size={size}
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: fontSize ? `${fontSize}px` : '14px',
          gap: '8px',
          opacity: disabled ? 0.6 : 1,
          width,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {icon ? (
          <span
            className="inline-flex items-center justify-center"
            style={{ width: iconSize, height: iconSize, fontSize: iconSize }}
          >
            {icon}
          </span>
        ) : null}
        {text}
        {icon2 ? (
          <span
            className="inline-flex items-center justify-center"
            style={{ width: iconSize, height: iconSize, fontSize: iconSize, marginLeft: 8 }}
          >
            {icon2}
          </span>
        ) : null}
      </AntButton>
    )
  },
)

CustomActionButton.displayName = 'CustomActionButton'

export default CustomActionButton
