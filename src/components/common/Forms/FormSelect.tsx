import { Form, Select } from 'antd'
import type { Rule } from 'antd/es/form'
import type { SelectProps } from 'antd/es/select'
import type { Dispatch, SetStateAction } from 'react'
import InputError from './InputError'

type FormSelectProps = Omit<SelectProps, 'name'> & {
  name?: string
  label?: string
  rules?: Rule[]
  placeholder?: string
  fieldError?: Record<string, string>
  setFieldError?: Dispatch<SetStateAction<Record<string, string>>>
}

export default function FormSelect({
  name,
  label,
  rules,
  placeholder,
  allowClear = true,
  fieldError = {},
  setFieldError,
  className,
  onChange,
  ...rest
}: FormSelectProps) {
  const control = (
    <Select
      className={['w-full', className].filter(Boolean).join(' ')}
      size="large"
      placeholder={placeholder}
      allowClear={allowClear}
      onChange={(value, option) => {
        if (name) setFieldError?.((prev) => ({ ...prev, [name]: '' }))
        onChange?.(value, option)
      }}
      {...rest}
    />
  )

  if (!name) {
    return control
  }

  return (
    <Form.Item name={name} label={label} rules={rules}>
      {control}
      {fieldError[name] ? <InputError>{fieldError[name]}</InputError> : null}
    </Form.Item>
  )
}
