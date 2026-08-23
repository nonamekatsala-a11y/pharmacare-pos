import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Pharmacy } from '@config/pharmacyConfig'

export interface User {
  id: string
  userName: string
  email: string
  role: 'Admin' | 'Cashier' | 'Pharmacist'
  fullName?: string
  pharmacyId?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  selectedPharmacy: Pharmacy | null
  login: (user: User, token: string) => void
  clearAuthentication: () => void
  logout: () => void
  setUser: (user: User) => void
  setSelectedPharmacy: (pharmacy: Pharmacy | null) => void
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        selectedPharmacy: null,
        login: (user, token) =>
          set({
            user,
            token,
            isAuthenticated: true,
          }),
        clearAuthentication: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          }),
        logout: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            selectedPharmacy: null,
          }),
        setUser: (user) =>
          set({
            user,
          }),
        setSelectedPharmacy: (pharmacy) =>
          set({
            selectedPharmacy: pharmacy,
          }),
      }),
      {
        name: 'auth-store',
      },
    ),
  ),
)
