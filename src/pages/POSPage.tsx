import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicineService, Medicine } from '@services/medicineService'
import { saleService } from '@services/saleService'
import { useAuthStore } from '@store/authStore'
import { useCartStore } from '@store/cartStore'
import { PHARMACIES } from '@config/pharmacyConfig'
import MedicineSelector from '@components/POS/MedicineSelector'
import Cart from '@components/POS/Cart'
import Receipt, { ReceiptData, ReceiptItem } from '@components/POS/Receipt'

export default function POSPage() {
  const navigate = useNavigate()
  const { user, selectedPharmacy } = useAuthStore()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')

  const { items: cartItems, clearCart, getSubtotal, getTax, getTotal } = useCartStore()

  // Prevent admins from accessing POS
  useEffect(() => {
    if (user && user.role === 'Admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      loadMedicines()
    }
  }, [user])

  const loadMedicines = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await medicineService.getAll()
      setMedicines(data)
    } catch (error) {
      console.error('Failed to load medicines:', error)
      setError('Failed to load medicines. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = async (amountReceived: number) => {
    if (cartItems.length === 0 || !user) {
      setError('Cart is empty or user not authenticated')
      return
    }

    if (amountReceived < getTotal()) {
      setError('Insufficient amount received')
      return
    }

    try {
      setError(null)

      const invoiceNumber = `INV-${Date.now()}`
      const subtotal = getSubtotal()
      const tax = getTax()
      const total = getTotal()
      const change = amountReceived - total

      // Create checkout request
      const checkoutRequest = {
        items: cartItems.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        invoiceNumber,
        saleDate: new Date().toISOString(),
        amountReceived,
        paymentMethod: 'Cash' as const,
        customerId: selectedCustomer || undefined,
      }

      await saleService.create(checkoutRequest)

      // Reload medicines to get updated quantities
      await loadMedicines()

      // Create receipt data
      const receiptItems: ReceiptItem[] = cartItems.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        barcode: item.barcode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        total: item.total,
      }))

      const newReceiptData: ReceiptData = {
        invoiceNumber,
        timestamp: new Date().toISOString(),
        pharmacyName: selectedPharmacy?.name || PHARMACIES.find((pharmacy) => pharmacy.id === user.pharmacyId)?.name || 'Pharmacy',
        cashierName: user.fullName || user.userName || 'Cashier',
        items: receiptItems,
        subtotal,
        taxAmount: tax,
        total,
        amountReceived,
        change: Math.max(0, change),
        paymentMethod: 'Cash',
      }

      setReceiptData(newReceiptData)
      setIsReceiptOpen(true)
      setSuccessMessage('Sale completed successfully!')
      clearCart()

      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Checkout failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete sale. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-600">Loading medicines...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-primary-50 overflow-hidden flex flex-col">
      {/* Receipt Modal */}
      <Receipt
        isOpen={isReceiptOpen}
        data={receiptData}
        onClose={() => {
          setIsReceiptOpen(false)
          setReceiptData(null)
        }}
      />

      {/* Notifications */}
      {successMessage && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed top-6 right-6 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {error}
        </div>
      )}

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile/Tablet: Stacked Layout with Scrolling */}
        <div className="lg:hidden h-full flex flex-col gap-4 p-4">
          {/* Medicine Selector - Larger */}
          <div className="bg-white rounded-2xl border border-primary-100 p-4 min-h-64 overflow-y-auto">
            <MedicineSelector medicines={medicines} isLoading={isLoading} />
          </div>
          
          {/* Cart - Smaller */}
          <div className="flex-1 bg-white rounded-2xl border border-primary-100 p-4 min-h-0">
            <Cart 
              onCheckout={handleCheckout}
              selectedCustomer={selectedCustomer}
              onCustomerChange={setSelectedCustomer}
            />
          </div>
        </div>

        {/* Desktop: Side-by-Side Layout */}
        <div className="hidden lg:grid grid-cols-[minmax(500px,1.5fr)_24px_minmax(450px,1fr)] h-full gap-0 p-6 max-w-[1920px] mx-auto w-full">
          {/* Left Panel: Medicine Selector */}
          <div className="bg-white rounded-2xl border border-primary-100 p-6 overflow-y-auto min-h-0">
            <MedicineSelector medicines={medicines} isLoading={isLoading} />
          </div>

          {/* Gap */}
          <div></div>

          {/* Right Panel: Cart */}
          <div className="bg-white rounded-2xl border border-primary-100 p-6 overflow-y-auto min-h-0 flex flex-col">
            <Cart 
              onCheckout={handleCheckout}
              selectedCustomer={selectedCustomer}
              onCustomerChange={setSelectedCustomer}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
