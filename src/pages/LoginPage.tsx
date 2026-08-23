import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { authService } from '@services/authService'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, selectedPharmacy, setSelectedPharmacy } = useAuthStore()
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!selectedPharmacy) {
        setError('Please select a pharmacy to continue')
        return
      }

      const response = await authService.login({
        userName,
        password,
        pharmacyId: selectedPharmacy.id,
      })

      login(response.user, response.token)
      
      // Redirect based on user role
      if (response.user.role === 'Pharmacist') {
        navigate('/pharmacist-dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePharmacy = () => {
    setSelectedPharmacy(null)
    navigate('/select-pharmacy')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-primary-500">PharmaCare POS</h1>
            <p className="text-gray-600">Pharmacy Management System</p>
            
            {/* Selected Pharmacy Display */}
            {selectedPharmacy && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A22.95 22.95 0 0110 15a22.95 22.95 0 01-8-1.308z" />
                </svg>
                <span className="font-medium text-primary-900">{selectedPharmacy.name}</span>
                <button
                  onClick={handleChangePharmacy}
                  className="ml-2 text-primary-600 hover:text-primary-800 underline text-xs"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" aria-live="assertive" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Enter password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary-500 px-4 py-2 text-white font-medium hover:bg-primary-600 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-center text-xs text-gray-500 mt-2">
              Sign in with your PharmaCare username and password.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
