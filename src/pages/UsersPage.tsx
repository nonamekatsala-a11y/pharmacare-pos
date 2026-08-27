import { useState, useEffect } from 'react'
import Button from '@components/Common/Button'
import Modal from '@components/Common/Modal'
import { createSignUpClient, getSupabaseClient } from '@lib/supabaseClient'
import { PHARMACIES } from '@config/pharmacyConfig'

interface User {
  id: string
  userName: string
  email: string
  fullName?: string
  role: 'Admin' | 'Cashier' | 'Pharmacist'
  isActive: boolean
  pharmacies: string[]
  pharmacyIds: string[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isCreatingPharmacist, setIsCreatingPharmacist] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    fullName: '',
    role: 'Cashier' as User['role'],
    isActive: true,
    newPassword: '',
    pharmacyId: '',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_name, email, full_name, role, is_active, pharmacy_memberships(pharmacy_id)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers((data || []).map((profile) => {
        const row = profile as {
          id: string
          user_name: string | null
          email: string | null
          full_name: string | null
          role: User['role']
          is_active: boolean
          pharmacy_memberships: Array<{ pharmacy_id: string }>
        }
        return {
          id: row.id,
          userName: row.user_name || '-',
          email: row.email || '-',
          fullName: row.full_name || undefined,
          role: row.role,
          isActive: row.is_active,
          pharmacyIds: (row.pharmacy_memberships || []).map((membership) => membership.pharmacy_id),
          pharmacies: (row.pharmacy_memberships || []).map((membership) =>
            PHARMACIES.find((pharmacy) => pharmacy.id === membership.pharmacy_id)?.name || membership.pharmacy_id,
          ),
        }
      }))
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditUser = (user: User) => {
    setIsCreatingPharmacist(false)
    setEditingUser(user)
    setSuccessMessage('')
    setErrorMessage('')
    setFormData({ userName: user.userName, email: user.email, fullName: user.fullName || '', role: user.role, isActive: user.isActive, newPassword: '', pharmacyId: user.pharmacyIds[0] || '' })
    setShowModal(true)
  }

  const openCreatePharmacist = () => {
    setEditingUser(null)
    setIsCreatingPharmacist(true)
    setSuccessMessage('')
    setErrorMessage('')
    setFormData({ userName: '', email: '', fullName: '', role: 'Pharmacist', isActive: true, newPassword: '', pharmacyId: '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setIsCreatingPharmacist(false)
    setSuccessMessage('')
    setErrorMessage('')
  }

  const handleCreatePharmacist = async () => {
    const userName = formData.userName.trim()
    const email = formData.email.trim().toLowerCase()
    const fullName = formData.fullName.trim()
    const password = formData.newPassword.trim()

    if (!email || !email.includes('@')) {
      setErrorMessage('Enter a valid email address for the pharmacist.')
      return
    }
    if (!userName || !fullName || !password || password.length < 6 || !formData.pharmacyId) {
      setErrorMessage('Username, full name, password (at least 6 characters), and pharmacy are required.')
      return
    }

    setErrorMessage('')
    setIsSaving(true)
    const supabase = getSupabaseClient()
    try {
      const { data, error } = await createSignUpClient().auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, user_name: userName } },
      })
      if (error) {
        if (!error.message.toLowerCase().includes('already registered')) throw error

        const { error: repairError } = await supabase.rpc('repair_pharmacist_profile', {
          target_email: email,
          target_user_name: userName,
          target_full_name: fullName,
          target_pharmacy_id: formData.pharmacyId,
        })
        if (repairError) {
          throw new Error(`${repairError.message}. Apply repair_pharmacist_profile.sql in Supabase if this function is missing.`)
        }
      } else {
        if (!data.user) throw new Error('The pharmacist account could not be created.')

        const { error: createError } = await supabase.rpc('create_pharmacist', {
          target_user_id: data.user.id,
          target_email: email,
          target_user_name: userName,
          target_full_name: fullName,
          target_pharmacy_id: formData.pharmacyId,
        })
        if (createError) {
          if (!['42883', 'PGRST202'].includes(createError.code || '')) throw createError

          const { error: profileError } = await supabase.rpc('admin_update_user', {
            target_user_id: data.user.id,
            target_user_name: userName,
            target_full_name: fullName,
            target_role: 'Pharmacist',
            target_is_active: true,
          })
          if (profileError) throw profileError

          const { error: membershipError } = await supabase.rpc('reassign_pharmacist', {
            target_user_id: data.user.id,
            target_pharmacy_id: formData.pharmacyId,
          })
          if (membershipError) throw membershipError
        }
      }

