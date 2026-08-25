import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { useState } from 'react'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  roles: string[]
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

// SVG Icon Components
const DashboardIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
    <path d="M3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
    <path d="M14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
  </svg>
)

const ShoppingCartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z" />
    <path d="M5 16a2 2 0 11-4 0 2 2 0 014 0z" />
    <path d="M16 16a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const PackageIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5zm8 0H7v10h6V5z" clipRule="evenodd" />
  </svg>
)

const ChartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 01-16 0zm10 0a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h2a2 2 0 012 2v2z" />
  </svg>
)

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM16.7 12.3a6 6 0 00-9.4 0M9 16a6 6 0 016 6H3a6 6 0 016-6z" />
  </svg>
)

const CurrencyDollarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
)

const WarehouseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
)

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, roles: ['Admin'] },
  { path: '/pharmacist-dashboard', label: 'Dashboard', icon: <DashboardIcon />, roles: ['Pharmacist'] },
  { path: '/pos', label: 'Sell Medicine', icon: <ShoppingCartIcon />, roles: ['Cashier', 'Pharmacist'] },
  { path: '/inventory', label: 'Inventory', icon: <PackageIcon />, roles: ['Admin', 'Pharmacist'] },
  { path: '/sales', label: 'Sales', icon: <ChartIcon />, roles: ['Admin', 'Pharmacist'] },
  { path: '/warehouse', label: 'Warehouse', icon: <WarehouseIcon />, roles: ['Admin'] },
  { path: '/expenses', label: 'Expenses', icon: <CurrencyDollarIcon />, roles: ['Admin'] },
  { path: '/profit-loss', label: 'Profit & Loss', icon: <TrendingUpIcon />, roles: ['Admin'] },
  { path: '/users', label: 'Users', icon: <UsersIcon />, roles: ['Admin'] },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false,
  )

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex border-r border-primary-600 bg-primary-500 text-white flex-col transition-all duration-300 h-screen ${
        isCollapsed ? 'w-16' : 'w-40'
      }`}>
        <div className="flex h-full flex-col">
          {/* Hamburger Button Section */}
          <div className="px-4 py-4 flex items-center justify-end border-b border-primary-600">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-lg p-2 hover:bg-primary-600 text-white"
              aria-label="Toggle sidebar collapse"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors justify-center md:justify-start ${
                  location.pathname === item.path
                    ? 'bg-primary-600 text-white'
                    : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                } ${isCollapsed ? 'px-2' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                <span className={`ml-3 text-sm font-medium ${isCollapsed ? 'hidden' : ''}`}>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className={`border-t border-primary-600 px-3 py-4 space-y-3 ${isCollapsed ? 'px-2' : ''}`}>
            {/* Logo Section */}
            {!isCollapsed && (
              <div className="bg-white rounded-lg p-2 mx-auto" style={{ width: '120px', height: '120px' }}>
                <img 
                  src="/logo.jpeg" 
                  alt="MyNeen Pharmacy" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMzMzQ3NUIiLz4KICA8dGV4dCB4PSI2MCIgeT0iNjAiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TXlOZWVuPC90ZXh0PgogIDx0ZXh0IHg9IjYwIiB5PSI4MCIgZm9udC1zaXplPSIxMSIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBoYXJtYWN5PC90ZXh0Pgo8L3N2Zz4='
                  }}
                />
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-4 py-3 text-primary-100 hover:bg-primary-600 hover:text-white rounded-lg transition-colors text-sm font-medium ${isCollapsed ? 'px-2 justify-center' : ''}`}
              title={isCollapsed ? 'Logout' : ''}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              <span className={`ml-3 ${isCollapsed ? 'hidden' : ''}`}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-40 border-r border-primary-600 bg-primary-500 text-white transition-transform duration-300 md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button */}
        <div className="flex items-center justify-end px-4 py-4 border-b border-primary-600">
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-primary-600"
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-600 text-white'
                  : 'text-primary-100 hover:bg-primary-600 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-primary-600 px-3 py-4 space-y-3">
          {/* Logo Section */}
          <div className="bg-white rounded-lg p-2 mx-auto" style={{ width: '120px', height: '120px' }}>
            <img 
              src="/logo.jpeg" 
              alt="MyNeen Pharmacy" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback if image doesn't load
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMzMzQ3NUIiLz4KICA8dGV4dCB4PSI2MCIgeT0iNjAiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TXlOZWVuPC90ZXh0PgogIDx0ZXh0IHg9IjYwIiB5PSI4MCIgZm9udC1zaXplPSIxMSIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBoYXJtYWN5PC90ZXh0Pgo8L3N2Zz4='
              }}
            />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-primary-100 hover:bg-primary-600 hover:text-white rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
