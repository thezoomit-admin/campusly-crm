import type { ReactNode } from 'react'

type PageHeaderCardProps = {
  icon?: ReactNode
  color:
    | 'primary'
    | 'green'
    | 'purple'
    | 'indigo'
    | 'cyan'
    | 'red'
    | 'yellow'
    | 'blue'
    | 'orange'
    | 'pink'
  title: string
  value: string | number
}

const colorMap: Record<string, { bg: string; border: string; iconBg: string; hoverBg: string }> = {
  primary: { bg: 'bg-cyan-50', border: 'border-cyan-200', iconBg: 'bg-cyan-400', hoverBg: 'hover:bg-cyan-100' },
  green: { bg: 'bg-green-50', border: 'border-green-200', iconBg: 'bg-green-400', hoverBg: 'hover:bg-green-100' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-400', hoverBg: 'hover:bg-purple-100' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', iconBg: 'bg-indigo-400', hoverBg: 'hover:bg-indigo-100' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', iconBg: 'bg-cyan-400', hoverBg: 'hover:bg-cyan-100' },
  red: { bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-400', hoverBg: 'hover:bg-red-100' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', iconBg: 'bg-yellow-400', hoverBg: 'hover:bg-yellow-100' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-400', hoverBg: 'hover:bg-blue-100' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-400', hoverBg: 'hover:bg-orange-100' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', iconBg: 'bg-pink-400', hoverBg: 'hover:bg-pink-100' },
}

export default function PageHeaderCard({ icon, color, title, value }: PageHeaderCardProps) {
  const colorClasses = colorMap[color] || colorMap.primary

  return (
    <div className="mb-6">
      <div
        className={`${colorClasses.bg} ${colorClasses.border} ${colorClasses.hoverBg} relative h-full cursor-pointer overflow-hidden rounded-lg border-2 p-4 transition-all duration-300 hover:shadow-md`}
      >
        <div className={`absolute top-0 right-0 h-14 w-14 ${colorClasses.iconBg} translate-x-8 -translate-y-8 rounded-full opacity-30`} />
        <div className="relative flex w-full items-center justify-between">
          <div className="flex-1">
            <p className="mb-1 text-sm font-medium tracking-wide text-text-muted uppercase">{title}</p>
            <h2 className="text-2xl font-bold text-text-strong">{value}</h2>
          </div>
          {icon ? (
            <div className={`${colorClasses.iconBg} flex h-10 w-10 items-center justify-center rounded-lg text-xl text-white`}>
              {icon}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
