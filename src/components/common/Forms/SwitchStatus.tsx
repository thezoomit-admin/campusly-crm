import { Switch } from 'antd'

type SwitchStatusProps = {
  data: { isActive?: boolean }
  handleStatusChange: (checked: boolean, record: { isActive?: boolean }) => void
  loading?: boolean
  disabled?: boolean
}

export default function SwitchStatus({
  data,
  handleStatusChange,
  loading = false,
  disabled = false,
}: SwitchStatusProps) {
  return (
    <Switch
      checked={Boolean(data.isActive)}
      loading={loading}
      disabled={disabled}
      onChange={(checked) => handleStatusChange(checked, data)}
    />
  )
}
