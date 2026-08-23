import { Sale } from '@services/saleService'
import { formatCurrency, formatDateTime } from './formatters'

export const exportToCSV = (sales: Sale[], filename: string = 'sales-export') => {
  if (sales.length === 0) {
    alert('No sales data to export')
    return
  }

  const headers = [
    'Invoice Number',
    'Date',
    'Items Count',
    'Subtotal',
    'Discount',
    'Tax',
    'Total',
    'Payment Method',
    'Status',
    'Customer ID',
  ]

  const rows = sales.map((sale) => [
    sale.invoiceNumber,
    formatDateTime(sale.saleDate),
    sale.items.length.toString(),
    sale.subtotal.toFixed(2),
    sale.discount.toFixed(2),
    sale.tax.toFixed(2),
    sale.total.toFixed(2),
    sale.paymentMethod,
    sale.status,
    sale.customerId || 'N/A',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportSalesDetailsToCSV = (sales: Sale[], filename: string = 'sales-details-export') => {
  if (sales.length === 0) {
    alert('No sales data to export')
    return
  }

  const headers = [
    'Invoice Number',
    'Sale Date',
    'Medicine ID',
    'Quantity',
    'Unit Price',
    'Line Total',
    'Payment Method',
    'Status',
  ]

  const rows: string[][] = []

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      rows.push([
        sale.invoiceNumber,
        formatDateTime(sale.saleDate),
        item.medicineId,
        item.quantity.toString(),
        item.unitPrice.toFixed(2),
        item.lineTotal.toFixed(2),
        sale.paymentMethod,
        sale.status,
      ])
    })
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToPDF = async (sales: Sale[]) => {
  // For PDF export, we would typically use a library like jsPDF or react-pdf
  // For now, we'll create a simple print-friendly HTML view
  if (sales.length === 0) {
    alert('No sales data to export')
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to export PDF')
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { margin-bottom: 20px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Sales Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Sales: ${sales.length}</p>
        <p>Total Revenue: ${formatCurrency(sales.reduce((sum, s) => sum + s.total, 0))}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Items</th>
            <th>Subtotal</th>
            <th>Discount</th>
            <th>Tax</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${sales
            .map(
              (sale) => `
            <tr>
              <td>${sale.invoiceNumber}</td>
              <td>${formatDateTime(sale.saleDate)}</td>
              <td>${sale.items.length}</td>
              <td>${formatCurrency(sale.subtotal)}</td>
              <td>${sale.discount > 0 ? formatCurrency(sale.discount) : '-'}</td>
              <td>${formatCurrency(sale.tax)}</td>
              <td>${formatCurrency(sale.total)}</td>
              <td>${sale.paymentMethod}</td>
              <td>${sale.status}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>MyNeen Medicine Store - Sales Report</p>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.focus()
  
  // Wait for the content to load then print
  setTimeout(() => {
    printWindow.print()
  }, 500)
}