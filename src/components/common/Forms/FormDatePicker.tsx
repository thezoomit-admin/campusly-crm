import { DatePicker, Form } from 'antd'
import type { DatePickerProps, RangePickerProps } from 'antd/es/date-picker'
import type { Rule } from 'antd/es/form'
import type { Dayjs } from 'dayjs'
import type { ComponentType, Dispatch, SetStateAction } from 'react'
import InputError from './InputError'

type FormItemExtras = {
  name?: string
  label?: string
  rules?: Rule[]
  fieldError?: Record<string, string>
  setFieldError?: Dispatch<SetStateAction<Record<string, string>>>
}

type FormDatePickerProps = Omit<DatePickerProps<Dayjs, false>, 'name'> & FormItemExtras

function SingleDatePicker({
  name,
  label,
  rules,
  placeholder,
  fieldError = {},
  setFieldError,
  className,
  onChange,
  ...rest
}: FormDatePickerProps) {
  const control = (
    <DatePicker
      className={['w-full', className].filter(Boolean).join(' ')}
      size="large"
      style={{ width: '100%' }}
      format="YYYY-MM-DD"
      placeholder={placeholder}
      onChange={(date, dateString) => {
        if (name) setFieldError?.((prev) => ({ ...prev, [name]: '' }))
        onChange?.(date, dateString)
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

type FormRangePickerProps = Omit<RangePickerProps, 'name'> & FormItemExtras

function RangeDatePicker({
  name,
  label,
  rules,
  fieldError = {},
  setFieldError,
  className,
  onChange,
  ...rest
}: FormRangePickerProps) {
  const control = (
    <DatePicker.RangePicker
      className={['w-full', className].filter(Boolean).join(' ')}
      size="large"
      style={{ width: '100%' }}
      format="YYYY-MM-DD"
      onChange={(dates, dateStrings) => {
        if (name) setFieldError?.((prev) => ({ ...prev, [name]: '' }))
        onChange?.(dates, dateStrings)
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

type AppFormDatePicker = ComponentType<FormDatePickerProps> & {
  Range: typeof RangeDatePicker
}

const FormDatePicker = SingleDatePicker as AppFormDatePicker
FormDatePicker.Range = RangeDatePicker

export type { FormDatePickerProps, FormRangePickerProps }
export default FormDatePicker
