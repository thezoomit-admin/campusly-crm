import { Wave } from '@/components/ui'

export default function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-page-bg text-primary">
      <Wave className="h-12 w-24" />
    </div>
  )
}
