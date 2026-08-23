import { useRef, useState } from 'react'
import { formatCurrency } from '@utils/formatters'

export interface ReceiptItem {
  medicineId: string
  medicineName: string
  barcode: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
}

export interface ReceiptData {
  invoiceNumber: string
  timestamp: string
  pharmacyName: string
  cashierName: string
  items: ReceiptItem[]
  subtotal: number
  taxAmount: number
  total: number
  amountReceived: number
  change: number
  paymentMethod: string
}

interface ReceiptProps {
  isOpen: boolean
  data: ReceiptData | null
  onClose: () => void
}

export default function Receipt({ isOpen, data, onClose }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  if (!isOpen || !data) return null

  const handlePrint = () => {
    setIsPrinting(true)
    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow && receiptRef.current) {
      const receiptHTML = receiptRef.current.innerHTML
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${data.invoiceNumber}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Courier New', monospace;
                background: white;
                padding: 20px;
              }
              .receipt {
                max-width: 400px;
                margin: 0 auto;
                padding: 20px;
              }
              @media print {
                body {
                  padding: 0;
                }
                .receipt {
                  max-width: 100%;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${receiptHTML}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
        setIsPrinting(false)
      }, 250)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-2xl z-50 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-primary-100 px-6 py-4">
            <h2 className="text-xl font-bold text-primary-700">Transaction Receipt</h2>
            <button
              onClick={onClose}
              className="text-primary-400 hover:text-primary-600 text-2xl font-bold transition-colors"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Receipt Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div ref={receiptRef} className="p-6 font-mono text-sm">
              {/* Receipt Header - Professional Style */}
              <div className="text-center mb-6 pb-4 border-b-2 border-primary-300">
                <h3 className="text-lg font-bold text-primary-700 mb-1">{data.pharmacyName}</h3>
                <p className="text-xs text-primary-600">Medicine Store POS System</p>
              </div>

              {/* Invoice Details */}
              <div className="mb-4 pb-4 border-b border-primary-200">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-primary-600">Invoice:</span>
                  <span className="font-bold text-primary-700">{data.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-primary-600">Date:</span>
                  <span className="text-primary-700">{formatDate(data.timestamp)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-primary-600">Time:</span>
                  <span className="text-primary-700">{formatTime(data.timestamp)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-primary-600">Cashier:</span>
                  <span className="text-primary-700">{data.cashierName}</span>
                </div>
              </div>

              {/* Items Header */}
              <div className="mb-2 pb-2 border-b border-primary-200">
                <div className="grid grid-cols-12 gap-1 text-xs font-bold text-primary-600">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-3 text-right">Price</div>
                  <div className="col-span-3 text-right">Total</div>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-4 space-y-2">
                {data.items.map((item, index) => (
                  <div key={`${item.medicineId}-${index}`} className="text-xs">
                    {/* Item Name and Barcode */}
                    <div className="mb-1">
                      <p className="font-bold text-primary-700 truncate">{item.medicineName}</p>
                      <p className="text-primary-500 text-xs">{item.barcode}</p>
                    </div>

                    {/* Item Details Grid */}
                    <div className="grid grid-cols-12 gap-1 text-primary-600">
                      <div className="col-span-4"></div>
                      <div className="col-span-2 text-right font-semibold">{item.quantity}</div>
                      <div className="col-span-3 text-right">{formatCurrency(item.unitPrice)}</div>
                      <div className="col-span-3 text-right font-bold text-primary-700">{formatCurrency(item.total)}</div>
                    </div>

                    {/* Tax Info if applicable */}
                    {item.taxRate > 0 && (
                      <div className="grid grid-cols-12 gap-1 text-xs text-primary-500 mt-0.5">
                        <div className="col-span-6"></div>
                        <div className="col-span-6 text-right">
                          Tax ({(item.taxRate * 100).toFixed(0)}%): {formatCurrency(item.total * item.taxRate)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-b-2 border-primary-300 my-4"></div>

              {/* Totals Section */}
              <div className="space-y-2 mb-4 text-xs">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span className="text-primary-600">Subtotal:</span>
                  <span className="text-primary-700">{formatCurrency(data.subtotal)}</span>
                </div>

                {/* Tax Amount */}
                {data.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-primary-600">Tax:</span>
                    <span className="text-primary-700">{formatCurrency(data.taxAmount)}</span>
                  </div>
                )}

                {/* Total (Highlighted) */}
                <div className="border-t border-primary-200 pt-2 mt-2 flex justify-between font-bold text-sm bg-primary-50 p-2 rounded">
                  <span className="text-primary-700">TOTAL:</span>
                  <span className="text-primary-700">{formatCurrency(data.total)}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b-2 border-primary-300 my-4"></div>

              {/* Payment Section */}
              <div className="space-y-2 mb-4 text-xs bg-green-50 p-3 rounded border border-green-200">
                <div className="flex justify-between">
                  <span className="text-primary-600">Payment Method:</span>
                  <span className="font-bold text-primary-700">{data.paymentMethod || 'Cash'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-600">Amount Received:</span>
                  <span className="font-bold text-primary-700">{formatCurrency(data.amountReceived)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-green-700">
                  <span>Change:</span>
                  <span>{formatCurrency(data.change)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-primary-600 space-y-1 pt-4 border-t border-primary-200">
                <p>Thank you for your purchase!</p>
                <p className="text-primary-500 text-xs">Please keep this receipt for your records</p>
                <p className="text-primary-400 text-xs mt-2">Generated by MyNeen POS System</p>
              </div>
            </div>
          </div>

          {/* Modal Footer - Action Buttons */}
          <div className="border-t border-primary-100 px-6 py-4 bg-primary-50 flex gap-3 no-print">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9m4 0h4m-2-2v2m0 0v2m0-6V9m0 4h.01" />
              </svg>
              {isPrinting ? 'Printing...' : 'Print'}
            </button>

            <button
              onClick={() => {
                // Copy to clipboard functionality
                if (receiptRef.current) {
                  const text = receiptRef.current.innerText
                  navigator.clipboard.writeText(text)
                  alert('Receipt copied to clipboard!')
                }
              }}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>

            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
