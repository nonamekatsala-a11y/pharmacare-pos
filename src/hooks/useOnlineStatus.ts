import { useEffect, useRef } from 'react'
import { useAuthStore } from '@store/authStore'
import { onlineStatusService } from '@services/onlineStatusService'

/**
 * Hook to manage online status for the current user
 * Automatically updates last_seen timestamp and handles login/logout
 */
export function useOnlineStatus() {
  const { user, isAuthenticated } = useAuthStore()
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    console.log('useOnlineStatus effect triggered', { user: user?.userName, isAuthenticated })
    
    if (!user || !isAuthenticated) {
      console.log('Skipping online status - no user or not authenticated')
      return
    }

    console.log(`Setting up online status for user: ${user.userName} (${user.role})`)
    
    // Set user as online when they mount/log in
    onlineStatusService.updateOnlineStatus(user.id, true)
    userIdRef.current = user.id

    // Start heartbeat to keep user online
    const heartbeatInterval = setInterval(() => {
      console.log(`Heartbeat for user: ${user.userName}`)
      onlineStatusService.updateLastSeen(user.id)
    }, 2 * 60 * 1000) // Update every 2 minutes

    return () => {
      console.log(`Cleaning up online status for user: ${user.userName}`)
      // Cleanup: clear heartbeat and set user offline
      clearInterval(heartbeatInterval)
      if (userIdRef.current) {
        console.log(`Setting user ${userIdRef.current} offline in cleanup`)
        onlineStatusService.setUserOffline(userIdRef.current)
          .then(() => console.log(`Successfully set user ${userIdRef.current} offline`))
          .catch(err => console.error(`Failed to set user ${userIdRef.current} offline:`, err))
        userIdRef.current = null
      }
    }
  }, [user, isAuthenticated])

  // Additional effect to handle logout specifically
  useEffect(() => {
    if (!isAuthenticated && userIdRef.current) {
      console.log(`User logged out, setting ${userIdRef.current} offline`)
      onlineStatusService.setUserOffline(userIdRef.current)
        .then(() => console.log(`Successfully set user ${userIdRef.current} offline on logout`))
        .catch(err => console.error(`Failed to set user ${userIdRef.current} offline on logout:`, err))
      userIdRef.current = null
    }
  }, [isAuthenticated])
}