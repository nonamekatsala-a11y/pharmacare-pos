import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface OnlineUser {
  id: string
  userName: string
  fullName?: string
  role: 'Admin' | 'Cashier' | 'Pharmacist'
  pharmacyId?: string
  pharmacyName?: string
  lastSeen: string
  isOnline: boolean
}

interface OnlineUsersStore {
  onlineUsers: OnlineUser[]
  isLoading: boolean
  error: string | null
  setOnlineUsers: (users: OnlineUser[]) => void
  addOnlineUser: (user: OnlineUser) => void
  removeOnlineUser: (userId: string) => void
  updateUserStatus: (userId: string, isOnline: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useOnlineUsersStore = create<OnlineUsersStore>()(
  devtools(
    (set) => ({
      onlineUsers: [],
      isLoading: false,
      error: null,
      setOnlineUsers: (users) => set({ onlineUsers: users }),
      addOnlineUser: (user) => set((state) => ({ 
        onlineUsers: [...state.onlineUsers.filter(u => u.id !== user.id), user] 
      })),
      removeOnlineUser: (userId) => set((state) => ({ 
        onlineUsers: state.onlineUsers.filter(u => u.id !== userId) 
      })),
      updateUserStatus: (userId, isOnline) => set((state) => ({
        onlineUsers: state.onlineUsers.map(u => 
          u.id === userId ? { ...u, isOnline, lastSeen: new Date().toISOString() } : u
        )
      })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'online-users-store',
    },
  ),
)