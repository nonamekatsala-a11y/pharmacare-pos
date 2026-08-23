import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@store/authStore'
import { authService } from '@services/authService'
import { isSupabaseConfigured, supabase } from '@lib/supabaseClient'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import { useOnlineStatus } from './hooks/useOnlineStatus'

// Pages
import PharmacySelectionPage from '@pages/PharmacySelectionPage'
import LoginPage from '@pages/LoginPage'
import DashboardPage from '@pages/DashboardPage'
import PharmacistDashboardPage from '@pages/PharmacistDashboardPage'
import POSPage from '@pages/POSPage'
import InventoryPage from '@pages/InventoryPage'
import SalesPage from '@pages/SalesPage'
import ExpensesPage from '@pages/ExpensesPage'
import WarehousePage from '@pages/WarehousePage'
import ProfitLossPage from '@pages/ProfitLossPage'
import CustomersPage from '@pages/CustomersPage'
import UsersPage from '@pages/UsersPage'

// Components
import MainLayout from '@components/Layout/MainLayout'

function App() {
  const { isAuthenticated, selectedPharmacy, user } = useAuthStore()
  const login = useAuthStore((state) => state.login)
  const clearAuthentication = useAuthStore((state) => state.clearAuthentication)
  const logout = useAuthStore((state) => state.logout)
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Hook to manage online status
  useOnlineStatus()

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsInitializing(false)
      return
    }

    let isMounted = true

    const restoreSession = async () => {
      try {
        const result = await authService.getCurrentUser(selectedPharmacy?.id)
        if (isMounted && result) login(result.user, result.token)
      } catch (error) {
        console.error('Failed to restore Supabase session:', error)
        if (isMounted) logout()
      } finally {
        if (isMounted) setIsInitializing(false)
      }
    }

    void restoreSession()
    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'SIGNED_OUT' && isMounted) clearAuthentication()
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (isInitializing) {
    return <div className="flex min-h-screen items-center justify-center bg-primary-50 text-primary-600">Loading session...</div>
  }

  // Determine initial redirect
  const getInitialRoute = () => {
    if (!selectedPharmacy) return '/select-pharmacy'
    if (!isAuthenticated) return '/login'
    if (user?.role === 'Admin') return '/dashboard'
    if (user?.role === 'Pharmacist') return '/pharmacist-dashboard'
    return '/dashboard'
  }

  return (
    <Router>
      <Routes>
        {/* Pharmacy Selection - First page */}
        <Route path="/select-pharmacy" element={<PharmacySelectionPage />} />

        {/* Public Routes */}
        <Route path="/login" element={selectedPharmacy ? <LoginPage /> : <Navigate to="/select-pharmacy" replace />} />

        {/* Protected Routes */}
        {isAuthenticated ? (
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pharmacist-dashboard" element={<PharmacistDashboardPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/warehouse" element={<WarehousePage />} />
            <Route path="/profit-loss" element={<ProfitLossPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/" element={<Navigate to={getInitialRoute()} replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to={getInitialRoute()} replace />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
