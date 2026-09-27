import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import { useDebounce } from '@/hooks/useDebounce'
import type { AppDispatch, RootState } from './store'

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

type DebouncedProps = {
  searchQuery: string
  delay: number
}

/** @deprecated Prefer `useDebounce` from `@/hooks/useDebounce`. */
export function useDebounced({ searchQuery, delay }: DebouncedProps) {
  return useDebounce(searchQuery, delay)
}
