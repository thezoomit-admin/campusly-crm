import { Breadcrumb, Divider, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const { Title } = Typography

export type PageHeaderBreadcrumb = {
  title: string
  path?: string
}

type PageHeaderProps = {
  title: string
  subtitle?: string
  breadcrumbs?: PageHeaderBreadcrumb[]
  extra?: ReactNode
  showDivider?: boolean
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  extra,
  showDivider = true,
}: PageHeaderProps) {
  return (
    <div className="mb-0">
      {breadcrumbs.length > 0 ? (
        <Breadcrumb
          className="mb-2"
          items={breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            return {
              title:
                item.path && !isLast ? (
                  <Link to={item.path}>{item.title}</Link>
                ) : (
                  <span className={isLast ? 'font-medium text-primary' : undefined}>{item.title}</span>
                ),
            }
          })}
        />
      ) : null}
      <div className="flex w-full flex-row items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Title level={4} className="!mb-0 !text-text max-[960px]:!text-[1.15rem] max-[960px]:!leading-snug">
            {title}
          </Title>
          {subtitle ? (
            <p className="mt-1 mb-0 text-sm text-text-muted max-[960px]:text-[0.78rem] max-[960px]:leading-snug">
              {subtitle}
            </p>
          ) : null}
        </div>
        {extra ? (
          <div className="mt-0 flex shrink-0 flex-wrap items-start justify-end gap-2">{extra}</div>
        ) : null}
      </div>
      {showDivider ? <Divider className="my-4" /> : null}
    </div>
  )
}
