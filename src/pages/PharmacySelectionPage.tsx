import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { PHARMACIES } from '@config/pharmacyConfig'
import type { Pharmacy } from '@config/pharmacyConfig'

export default function PharmacySelectionPage() {
  const navigate = useNavigate()
  const { setSelectedPharmacy } = useAuthStore()
  const [selectedPharmacy, setSelectedPharmacyState] = useState<Pharmacy | null>(null)

  const handlePharmacySelect = (pharmacy: Pharmacy) => {
    setSelectedPharmacyState(pharmacy)
  }

  const handleContinue = () => {
    if (selectedPharmacy) {
      setSelectedPharmacy(selectedPharmacy)
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img 
              src="/logo.jpeg" 
              alt="PharmaCare POS" 
              className="w-24 h-24 object-contain mx-auto"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIGZpbGw9IiMzMzQ3NUIiIHJ4PSI4Ii8+CiAgPHRleHQgeD0iNDgiIHk9IjQ4IiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk15TmVlbjwvdGV4dD4KICA8dGV4dCB4PSI0OCIgeT0iNjQiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QaGFybWFjeTwvdGV4dD4KPC9zdmc+'
              }}
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-2">Welcome to PharmaCare POS</h1>
          <p className="text-lg text-primary-600">Select your pharmacy to continue</p>
        </div>

        {/* Pharmacy Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {PHARMACIES.map((pharmacy) => (
            <button
              key={pharmacy.id}
              onClick={() => handlePharmacySelect(pharmacy)}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                selectedPharmacy?.id === pharmacy.id
                  ? 'border-primary-500 bg-primary-50 shadow-lg ring-2 ring-primary-500 ring-offset-2'
                  : 'border-primary-200 bg-white hover:border-primary-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  selectedPharmacy?.id === pharmacy.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-primary-100 text-primary-600'
                }`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A22.95 22.95 0 0110 15a22.95 22.95 0 01-8-1.308z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary-900 text-sm md:text-base break-words">
                    {pharmacy.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{pharmacy.pharmacist.fullName}</span>
                  </div>
                  {selectedPharmacy?.id === pharmacy.id && (
                    <div className="mt-2 flex items-center gap-1 text-primary-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium">Selected</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedPharmacy}
            className="px-8 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Continue to Login
          </button>
          <p className="mt-4 text-sm text-primary-600">
            Select your pharmacy location to access the system
          </p>
          <p className="mt-2 text-xs text-primary-500">
            Each pharmacy has a dedicated pharmacist account
          </p>
        </div>
      </div>
    </div>
  )
}
