import Spinner from './Spinner'

export default function Loader({ text = 'Loading' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 pt-24 pb-8 text-primary">
      <Spinner />
      {text ? <div className="text-lg font-medium text-text-muted">{text}</div> : null}
    </div>
  )
}
