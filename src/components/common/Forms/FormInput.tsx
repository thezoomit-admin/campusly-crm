import { Form, Input } from 'antd'
import type { Rule } from 'antd/es/form'
import type { InputProps, InputRef } from 'antd'
import type { PasswordProps } from 'antd/es/input/Password'
import type { SearchProps } from 'antd/es/input/Search'
import type { ChangeEvent, ComponentType, Dispatch, ReactElement, SetStateAction } from 'react'

function mergeClassName(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ')
}

type FormItemExtras = {
  name?: string | Array<string | number>
  label?: string
  rules?: Rule[]
  fieldError?: Record<string, string>
  setFieldError?: Dispatch<SetStateAction<Record<string, string>>>
  initialValue?: string | number
}

function wrapFormItem(extras: FormItemExtras, control: ReactElement) {
  const { name, label, rules, fieldError = {}, setFieldError, initialValue } = extras
  if (!name) return control

  const nameKey = Array.isArray(name) ? name.join('.') : name
  const errorMessage = fieldError[nameKey]

  return (
    <Form.Item
      name={name}
      label={label}
      rules={rules}
      initialValue={initialValue}
      help={errorMessage}
      validateStatus={errorMessage ? 'error' : undefined}
    >
      {control}
    </Form.Item>
  )
}

type FormInputProps = Omit<InputProps, 'name'> & FormItemExtras

function TextInput({
  name,
  label,
  rules,
  fieldError,
  setFieldError,
  initialValue,
  className,
  onChange,
  ...rest
}: FormInputProps) {
  const nameKey = name ? (Array.isArray(name) ? name.join('.') : name) : ''

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (nameKey) setFieldError?.((prev) => ({ ...prev, [nameKey]: '' }))
    onChange?.(event)
  }

  return wrapFormItem(
    { name, label, rules, fieldError, setFieldError, initialValue },
    <Input className={mergeClassName('w-full', className)} onChange={handleChange} {...rest} />,
  )
}

function PasswordInput({
  name,
  label,
  rules,
  fieldError,
  setFieldError,
  initialValue,
  className,
  onChange,
  ...rest
}: Omit<PasswordProps, 'name'> & FormItemExtras) {
  const nameKey = name ? (Array.isArray(name) ? name.join('.') : name) : ''

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (nameKey) setFieldError?.((prev) => ({ ...prev, [nameKey]: '' }))
    onChange?.(event)
  }

  return wrapFormItem(
    { name, label, rules, fieldError, setFieldError, initialValue },
    <Input.Password className={mergeClassName('w-full', className)} onChange={handleChange} {...rest} />,
  )
}

function SearchInput({
  name,
  label,
  rules,
  fieldError,
  setFieldError,
  initialValue,
  className,
  onChange,
  ...rest
}: Omit<SearchProps, 'name'> & FormItemExtras) {
  const nameKey = name ? (Array.isArray(name) ? name.join('.') : name) : ''

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (nameKey) setFieldError?.((prev) => ({ ...prev, [nameKey]: '' }))
    onChange?.(event)
  }

  return wrapFormItem(
    { name, label, rules, fieldError, setFieldError, initialValue },
    <Input.Search className={mergeClassName('w-full', className)} onChange={handleChange} {...rest} />,
  )
}

type AppFormInput = ComponentType<FormInputProps> & {
  Password: typeof PasswordInput
  Search: typeof SearchInput
}

const FormInput = TextInput as AppFormInput
FormInput.Password = PasswordInput
FormInput.Search = SearchInput

export type { FormInputProps, InputProps, InputRef, PasswordProps, SearchProps }
export default FormInput
