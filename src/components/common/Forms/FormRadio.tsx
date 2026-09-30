import { Form, Radio } from 'antd'
import type { RadioGroupProps, RadioProps } from 'antd'
import type { Rule } from 'antd/es/form'
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react'
import InputError from './InputError'

type FormItemExtras = {
  name?: string
  label?: string
  rules?: Rule[]
  fieldError?: Record<string, string>
  setFieldError?: Dispatch<SetStateAction<Record<string, string>>>
}

type FormRadioProps = Omit<RadioProps, 'name'> &
  FormItemExtras & {
    children?: ReactNode
  }

function SingleRadio({
  name,
  label,
  rules,
  fieldError = {},
  setFieldError,
  children,
  className,
  onChange,
  ...rest
}: FormRadioProps) {
  const control = (
    <Radio
      className={className}
      onChange={(event) => {
        if (name) setFieldError?.((prev) => ({ ...prev, [name]: '' }))
        onChange?.(event)
      }}
      {...rest}
    >
      {children}
    </Radio>
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

type FormRadioGroupProps = Omit<RadioGroupProps, 'name'> & FormItemExtras

function RadioGroup({
  name,
  label,
  rules,
  fieldError = {},
  setFieldError,
  className,
  onChange,
  ...rest
}: FormRadioGroupProps) {
  const control = (
    <Radio.Group
      className={className}
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

type AppFormRadio = ComponentType<FormRadioProps> & {
  Group: typeof RadioGroup
  Button: typeof Radio.Button
}

const FormRadio = SingleRadio as AppFormRadio
FormRadio.Group = RadioGroup
FormRadio.Button = Radio.Button

export type { FormRadioProps, FormRadioGroupProps }
export default FormRadio
