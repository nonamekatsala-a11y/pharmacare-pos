import { useState, useEffect } from 'react'
import { customerService, Customer } from '@services/index'
import Button from '@components/Common/Button'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      const data = await customerService.getAll()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading customers...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">Manage customer information and loyalty</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600">+ Add Customer</Button>
      </div>

      <div className="rounded-lg bg-white shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Credit Balance</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Loyalty Points</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{customer.fullName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{customer.phone || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{customer.email || '-'}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">K{customer.creditBalance}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{customer.loyaltyPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
