import { Form, InputNumber } from 'antd'
import type { InputNumberProps } from 'antd'
import type { Rule } from 'antd/es/form'
import type { Dispatch, SetStateAction } from 'react'
import InputError from './InputError'

type FormInputNumberProps = Omit<InputNumberProps, 'name'> & {
  name?: string
  label?: string
  rules?: Rule[]
  fieldError?: Record<string, string>
  setFieldError?: Dispatch<SetStateAction<Record<string, string>>>
}

export default function FormInputNumber({
  name,
  label,
  rules,
  fieldError = {},
  setFieldError,
  className,
  onChange,
  ...rest
}: FormInputNumberProps) {
  const control = (
    <InputNumber
      className={['!w-full', className].filter(Boolean).join(' ')}
      size="large"
      onChange={(value) => {
        if (name) setFieldError?.((prev) => ({ ...prev, [name]: '' }))
        onChange?.(value)
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

export type { FormInputNumberProps }
