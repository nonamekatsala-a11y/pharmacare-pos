import { useState, useEffect } from 'react'
import Button from '@components/Common/Button'
import Modal from '@components/Common/Modal'
import { getSupabaseClient } from '@lib/supabaseClient'
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
  const [isAddingUser, setIsAddingUser] = useState(false)
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
    setEditingUser(user)
    setIsAddingUser(false)
    setSuccessMessage('')
    setErrorMessage('')
    setFormData({ userName: user.userName, email: user.email, fullName: user.fullName || '', role: user.role, isActive: user.isActive, newPassword: '', pharmacyId: user.pharmacyIds[0] || '' })
    setShowModal(true)
  }

  const openAddUser = () => {
    setEditingUser(null)
    setIsAddingUser(true)
    setSuccessMessage('')
    setErrorMessage('')
    setFormData({ userName: '', email: '', fullName: '', role: 'Cashier', isActive: true, newPassword: '', pharmacyId: '' })
    setShowModal(true)
  }

  const handleSaveUser = async () => {
    setErrorMessage('')
    try {
      if (isAddingUser) {
        // Create new user
        if (!formData.userName.trim() || !formData.email.trim() || !formData.newPassword.trim()) {
          setErrorMessage('Username, email, and password are required for new users')
          return
        }

        // Create user via Supabase auth
        const { data: authData, error: authError } = await getSupabaseClient().auth.signUp({
          email: formData.email.trim(),
          password: formData.newPassword.trim(),
          options: {
            data: {
              user_name: formData.userName.trim(),
              full_name: formData.fullName.trim() || null,
              role: formData.role,
            },
          },
        })

        if (authError) {
          throw new Error(authError.message || 'Failed to create user')
        }

        // Assign pharmacy for pharmacists
        if (formData.role === 'Pharmacist' && formData.pharmacyId) {
          const { error: membershipError } = await getSupabaseClient().rpc('reassign_pharmacist', {
            target_user_id: authData.user.id,
            target_pharmacy_id: formData.pharmacyId,
          })
          if (membershipError) {
            throw new Error(`Failed to assign pharmacist to pharmacy: ${membershipError.message}`)
          }
        }

        setSuccessMessage('User created successfully!')
      } else {
        // Edit existing user
        if (!editingUser) return

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

        setSuccessMessage('User updated successfully!')
      }

      setShowModal(false)
      setEditingUser(null)
      setIsAddingUser(false)
      await loadUsers()
    } catch (error) {
      console.error('Failed to save user:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save user')
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
        <Button onClick={openAddUser} variant="primary">
          Add User
        </Button>
      </div>

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
                    <Button onClick={() => openEditUser(user)} size="sm" variant="secondary">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal isOpen={showModal} title={isAddingUser ? "Add User" : "Edit User"} onClose={() => { setShowModal(false); setEditingUser(null); setIsAddingUser(false); setSuccessMessage(''); setErrorMessage('') }}>
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
              disabled={!isAddingUser}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              disabled={!isAddingUser}
            />
            <input
              type="text"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="Cashier">Cashier</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="Admin">Admin</option>
            </select>
            {formData.role === 'Pharmacist' && (
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
              placeholder={isAddingUser ? "Password (required)" : "New password (optional)"}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <p className="text-xs text-gray-500">
              {isAddingUser ? "Password must be at least 6 characters." : "An admin can change this user's password directly. Use at least 6 characters."}
            </p>
            {!isAddingUser && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                Active account
              </label>
            )}
            <div className="flex gap-3">
              <Button onClick={handleSaveUser} className="flex-1 bg-blue-500 hover:bg-blue-600">
                {isAddingUser ? 'Create User' : 'Save Changes'}
              </Button>
              <Button onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 hover:bg-gray-400">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
