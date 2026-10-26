import { useEffect, useState } from 'react'

/**
 * False until this component's effects have run.
 * Call it in the same component as the list query and keep child option
 * queries skipped until it is true. Child effects run before the parent, so
 * without this gate the option requests occupy the connection pool first and
 * the list request waits.
 */
export function useEnableAfterListQuery() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  return ready
}
