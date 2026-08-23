import { getSupabaseClient } from '@lib/supabaseClient'
import type { User as AuthUser } from '@store/authStore'
import { ADMIN_ACCOUNT, PHARMACIES } from '@config/pharmacyConfig'
import { onlineStatusService } from './onlineStatusService'

interface PharmacyMembership {
  pharmacy_id: string
}

export interface LoginRequest {
  userName: string
  password: string
  pharmacyId?: string
}

export interface AuthResult {
  user: AuthUser
  token: string
}

const getUserFromSession = async (pharmacyId?: string): Promise<AuthResult> => {
  const supabase = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) throw sessionError
  if (!sessionData.session) throw new Error('Your session has expired. Please log in again.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_name, full_name, role, is_active')
    .eq('id', sessionData.session.user.id)
    .single()

  if (profileError) throw new Error('Your account profile is not configured in PharmaCare.')
  if (!profile.is_active) throw new Error('This account is inactive.')

  const { data: memberships, error: membershipError } = await supabase
    .from('pharmacy_memberships')
    .select('pharmacy_id')
    .eq('user_id', profile.id)

  if (membershipError) throw membershipError

  const membershipIds = (memberships as PharmacyMembership[] | null)?.map((membership) => membership.pharmacy_id) || []
  if (membershipIds.length === 0) {
    throw new Error('Your account is not assigned to a pharmacy.')
  }

  const isAdmin = profile.role === 'Admin'
  if (pharmacyId && !isAdmin && !membershipIds.includes(pharmacyId)) {
    throw new Error('This account is not assigned to the selected pharmacy.')
  }

  const activePharmacyId = pharmacyId && (isAdmin || membershipIds.includes(pharmacyId))
    ? pharmacyId
    : membershipIds[0]
  const pharmacy = PHARMACIES.find((item) => item.id === activePharmacyId)

  if (!pharmacy) throw new Error('Your assigned pharmacy is not configured in the web app.')

  return {
    user: {
      id: profile.id,
      userName: profile.user_name || sessionData.session.user.email || profile.id,
      email: sessionData.session.user.email || '',
      role: profile.role as AuthUser['role'],
      fullName: profile.full_name || undefined,
      pharmacyId: activePharmacyId,
    },
    token: sessionData.session.access_token,
  }
}

const resolveAuthEmail = (userName: string): string => {
  const normalizedUserName = userName.trim().toLowerCase()
  if (normalizedUserName.includes('@')) return normalizedUserName
  if (normalizedUserName === ADMIN_ACCOUNT.userName) {
    return import.meta.env.VITE_ADMIN_AUTH_EMAIL || ADMIN_ACCOUNT.email
  }

  const pharmacist = PHARMACIES.find(
    (pharmacy) => pharmacy.pharmacist.userName.toLowerCase() === normalizedUserName,
  )
  return pharmacist?.pharmacist.email || `${normalizedUserName}@pharmacare.local`
}

export const authService = {
  login: async (request: LoginRequest): Promise<AuthResult> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: resolveAuthEmail(request.userName),
      password: request.password,
    })

    if (error) throw new Error(error.message)
    try {
      const authResult = await getUserFromSession(request.pharmacyId)
      // Set user as online when they login
      await onlineStatusService.updateOnlineStatus(authResult.user.id, true)
      return authResult
    } catch (profileError) {
      await supabase.auth.signOut()
      throw profileError
    }
  },

  logout: async (): Promise<void> => {
    const supabase = getSupabaseClient()
    const { data } = await supabase.auth.getSession()
    
    // Set user offline before logout
    if (data.session?.user) {
      console.log(`Setting user ${data.session.user.id} offline during logout`)
      await onlineStatusService.setUserOffline(data.session.user.id)
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getCurrentUser: async (pharmacyId?: string): Promise<AuthResult | null> => {
    const supabase = getSupabaseClient()
    const { data } = await supabase.auth.getSession()
    if (!data.session) return null
    return getUserFromSession(pharmacyId)
  },

  changePassword: async (_oldPassword: string, newPassword: string): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
}
