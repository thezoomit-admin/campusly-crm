import { Form, Switch } from 'antd'
import type { SwitchProps } from 'antd'
import type { Rule } from 'antd/es/form'
import type { Dispatch, SetStateAction } from 'react'
import InputError from './InputError'

type FormSwitchProps = Omit<SwitchProps, 'name'> & {
  name?: string
  label?: string
  rules?: Rule[]
  fieldError?: Record<string, string>
  setFieldError?: Dispatch<SetStateAction<Record<string, string>>>
}

export default function FormSwitch({
  name,
  label,
  rules,
  fieldError = {},
  setFieldError,
  className,
  onChange,
  ...rest
}: FormSwitchProps) {
  const control = (
    <Switch
      className={className}
      onChange={(checked, event) => {
        if (name) setFieldError?.((prev) => ({ ...prev, [name]: '' }))
        onChange?.(checked, event)
      }}
      {...rest}
    />
  )

  if (!name) {
    return control
  }

  return (
    <Form.Item name={name} label={label} rules={rules} valuePropName="checked">
      {control}
      {fieldError[name] ? <InputError>{fieldError[name]}</InputError> : null}
    </Form.Item>
  )
}

export type { FormSwitchProps }
