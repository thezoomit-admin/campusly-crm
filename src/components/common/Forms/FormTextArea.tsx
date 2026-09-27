import { Form } from 'antd'
import type { Rule } from 'antd/es/form'
import type { TextAreaProps } from 'antd/es/input'
import TextArea from 'antd/es/input/TextArea'
import type { Dispatch, SetStateAction } from 'react'
import InputError from './InputError'

type FormTextAreaProps = Omit<TextAreaProps, 'name'> & {
  name?: string
  size?: 'large' | 'small' | 'middle'
  label?: string
  rules?: Rule[]
  placeholder?: string
  fieldError?: Record<string, string>
  setFieldError?: Dispatch<SetStateAction<Record<string, string>>>
}

export default function FormTextArea({
  name,
  label,
  rules,
  size = 'large',
  placeholder,
  fieldError = {},
  setFieldError,
  className,
  onChange,
  ...rest
}: FormTextAreaProps) {
  const control = (
    <TextArea
      className={['w-full', className].filter(Boolean).join(' ')}
      size={size}
      placeholder={placeholder}
      onChange={(event) => {
        if (name) setFieldError?.((prev) => ({ ...prev, [name]: '' }))
        onChange?.(event)
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
