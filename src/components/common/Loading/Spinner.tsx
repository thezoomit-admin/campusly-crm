export default function Spinner() {
  return (
    <div className="grid place-items-center text-primary" role="status">
      <span
        className="size-10 rounded-full border-2 border-current border-r-transparent animate-spin"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}
