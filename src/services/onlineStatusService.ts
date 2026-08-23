import { OnlineUser } from '@store/onlineUsersStore'
import { PHARMACIES } from '@config/pharmacyConfig'
import { getSupabaseClient } from '@lib/supabaseClient'

interface ProfileRow {
  id: string
  user_name: string
  full_name: string | null
  role: string
  is_active: boolean
  last_seen: string | null
  is_online: boolean | null
}

interface PharmacyMembershipRow {
  pharmacy_id: string
}

class OnlineStatusService {
  private pollInterval: NodeJS.Timeout | null = null
  private isPolling = false

  // Start polling for online status updates
  startPolling(callback: (users: OnlineUser[]) => void, interval: number = 30000) {
    if (this.isPolling) return

    this.isPolling = true
    this.fetchOnlineUsers().then(callback)

    this.pollInterval = setInterval(() => {
      this.fetchOnlineUsers().then(callback)
    }, interval)
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.isPolling = false
  }

  // Fetch online users from Supabase
  async fetchOnlineUsers(): Promise<OnlineUser[]> {
    try {
      const supabase = getSupabaseClient()
      
      console.log('Fetching online users from Supabase...')
      
      // Fetch all active profiles with their pharmacy memberships
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_name, full_name, role, is_active, last_seen, is_online')
        .eq('is_active', true)
        .in('role', ['Pharmacist', 'Cashier'])

      if (profilesError) throw profilesError

      console.log('Found profiles:', profiles?.length || 0)
      console.log('Profiles data:', profiles)

      const onlineUsers: OnlineUser[] = []

      // For each profile, fetch their pharmacy memberships
      for (const profile of (profiles as ProfileRow[])) {
        console.log(`Processing user: ${profile.user_name} (${profile.role})`)
        
        const { data: memberships, error: membershipError } = await supabase
          .from('pharmacy_memberships')
          .select('pharmacy_id')
          .eq('user_id', profile.id)

        if (membershipError) {
          console.error(`Failed to fetch memberships for user ${profile.id}:`, membershipError)
          continue
        }

        const membershipIds = (memberships as PharmacyMembershipRow[]).map(m => m.pharmacy_id)
        console.log(`User ${profile.user_name} has memberships:`, membershipIds)
        
        // Get pharmacy names for the user's memberships
        for (const pharmacyId of membershipIds) {
          const pharmacy = PHARMACIES.find(p => p.id === pharmacyId)
          console.log(`Looking for pharmacy ${pharmacyId} in config:`, pharmacy ? 'Found' : 'Not found')
          
          if (pharmacy) {
            // Determine if user is online (consider is_online flag and last_seen time)
            const lastSeenTime = profile.last_seen ? new Date(profile.last_seen) : new Date(0)
            const now = new Date()
            const minutesSinceLastSeen = (now.getTime() - lastSeenTime.getTime()) / (1000 * 60)
            
            // Consider user online if is_online is true AND last_seen was within 2 minutes
            // This is more conservative to avoid showing logged-out users as online
            const isOnline = profile.is_online === true && minutesSinceLastSeen < 2

            console.log(`User ${profile.user_name} - is_online: ${profile.is_online}, minutesSinceLastSeen: ${minutesSinceLastSeen.toFixed(2)}, final isOnline: ${isOnline}`)

            onlineUsers.push({
              id: profile.id,
              userName: profile.user_name,
              fullName: profile.full_name || undefined,
              role: profile.role as 'Admin' | 'Cashier' | 'Pharmacist',
              pharmacyId: pharmacyId,
              pharmacyName: pharmacy.name,
              lastSeen: profile.last_seen || now.toISOString(),
              isOnline: isOnline,
            })
          }
        }
      }

      console.log('Final online users list:', onlineUsers)
      return onlineUsers
    } catch (error) {
      console.error('Failed to fetch online users:', error)
      return []
    }
  }

  // Update user's online status in Supabase
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      console.log(`Setting user ${userId} online status to: ${isOnline}`)
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Failed to update online status:', error)
        throw error
      }
      console.log(`Successfully updated user ${userId} online status to: ${isOnline}`)
    } catch (error) {
      console.error('Failed to update online status:', error)
    }
  }

  // Update current user's last seen time (call this periodically)
  async updateLastSeen(userId: string): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('profiles')
        .update({ 
          last_seen: new Date().toISOString(),
          is_online: true
        })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to update last seen:', error)
    }
  }

  // Set user as offline when they logout
  async setUserOffline(userId: string): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to set user offline:', error)
    }
  }

  // Get users by role
  async getUsersByRole(role: 'Admin' | 'Cashier' | 'Pharmacist'): Promise<OnlineUser[]> {
    const allUsers = await this.fetchOnlineUsers()
    return allUsers.filter(user => user.role === role)
  }

  // Get users by pharmacy
  async getUsersByPharmacy(pharmacyId: string): Promise<OnlineUser[]> {
    const allUsers = await this.fetchOnlineUsers()
    return allUsers.filter(user => user.pharmacyId === pharmacyId)
  }

  // Get online count
  async getOnlineCount(role?: 'Admin' | 'Cashier' | 'Pharmacist'): Promise<number> {
    const users = role 
      ? await this.getUsersByRole(role)
      : await this.fetchOnlineUsers()
    return users.filter(user => user.isOnline).length
  }
}

export const onlineStatusService = new OnlineStatusService()