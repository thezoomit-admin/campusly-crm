import { Switch } from 'antd'

type SwitchStatus2Props = {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  size?: 'small' | 'default'
  label?: string
  className?: string
  loading?: boolean
}

export default function SwitchStatus2({
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  size = 'default',
  label,
  className = '',
  loading = false,
}: SwitchStatus2Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Switch
        checked={checked}
        checkedChildren="Active"
        unCheckedChildren="Inactive"
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        size={size}
        loading={loading}
      />
      {label ? <span className="text-sm text-text-muted">{label}</span> : null}
    </div>
  )
}
