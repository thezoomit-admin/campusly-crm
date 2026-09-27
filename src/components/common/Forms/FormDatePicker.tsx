import { DatePicker, Form } from 'antd'
import type { DatePickerProps } from 'antd/es/date-picker'
import type { Rule } from 'antd/es/form'
import type { Dispatch, SetStateAction } from 'react'
import InputError from './InputError'

type FormDatePickerProps = DatePickerProps & {
  name: string
  label?: string
  rules?: Rule[]
  placeholder?: string
  fieldError?: Record<string, string>
  setFieldError?: Dispatch<SetStateAction<Record<string, string>>>
}

export default function FormDatePicker({
  name,
  label,
  rules,
  placeholder,
  fieldError = {},
  setFieldError,
  ...rest
}: FormDatePickerProps) {
  return (
    <Form.Item name={name} label={label} rules={rules}>
      <DatePicker
        size="large"
        style={{ width: '100%' }}
        format="YYYY-MM-DD"
        placeholder={placeholder}
        onChange={() => setFieldError?.((prev) => ({ ...prev, [name]: '' }))}
        {...rest}
      />
      {fieldError[name] ? <InputError>{fieldError[name]}</InputError> : null}
    </Form.Item>
  )
}
