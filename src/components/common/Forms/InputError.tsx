import type { HTMLAttributes, ReactNode } from 'react'

type InputErrorProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
}

export default function InputError({ children, className = '', ...rest }: InputErrorProps) {
  return (
    <span {...rest} className={`block text-[13px] text-red-500 ${className}`.trim()}>
      {children}
    </span>
  )
}