      setSuccessMessage('Pharmacist account created successfully.')
      await loadUsers()
      closeModal()
    } catch (error) {
      console.error('Failed to create pharmacist:', error)
      const message = error instanceof Error ? error.message : 'Failed to create pharmacist'
      setErrorMessage(message.toLowerCase().includes('already registered')
        ? 'This email already has an account. Use a different email or edit the existing user.'
        : message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    setErrorMessage('')
    setIsSaving(true)
    try {
      const { error } = await getSupabaseClient().rpc('admin_update_user', {
        target_user_id: editingUser.id,
        target_user_name: formData.userName.trim(),
        target_full_name: formData.fullName.trim() || null,
        target_role: formData.role,
        target_is_active: formData.isActive,
      })
      if (error) throw error

      if (formData.newPassword.trim()) {
        const currentUser = await getSupabaseClient().auth.getUser()
        if (currentUser.data.user?.id === editingUser.id) {
          const { error: passwordError } = await getSupabaseClient().auth.updateUser({
            password: formData.newPassword,
          })
          if (passwordError) {
            const functionError = passwordError as { context?: Response; message?: string }
            let message = functionError.message || 'Failed to change the user password.'
            if (functionError.context) {
              try {
                const responseBody = await functionError.context.json() as { error?: string }
                message = responseBody.error || message
              } catch {
                // Keep the SDK error when the function response is not JSON.
              }
            }
            throw new Error(message)
          }
        } else {
          const { error: passwordError } = await getSupabaseClient().functions.invoke('admin-update-password', {
            body: {
              userId: editingUser.id,
              password: formData.newPassword,
            },
          })
          if (passwordError) {
            const functionError = passwordError as { context?: Response; message?: string }
            let message = functionError.message || 'Failed to change the user password.'
            if (functionError.context) {
              try {
                const responseBody = await functionError.context.json() as { error?: string }
                message = responseBody.error || message
              } catch {
                // Keep the SDK error when the function response is not JSON.
              }
            }
            throw new Error(message)
          }
          setSuccessMessage('The user password was changed successfully.')
        }
      }

      if (formData.role === 'Pharmacist' && formData.pharmacyId) {
        const { error: membershipError } = await getSupabaseClient().rpc('reassign_pharmacist', {
          target_user_id: editingUser.id,
          target_pharmacy_id: formData.pharmacyId,
        })
        if (membershipError) {
          throw new Error(`Failed to reassign pharmacist: ${membershipError.message}`)
        }
      }

      if (!formData.newPassword.trim()) {
        setShowModal(false)
        setEditingUser(null)
      }
      await loadUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePharmacist = async (user: User) => {
    if (user.role !== 'Pharmacist') return
    if (!window.confirm(`Delete pharmacist ${user.fullName || user.userName}? This cannot be undone.`)) return

    setErrorMessage('')
    setDeletingUserId(user.id)
    try {
      const { error } = await getSupabaseClient().rpc('delete_pharmacist', {
        target_user_id: user.id,
      })
      if (error) throw error
      setSuccessMessage('Pharmacist deleted successfully.')
      await loadUsers()
    } catch (error) {
      console.error('Failed to delete pharmacist:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete pharmacist')
    } finally {
      setDeletingUserId(null)
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading users...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">Manage system users and permissions</p>
        </div>
        <Button onClick={openCreatePharmacist} className="bg-blue-500 hover:bg-blue-600">
          Add Pharmacist
        </Button>
      </div>

      {errorMessage && !showModal && (
        <div role="alert" aria-live="assertive" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}
      {successMessage && !showModal && (
        <div role="status" aria-live="polite" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      <div className="rounded-lg bg-white shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Username</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Full Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pharmacy</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.userName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.fullName || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.pharmacies.length > 0 ? user.pharmacies.join(', ') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button onClick={() => openEditUser(user)} size="sm" variant="secondary">
                        Edit
                      </Button>
                      {user.role === 'Pharmacist' && (
                        <Button
                          onClick={() => handleDeletePharmacist(user)}
                          size="sm"
                          variant="danger"
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (editingUser || isCreatingPharmacist) && (
        <Modal isOpen={showModal} title={isCreatingPharmacist ? 'Add Pharmacist' : 'Edit User'} onClose={closeModal}>
          <div className="space-y-4">
            {errorMessage && (
              <div role="alert" aria-live="assertive" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                {successMessage}
              </div>
            )}
            <input
              type="text"
              placeholder="Username"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            {isCreatingPharmacist ? (
              <input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            ) : (
              <input type="text" value={editingUser?.email || ''} disabled className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-gray-500" />
            )}
            <input
              type="text"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            {!isCreatingPharmacist && <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="Cashier">Cashier</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="Admin">Admin</option>
            </select>}
            {(isCreatingPharmacist || formData.role === 'Pharmacist') && (
              <select
                value={formData.pharmacyId}
                onChange={(e) => setFormData({ ...formData, pharmacyId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="">Select pharmacy</option>
                {PHARMACIES.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>
                ))}
              </select>
            )}
            <input
              type="password"
              placeholder={isCreatingPharmacist ? 'Password' : 'New password (optional)'}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <p className="text-xs text-gray-500">Use at least 6 characters.</p>
            {!isCreatingPharmacist && <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
              Active account
            </label>}
            <div className="flex gap-3">
              <Button onClick={isCreatingPharmacist ? handleCreatePharmacist : handleSaveUser} disabled={isSaving} className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving ? 'Saving...' : isCreatingPharmacist ? 'Create Pharmacist' : 'Save Changes'}
              </Button>
              <Button onClick={closeModal} disabled={isSaving} className="flex-1 bg-gray-300 hover:bg-gray-400">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
