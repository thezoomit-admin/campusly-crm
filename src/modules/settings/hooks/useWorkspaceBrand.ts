import { useAppSelector } from '@/redux/features/hooks'
import { selectAuthSession } from '@/redux/features/auth/authSlice'
import { useGetWorkspaceBrandQuery } from '../api/settingsApi'

const FALLBACK_NAME = 'EduConsult CRM'

export function useWorkspaceBrand() {
  const session = useAppSelector(selectAuthSession)
  const query = useGetWorkspaceBrandQuery(undefined, { skip: !session })
  const name = query.data?.name?.trim() || FALLBACK_NAME
  return {
    name,
    supportEmail: query.data?.supportEmail?.trim() || '',
    timezone: query.data?.timezone || 'Asia/Dhaka',
    currency: query.data?.currency || 'BDT',
    dateFormat: query.data?.dateFormat || 'DD MMM YYYY',
  }
}
