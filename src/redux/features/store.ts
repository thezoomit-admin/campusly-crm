import { configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist'
import { baseApi } from '../api/baseApi'
import { reducer } from './rootReducer'

/** Module APIs register into baseApi via injectEndpoints. */
import '@/modules/leads/api/leadsApi'
import '@/modules/applications/api/applicationsApi'
import '@/modules/students/api/studentsApi'
import '@/modules/documents/api/documentsApi'
import '@/modules/payments/api/paymentsApi'
import '@/modules/follow-ups/api/followUpsApi'
import '@/modules/reports/api/reportsApi'
import '@/modules/dashboard/api/dashboardApi'

export const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['baseApi'],
      },
    }).concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const persistor = persistStore(store)
