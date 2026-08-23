import { useAuthStore } from '@store/authStore'
import { useNavigate } from 'react-router-dom'
import OnlinePharmacistsMonitor from '@components/Common/OnlinePharmacistsMonitor'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm md:px-6">
      <div className="flex items-center justify-between">
        {/* Hamburger Menu Button - Mobile Only */}
        <button
          onClick={onMenuClick}
          className="inline-flex md:hidden items-center justify-center rounded-lg p-2 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-lg md:text-2xl font-bold text-gray-900">PharmaCare POS</h1>

        <div className="flex items-center gap-2 md:gap-4">
          <OnlinePharmacistsMonitor />
          <span className="hidden sm:inline text-sm text-gray-600">{user?.fullName || user?.userName}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-3 md:px-4 py-2 text-sm md:text-base text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

