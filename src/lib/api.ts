/** Build a query string from defined string values. */
export function toQuery(params: Record<string, string | undefined | null>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const data = (err as { data?: unknown }).data
    if (data && typeof data === 'object') {
      const body = data as { error?: string; message?: string }
      if (typeof body.error === 'string' && body.error.trim()) return body.error
      if (typeof body.message === 'string' && body.message.trim()) return body.message
    }
  }
  return fallback
}

/** Statuses already toasted globally by `baseApi` — skip local duplicate toasts. */
export function isGloballyToastedApiError(err: unknown): boolean {
  if (!err || typeof err !== 'object' || !('status' in err)) {
    return false
  }
  const status = (err as { status: unknown }).status
  return status === 401 || status === 403 || status === 404 || status === 409
}

export function getApiErrorFields(err: unknown): Record<string, string> {
  if (err && typeof err === 'object') {
    const data = (err as { data?: unknown }).data
    if (data && typeof data === 'object') {
      const fields = (data as { fields?: unknown }).fields
      if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
        return fields as Record<string, string>
      }
    }
  }
  return {}
}
