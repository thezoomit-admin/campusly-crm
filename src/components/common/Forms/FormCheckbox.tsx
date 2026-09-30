import { Checkbox, Form } from 'antd'
import type { CheckboxProps } from 'antd'
import type { CheckboxGroupProps } from 'antd/es/checkbox'
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

type FormCheckboxProps = Omit<CheckboxProps, 'name'> &
  FormItemExtras & {
    children?: ReactNode
  }

function SingleCheckbox({
  name,
  label,
  rules,
  fieldError = {},
  setFieldError,
  children,
  className,
  onChange,
  ...rest
}: FormCheckboxProps) {
  const control = (
    <Checkbox
      className={className}
      onChange={(event) => {
        if (name) setFieldError?.((prev) => ({ ...prev, [name]: '' }))
        onChange?.(event)
      }}
      {...rest}
    >
      {children}
    </Checkbox>
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

type FormCheckboxGroupProps = Omit<CheckboxGroupProps, 'name'> & FormItemExtras

function CheckboxGroup({
  name,
  label,
  rules,
  fieldError = {},
  setFieldError,
  className,
  onChange,
  ...rest
}: FormCheckboxGroupProps) {
  const control = (
    <Checkbox.Group
      className={className}
      onChange={(checkedValue) => {
        if (name) setFieldError?.((prev) => ({ ...prev, [name]: '' }))
        onChange?.(checkedValue)
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

type AppFormCheckbox = ComponentType<FormCheckboxProps> & {
  Group: typeof CheckboxGroup
}

const FormCheckbox = SingleCheckbox as AppFormCheckbox
FormCheckbox.Group = CheckboxGroup

export type { FormCheckboxProps, FormCheckboxGroupProps }
export default FormCheckbox
