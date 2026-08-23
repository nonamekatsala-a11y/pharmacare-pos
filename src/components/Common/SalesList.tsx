import { useState } from 'react'
import { Sale } from '@services/saleService'
import { formatCurrency, formatDateTime } from '@utils/formatters'
import Button from './Button'

interface SalesListProps {
  sales: Sale[]
  onView?: (sale: Sale) => void
  onRefund?: (sale: Sale) => void
  onPrintReceipt?: (sale: Sale) => void
}

type SortField = 'invoiceNumber' | 'saleDate' | 'total' | 'paymentMethod' | 'status'
type SortDirection = 'asc' | 'desc'

export default function SalesList({
  sales,
  onView,
  onRefund,
  onPrintReceipt,
}: SalesListProps) {
  const [sortField, setSortField] = useState<SortField>('saleDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter and sort sales
  const filteredAndSortedSales = sales
    .filter((sale) => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        sale.invoiceNumber.toLowerCase().includes(searchLower) ||
        sale.paymentMethod.toLowerCase().includes(searchLower) ||
        sale.status.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'invoiceNumber':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber)
          break
        case 'saleDate':
          comparison = new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()
          break
        case 'total':
          comparison = a.total - b.total
          break
        case 'paymentMethod':
          comparison = a.paymentMethod.localeCompare(b.paymentMethod)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by invoice number, payment method, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedSales.length} of {sales.length} sales
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('invoiceNumber')}
              >
                Invoice # <SortIcon field="invoiceNumber" />
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('saleDate')}
              >
                Date <SortIcon field="saleDate" />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Items</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subtotal</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Discount</th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total')}
              >
                Total <SortIcon field="total" />
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('paymentMethod')}
              >
                Payment <SortIcon field="paymentMethod" />
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon field="status" />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedSales.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No sales match your search' : 'No sales found'}
                </td>
              </tr>
            ) : (
              filteredAndSortedSales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-900">
                    {sale.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(sale.saleDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{sale.items.length} items</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(sale.subtotal)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sale.discount > 0 ? `-${formatCurrency(sale.discount)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.paymentMethod}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        sale.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onView?.(sale)}
                    >
                      View
                    </Button>
                    {onPrintReceipt && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onPrintReceipt(sale)}
                      >
                        Receipt
                      </Button>
                    )}
                    {onRefund && sale.status === 'Completed' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onRefund(sale)}
                      >
                        Refund
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
