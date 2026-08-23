import { useState, useEffect } from 'react'
import { useOnlineUsersStore, OnlineUser } from '@store/onlineUsersStore'
import { onlineStatusService } from '@services/onlineStatusService'
import { useAuthStore } from '@store/authStore'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import PeopleIcon from '@mui/icons-material/People'
import CloseIcon from '@mui/icons-material/Close'

export default function OnlinePharmacistsMonitor() {
  const { user } = useAuthStore()
  const { onlineUsers, isLoading, setOnlineUsers } = useOnlineUsersStore()
  const [isOpen, setIsOpen] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    // Only start polling for admin users
    if (user?.role === 'Admin') {
      console.log('Starting online monitoring for admin user')
      
      // Initial fetch
      onlineStatusService.getUsersByRole('Pharmacist').then(users => {
        const pharmacists = users as OnlineUser[]
        console.log('Initial pharmacists fetch:', pharmacists)
        setOnlineUsers(pharmacists)
        setOnlineCount(pharmacists.filter(u => u.isOnline).length)
      }).catch(error => {
        console.error('Failed to fetch initial pharmacists:', error)
      })

      // Start polling
      onlineStatusService.startPolling(async (users) => {
        const pharmacists = users.filter(u => u.role === 'Pharmacist')
        console.log('Polled pharmacists:', pharmacists)
        setOnlineUsers(pharmacists)
        setOnlineCount(pharmacists.filter(u => u.isOnline).length)
      }, 30000) // Poll every 30 seconds

      return () => {
        console.log('Stopping online monitoring')
        onlineStatusService.stopPolling()
      }
    } else {
      console.log('Not starting monitoring - user is not admin:', user?.role)
    }
  }, [user, setOnlineUsers])

  // Don't render for non-admin users
  if (user?.role !== 'Admin') {
    return null
  }

  const onlinePharmacists = onlineUsers.filter(u => u.isOnline)
  const offlinePharmacists = onlineUsers.filter(u => !u.isOnline)

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  return (
    <div className="relative">
      {/* Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
      >
        <PeopleIcon fontSize="small" />
        <span className="hidden sm:inline">Online Pharmacists</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
          {onlineCount}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg bg-white shadow-lg border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="font-semibold text-gray-900">Online Pharmacists</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  Loading...
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No pharmacists found
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Online Pharmacists */}
                  {onlinePharmacists.length > 0 && (
                    <div className="p-2">
                      <p className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase">
                        Online ({onlinePharmacists.length})
                      </p>
                      {onlinePharmacists.map((pharmacist) => (
                        <div
                          key={pharmacist.id}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
                        >
                          <div className="relative">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-medium text-sm">
                              {pharmacist.fullName?.charAt(0) || pharmacist.userName.charAt(0)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
                              <FiberManualRecordIcon
                                fontSize="small"
                                className="text-green-500"
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {pharmacist.fullName || pharmacist.userName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {pharmacist.pharmacyName || 'Unknown Pharmacy'}
                            </p>
                          </div>
                          <div className="text-xs text-green-600">
                            Active
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Offline Pharmacists */}
                  {offlinePharmacists.length > 0 && (
                    <div className="p-2">
                      <p className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase">
                        Offline ({offlinePharmacists.length})
                      </p>
                      {offlinePharmacists.map((pharmacist) => (
                        <div
                          key={pharmacist.id}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 opacity-75"
                        >
                          <div className="relative">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium text-sm">
                              {pharmacist.fullName?.charAt(0) || pharmacist.userName.charAt(0)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
                              <FiberManualRecordIcon
                                fontSize="small"
                                className="text-gray-400"
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {pharmacist.fullName || pharmacist.userName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {pharmacist.pharmacyName || 'Unknown Pharmacy'}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatLastSeen(pharmacist.lastSeen)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
              <p className="text-xs text-gray-500 text-center">
                {onlineCount} of {onlineUsers.length} pharmacists online
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}