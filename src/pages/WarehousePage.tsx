import { useState, useEffect } from 'react'
import { warehouseService, WarehouseItem, Allocation } from '@services/warehouseService'
import { PHARMACIES } from '@config/pharmacyConfig'
import Button from '@components/Common/Button'
import Modal from '@components/Common/Modal'
import { formatCurrency, formatDate } from '@utils/formatters'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PrintIcon from '@mui/icons-material/Print'
import jsPDF from 'jspdf'

export default function WarehousePage() {
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inventory' | 'allocations'>('inventory')
  
  // Summary data
  const [warehouseSummary, setWarehouseSummary] = useState<any>(null)
  const [allocationSummary, setAllocationSummary] = useState<any>(null)

  // Modal states
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false)
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState<WarehouseItem | null>(null)
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [isUpdatePriceModalOpen, setIsUpdatePriceModalOpen] = useState(false)
  const [restockQuantity, setRestockQuantity] = useState('')
  const [restockMessage, setRestockMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [updatePriceFormData, setUpdatePriceFormData] = useState({
    purchasePrice: '',
    sellingPrice: '',
  })
  const [updatePriceMessage, setUpdatePriceMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'item' | 'allocation'
    id: string
    name: string
  } | null>(null)

  const [clearConfirmation, setClearConfirmation] = useState<{
    type: 'warehouse' | 'sales' | 'all'
  } | null>(null)

  // Message states
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [allocateMessage, setAllocateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form data
  const [addItemFormData, setAddItemFormData] = useState({
    medicineName: '',
    totalQuantity: '',
    purchasePrice: '',
    sellingPrice: '',
    expiryDate: '',
    reorderLevel: '',
  })

  const [allocateFormData, setAllocateFormData] = useState({
    pharmacyId: '',
    quantity: '',
    notes: '',
  })

  // Report states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [items, allocs, warehouseSumm, allocationSumm] = await Promise.all([
        warehouseService.getAllItems(),
        warehouseService.getAllAllocations(),
        warehouseService.getWarehouseSummary(),
        warehouseService.getAllocationSummary(),
      ])
      setWarehouseItems(items)
      setAllocations(allocs)
      setWarehouseSummary(warehouseSumm)
      setAllocationSummary(allocationSumm)
    } catch (error) {
      console.error('Failed to load warehouse data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddMessage(null)
    try {
      await warehouseService.addItem({
        medicineId: '', // Will be generated in service
        medicineName: addItemFormData.medicineName,
        totalQuantity: parseInt(addItemFormData.totalQuantity),
        purchasePrice: parseFloat(addItemFormData.purchasePrice),
        sellingPrice: parseFloat(addItemFormData.sellingPrice),
        expiryDate: addItemFormData.expiryDate || undefined,
        reorderLevel: parseInt(addItemFormData.reorderLevel),
      } as any)

      setAddItemFormData({
        medicineName: '',
        totalQuantity: '',
        purchasePrice: '',
        sellingPrice: '',
        expiryDate: '',
        reorderLevel: '',
      })
      setAddMessage({ type: 'success', text: 'Item added to warehouse successfully!' })
      loadData()
      setTimeout(() => {
        setIsAddItemModalOpen(false)
        setAddMessage(null)
      }, 1500)
    } catch (error) {
      console.error('Failed to add item:', error)
      setAddMessage({ type: 'error', text: 'Failed to add item to warehouse' })
    }
  }

  const handleAddWarehouseStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWarehouseItem) return
    setRestockMessage(null)

    try {
      await warehouseService.addStock(selectedWarehouseItem.id, parseInt(restockQuantity, 10))
      setRestockQuantity('')
      setSelectedWarehouseItem(null)
      setIsRestockModalOpen(false)
      await loadData()
    } catch (error: any) {
      console.error('Failed to add warehouse stock:', error)
      setRestockMessage({ type: 'error', text: error.message || 'Failed to add stock' })
    }
  }

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWarehouseItem) return
    setUpdatePriceMessage(null)

    try {
      await warehouseService.updateItem(selectedWarehouseItem.id, {
        purchasePrice: parseFloat(updatePriceFormData.purchasePrice),
        sellingPrice: parseFloat(updatePriceFormData.sellingPrice),
      })
      setUpdatePriceFormData({ purchasePrice: '', sellingPrice: '' })
      setSelectedWarehouseItem(null)
      setIsUpdatePriceModalOpen(false)
      setUpdatePriceMessage({ type: 'success', text: 'Price updated successfully!' })
      await loadData()
      setTimeout(() => {
        setUpdatePriceMessage(null)
      }, 1500)
    } catch (error: any) {
      console.error('Failed to update price:', error)
      setUpdatePriceMessage({ type: 'error', text: error.message || 'Failed to update price' })
    }
  }

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWarehouseItem) return
    setAllocateMessage(null)

    try {
      const pharmacy = PHARMACIES.find(p => p.id === allocateFormData.pharmacyId)
      if (!pharmacy) {
        setAllocateMessage({ type: 'error', text: 'Please select a pharmacy' })
        return
      }

      await warehouseService.createAllocation({
        warehouseItemId: selectedWarehouseItem.id,
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        medicineName: selectedWarehouseItem.medicineName,
        quantity: parseInt(allocateFormData.quantity),
        allocatedDate: new Date().toISOString().split('T')[0],
        status: 'Completed',
        allocatedBy: 'admin',
        notes: allocateFormData.notes,
      })

      setAllocateFormData({
        pharmacyId: '',
        quantity: '',
        notes: '',
      })
      setSelectedWarehouseItem(null)
      setAllocateMessage({ type: 'success', text: 'Allocation request created successfully!' })
      loadData()
      setTimeout(() => {
        setIsAllocateModalOpen(false)
        setAllocateMessage(null)
      }, 1500)
    } catch (error: any) {
      console.error('Failed to create allocation:', error)
      setAllocateMessage({ type: 'error', text: error.message || 'Failed to create allocation' })
    }
  }

  const handleDeleteAllocation = async (allocationId: string) => {
    const allocation = allocations.find((entry) => entry.id === allocationId)
    setDeleteConfirmation({
      type: 'allocation',
      id: allocationId,
      name: allocation?.medicineName || 'this allocation',
    })
  }

  const handleDeleteWarehouseItem = async (itemId: string) => {
    const item = warehouseItems.find((entry) => entry.id === itemId)
    setDeleteConfirmation({
      type: 'item',
      id: itemId,
      name: item?.medicineName || 'this warehouse item',
    })
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return

    try {
      if (deleteConfirmation.type === 'allocation') {
        await warehouseService.deleteAllocation(deleteConfirmation.id)
      } else {
        await warehouseService.deleteItem(deleteConfirmation.id)
      }
      setDeleteConfirmation(null)
      await loadData()
    } catch (error) {
      console.error('Failed to delete warehouse record:', error)
    }
  }

  const handleClearAll = () => {
    setClearConfirmation({ type: 'all' })
  }

  const confirmClear = async () => {
    if (!clearConfirmation) return

    try {
      console.log('Starting clear operation for:', clearConfirmation.type)
      
      if (clearConfirmation.type === 'all') {
        await warehouseService.clearAllData()
      }
      
      console.log('Clear operation completed, reloading page...')
      setClearConfirmation(null)
      
      // Force complete page reload to clear all cached data
      setTimeout(() => {
        window.location.href = window.location.href
      }, 500)
    } catch (error) {
      console.error('Failed to clear data:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-blue-100 text-blue-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Report generation functions
  const generatePDFReport = () => {
    const report = generateWarehouseReport()
    const doc = new jsPDF()
    
    // Colors
    const primaryColor: [number, number, number] = [51, 71, 91] // RGB for #33475B
    const accentColor: [number, number, number] = [59, 130, 246] // RGB for blue
    const grayColor: [number, number, number] = [107, 114, 128] // RGB for gray
    
    let yPos = 20
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(...primaryColor)
    doc.text('Warehouse Management Report', 20, yPos)
    yPos += 10
    
    doc.setFontSize(10)
    doc.setTextColor(...grayColor)
    doc.text(`Generated: ${formatDate(report.reportDate.generated)}`, 20, yPos)
    yPos += 6
    
    if (report.reportDate.period === 'Date Range') {
      doc.text(`Period: ${formatDate(report.reportDate.startDate)} to ${formatDate(report.reportDate.endDate)}`, 20, yPos)
    } else {
      doc.text(`Period: ${report.reportDate.period}`, 20, yPos)
    }
    yPos += 15
    
    // Executive Summary
    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text('Executive Summary', 20, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.setTextColor(...grayColor)
    doc.text(`Total Items: ${report.summary.totalItems}`, 20, yPos)
    yPos += 6
    doc.text(`Total Stock: ${report.summary.totalQuantity}`, 20, yPos)
    yPos += 6
    doc.text(`Available Stock: ${report.summary.availableQuantity}`, 20, yPos)
    yPos += 6
    doc.text(`Allocated Stock: ${report.summary.allocatedQuantity}`, 20, yPos)
    yPos += 6
    doc.text(`Total Allocations: ${report.summary.totalAllocations}`, 20, yPos)
    yPos += 6
    doc.text(`Low Stock Items: ${report.summary.lowStockCount}`, 20, yPos)
    yPos += 6
    doc.text(`Expiring Items: ${report.summary.expiringCount}`, 20, yPos)
    yPos += 15
    
    // Financial Overview
    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text('Financial Overview', 20, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.setTextColor(...grayColor)
    doc.text(`Total Purchase Value: ${formatCurrency(report.financial.totalPurchaseValue)}`, 20, yPos)
    yPos += 6
    doc.text(`Total Potential Revenue: ${formatCurrency(report.financial.totalPotentialRevenue)}`, 20, yPos)
    yPos += 6
    doc.text(`Total Allocated Value: ${formatCurrency(report.financial.totalAllocatedValue)}`, 20, yPos)
    yPos += 6
    doc.setFontSize(11)
    doc.setTextColor(...accentColor)
    doc.text(`Gross Profit Potential: ${formatCurrency(report.financial.grossProfit)}`, 20, yPos)
    yPos += 15
    
    // Allocation by Pharmacy
    if (report.allocationByPharmacy.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(...primaryColor)
      doc.text('Allocation by Pharmacy', 20, yPos)
      yPos += 8
      
      // Table header
      doc.setFontSize(9)
      doc.setTextColor(...primaryColor)
      doc.text('Pharmacy', 20, yPos)
      doc.text('Quantity', 100, yPos)
      doc.text('Items', 130, yPos)
      doc.text('Value', 160, yPos)
      yPos += 6
      
      // Table content
      doc.setFontSize(9)
      doc.setTextColor(...grayColor)
      report.allocationByPharmacy.forEach((pharmacy: any) => {
        doc.text(pharmacy.pharmacyName, 20, yPos)
        doc.text(String(pharmacy.totalQuantity), 100, yPos)
        doc.text(String(pharmacy.totalItems), 130, yPos)
        doc.text(formatCurrency(pharmacy.allocationValue), 160, yPos)
        yPos += 6
      })
      yPos += 10
    }
    
    // Low Stock Alert
    if (report.lowStockItems.length > 0) {
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(14)
      doc.setTextColor(220, 38, 38) // Red
      doc.text(`Low Stock Alert (${report.lowStockItems.length} items)`, 20, yPos)
      yPos += 8
      
      doc.setFontSize(9)
      doc.setTextColor(...grayColor)
      report.lowStockItems.forEach((item: any) => {
        doc.text(`${item.medicineName} - ${item.availableQuantity}/${item.reorderLevel}`, 20, yPos)
        yPos += 5
      })
      yPos += 10
    }
    
    // Expiring Items Alert
    if (report.expiringItems.length > 0) {
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(14)
      doc.setTextColor(234, 179, 8) // Yellow
      doc.text(`Expiring Soon (${report.expiringItems.length} items)`, 20, yPos)
      yPos += 8
      
      doc.setFontSize(9)
      doc.setTextColor(...grayColor)
      report.expiringItems.forEach((item: any) => {
        doc.text(`${item.medicineName} - ${item.daysUntilExpiry} days`, 20, yPos)
        yPos += 5
      })
      yPos += 10
    }
    
    // Top Medicines
    if (yPos > 180) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text('Top Medicines by Quantity', 20, yPos)
    yPos += 8
    
    doc.setFontSize(9)
    doc.setTextColor(...grayColor)
    report.topMedicineByQuantity.forEach((item: any, index: number) => {
      doc.text(`${index + 1}. ${item.medicineName} - ${item.totalQuantity}`, 20, yPos)
      yPos += 5
    })
    yPos += 10
    
    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text('Top Medicines by Value', 20, yPos)
    yPos += 8
    
    doc.setFontSize(9)
    doc.setTextColor(...grayColor)
    report.topMedicineByValue.forEach((item: any, index: number) => {
      doc.text(`${index + 1}. ${item.medicineName} - ${formatCurrency(item.purchasePrice * item.totalQuantity)}`, 20, yPos)
      yPos += 5
    })
    
    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(...grayColor)
      doc.text(
        `PharmaCare Warehouse Report - Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      )
    }
    
    // Save the PDF
    const fileName = `warehouse-report-${report.reportDate.generated}.pdf`
    doc.save(fileName)
  }

  const generateWarehouseReport = () => {
    const today = new Date().toISOString().split('T')[0]
    const startDate = reportDateRange.startDate || today
    const endDate = reportDateRange.endDate || today

    // Filter allocations by date range
    const filteredAllocations = allocations.filter(
      alloc => alloc.allocatedDate >= startDate && alloc.allocatedDate <= endDate
    )

    // Calculate allocation metrics by pharmacy
    const allocationByPharmacy = PHARMACIES.map(pharmacy => {
      const pharmacyAllocations = filteredAllocations.filter(
        alloc => alloc.pharmacyId === pharmacy.id
      )
      const totalQuantity = pharmacyAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0)
      const totalItems = pharmacyAllocations.length
      
      // Calculate value of allocations
      const allocationValue = pharmacyAllocations.reduce((sum, alloc) => {
        const item = warehouseItems.find(item => item.id === alloc.warehouseItemId)
        return sum + (item ? item.purchasePrice * alloc.quantity : 0)
      }, 0)

      return {
        pharmacyName: pharmacy.name,
        totalQuantity,
        totalItems,
        allocationValue,
        allocations: pharmacyAllocations
      }
    }).filter(pharmacy => pharmacy.totalItems > 0)

    // Calculate allocation metrics by medicine
    const allocationByMedicine = filteredAllocations.reduce((acc, alloc) => {
      if (!acc[alloc.medicineName]) {
        acc[alloc.medicineName] = {
          medicineName: alloc.medicineName,
          totalQuantity: 0,
          totalAllocations: 0,
          pharmacies: []
        }
      }
      acc[alloc.medicineName].totalQuantity += alloc.quantity
      acc[alloc.medicineName].totalAllocations += 1
      if (!acc[alloc.medicineName].pharmacies.includes(alloc.pharmacyName)) {
        acc[alloc.medicineName].pharmacies.push(alloc.pharmacyName)
      }
      return acc
    }, {} as Record<string, any>)

    // Low stock analysis
    const lowStockItems = warehouseItems.filter(
      item => item.availableQuantity <= (item.reorderLevel || 0)
    )

    // Expiry analysis
    const expiringItems = warehouseItems.filter(item => {
      if (!item.expiryDate) return false
      const expiryDate = new Date(item.expiryDate)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 90 // Items expiring within 90 days
    }).map(item => ({
      ...item,
      daysUntilExpiry: Math.ceil((new Date(item.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))

    // Financial analysis
    const totalPurchaseValue = warehouseItems.reduce(
      (sum, item) => sum + (item.purchasePrice * item.totalQuantity), 0
    )
    const totalPotentialRevenue = warehouseItems.reduce(
      (sum, item) => sum + (item.sellingPrice * item.availableQuantity), 0
    )
    const totalAllocatedValue = warehouseItems.reduce(
      (sum, item) => sum + (item.purchasePrice * item.allocatedQuantity), 0
    )

    // Stock movement analysis
    const totalStockIn = filteredAllocations.reduce((sum, alloc) => {
      const item = warehouseItems.find(item => item.id === alloc.warehouseItemId)
      return sum + (item ? item.purchasePrice * alloc.quantity : 0)
    }, 0)

    return {
      reportDate: {
        generated: today,
        startDate,
        endDate,
        period: startDate === endDate ? 'Single Day' : 'Date Range'
      },
      summary: {
        totalItems: warehouseItems.length,
        totalQuantity: warehouseItems.reduce((sum, item) => sum + item.totalQuantity, 0),
        availableQuantity: warehouseItems.reduce((sum, item) => sum + item.availableQuantity, 0),
        allocatedQuantity: warehouseItems.reduce((sum, item) => sum + item.allocatedQuantity, 0),
        totalAllocations: filteredAllocations.length,
        lowStockCount: lowStockItems.length,
        expiringCount: expiringItems.length
      },
      financial: {
        totalPurchaseValue,
        totalPotentialRevenue,
        totalAllocatedValue,
        grossProfit: totalPotentialRevenue - totalAllocatedValue,
        averagePurchasePrice: warehouseItems.length > 0 
          ? totalPurchaseValue / warehouseItems.reduce((sum, item) => sum + item.totalQuantity, 0) 
          : 0
      },
      allocationByPharmacy,
      allocationByMedicine: Object.values(allocationByMedicine),
      lowStockItems,
      expiringItems,
      stockMovement: {
        totalStockOut: filteredAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0),
        totalStockOutValue: totalStockIn
      },
      topMedicineByQuantity: [...warehouseItems]
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5),
      topMedicineByValue: [...warehouseItems]
        .sort((a, b) => (b.purchasePrice * b.totalQuantity) - (a.purchasePrice * a.totalQuantity))
        .slice(0, 5)
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading warehouse data...</div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="mt-2 text-gray-600">Central inventory management and pharmacy allocation</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleClearAll} 
            variant="danger"
            className="flex items-center gap-2"
          >
            <DeleteIcon fontSize="small" />
            Clear All Data
          </Button>
          <Button 
            onClick={() => setIsReportModalOpen(true)} 
            variant="primary"
            className="flex items-center gap-2"
          >
            <AssessmentIcon fontSize="small" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-3 sm:gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 truncate">Total Items</p>
          <p className="mt-1 sm:mt-2 text-lg font-bold text-gray-900 truncate">{warehouseSummary?.totalItems || 0}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 truncate">Available Stock</p>
          <p className="mt-1 sm:mt-2 text-lg font-bold text-green-600 truncate">{warehouseSummary?.availableQuantity || 0}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 truncate">Allocated Stock</p>
          <p className="mt-1 sm:mt-2 text-lg font-bold text-blue-600 truncate">{warehouseSummary?.allocatedQuantity || 0}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 truncate">Warehouse Value</p>
          <p className="mt-1 sm:mt-2 text-lg font-bold text-primary-600 truncate">{formatCurrency(warehouseSummary?.totalValue || 0)}</p>
        </div>
      </div>

      {/* Allocation Summary */}
      <div className="mb-6 grid gap-3 sm:gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 truncate">Total Allocations</p>
          <p className="mt-1 sm:mt-2 text-lg font-bold text-gray-900 truncate">{allocationSummary?.totalAllocations || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Warehouse Inventory
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'allocations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pharmacy Allocations
          </button>
        </nav>
      </div>

      {/* Warehouse Inventory Tab */}
      {activeTab === 'inventory' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Warehouse Inventory</h2>
            <Button onClick={() => setIsAddItemModalOpen(true)} variant="primary">
              + Add Item to Warehouse
            </Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {warehouseItems.length > 0 ? (
                    warehouseItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.medicineName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.totalQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{item.availableQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{item.allocatedQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.purchasePrice)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-1">
                            <Button
                              onClick={() => {
                                setSelectedWarehouseItem(item)
                                setRestockQuantity('')
                                setRestockMessage(null)
                                setIsRestockModalOpen(true)
                              }}
                              variant="secondary"
                              className="text-xs px-2 py-1"
                            >
                              <AddIcon fontSize="small" />
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedWarehouseItem(item)
                                setUpdatePriceFormData({
                                  purchasePrice: item.purchasePrice.toString(),
                                  sellingPrice: item.sellingPrice.toString(),
                                })
                                setUpdatePriceMessage(null)
                                setIsUpdatePriceModalOpen(true)
                              }}
                              variant="secondary"
                              className="text-xs px-2 py-1"
                            >
                              Edit Price
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedWarehouseItem(item)
                                setAllocateFormData({ ...allocateFormData, quantity: '' })
                                setIsAllocateModalOpen(true)
                              }}
                              variant="primary"
                              className="text-xs px-2 py-1"
                              disabled={item.availableQuantity === 0}
                            >
                              Allocate
                            </Button>
                            <button
                              onClick={() => handleDeleteWarehouseItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-xs px-1"
                            >
                              <DeleteIcon fontSize="small" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No items in warehouse
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Allocations Tab */}
      {activeTab === 'allocations' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Pharmacy Allocations</h2>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allocations.length > 0 ? (
                    allocations.map((allocation) => (
                      <tr key={allocation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(allocation.allocatedDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {allocation.pharmacyName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {allocation.medicineName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {allocation.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(allocation.status)}`}>
                            {allocation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {allocation.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteAllocation(allocation.id)}
                            className="text-red-600 hover:text-red-800 text-xs px-1"
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No allocations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddItemModalOpen && (
        <Modal isOpen={isAddItemModalOpen} title="Add Item to Warehouse" onClose={() => { setIsAddItemModalOpen(false); setAddMessage(null); }}>
          <form onSubmit={handleAddItem} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
            {addMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                addMessage.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {addMessage.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-900">Medicine Name *</label>
              <input
                type="text"
                value={addItemFormData.medicineName}
                onChange={(e) => setAddItemFormData({ ...addItemFormData, medicineName: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">Total Quantity *</label>
                <input
                  type="number"
                  value={addItemFormData.totalQuantity}
                  onChange={(e) => setAddItemFormData({ ...addItemFormData, totalQuantity: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Reorder Level *</label>
                <input
                  type="number"
                  value={addItemFormData.reorderLevel}
                  onChange={(e) => setAddItemFormData({ ...addItemFormData, reorderLevel: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">Purchase Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={addItemFormData.purchasePrice}
                  onChange={(e) => setAddItemFormData({ ...addItemFormData, purchasePrice: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Selling Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={addItemFormData.sellingPrice}
                  onChange={(e) => setAddItemFormData({ ...addItemFormData, sellingPrice: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Expiry Date</label>
              <input
                type="date"
                value={addItemFormData.expiryDate}
                onChange={(e) => setAddItemFormData({ ...addItemFormData, expiryDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary" className="flex-1">
                Add to Warehouse
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddItemModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirmation && (
        <Modal
          isOpen={true}
          title="Confirm deletion"
          onClose={() => setDeleteConfirmation(null)}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Delete <strong>{deleteConfirmation.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {clearConfirmation && (
        <Modal
          isOpen={true}
          title={`Clear ${clearConfirmation.type === 'warehouse' ? 'Warehouse' : clearConfirmation.type === 'sales' ? 'Sales' : 'All System'} Data`}
          onClose={() => setClearConfirmation(null)}
          size="sm"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Warning: This action cannot be undone!
              </p>
            </div>
            <p className="text-sm text-gray-600">
              {clearConfirmation.type === 'warehouse' 
                ? 'Are you sure you want to clear all warehouse inventory, allocations, and all pharmacy inventory? This will permanently delete all warehouse-related records in the system.'
                : clearConfirmation.type === 'sales'
                ? 'Are you sure you want to clear all sales, sale items, and expenses? This will permanently delete all sales-related records in the system.'
                : 'Are you sure you want to clear ALL data in the system? This will permanently delete warehouse inventory, allocations, pharmacy inventory, sales, expenses, customers, and categories. User accounts will be preserved.'}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setClearConfirmation(null)}
              >
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={confirmClear}>
                Clear All Data
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isRestockModalOpen && selectedWarehouseItem && (
        <Modal
          isOpen={isRestockModalOpen}
          title={`Add Stock: ${selectedWarehouseItem.medicineName}`}
          onClose={() => {
            setIsRestockModalOpen(false)
            setRestockMessage(null)
          }}
          size="sm"
        >
          <form onSubmit={handleAddWarehouseStock} className="space-y-4">
            {restockMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {restockMessage.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-900">Quantity to add *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={restockQuantity}
                onChange={(event) => setRestockQuantity(event.target.value)}
                required
                autoFocus
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsRestockModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Price Modal */}
      {isUpdatePriceModalOpen && selectedWarehouseItem && (
        <Modal
          isOpen={isUpdatePriceModalOpen}
          title={`Update Price: ${selectedWarehouseItem.medicineName}`}
          onClose={() => {
            setIsUpdatePriceModalOpen(false)
            setUpdatePriceMessage(null)
          }}
          size="sm"
        >
          <form onSubmit={handleUpdatePrice} className="space-y-4">
            {updatePriceMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                updatePriceMessage.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {updatePriceMessage.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-900">Purchase Price *</label>
              <input
                type="number"
                step="0.01"
                value={updatePriceFormData.purchasePrice}
                onChange={(e) => setUpdatePriceFormData({ ...updatePriceFormData, purchasePrice: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">Selling Price *</label>
              <input
                type="number"
                step="0.01"
                value={updatePriceFormData.sellingPrice}
                onChange={(e) => setUpdatePriceFormData({ ...updatePriceFormData, sellingPrice: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsUpdatePriceModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update Price
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Allocate Modal */}
      {isAllocateModalOpen && selectedWarehouseItem && (
        <Modal
          isOpen={isAllocateModalOpen}
          title={`Allocate ${selectedWarehouseItem.medicineName}`}
          onClose={() => { setIsAllocateModalOpen(false); setAllocateMessage(null); }}
        >
          <form onSubmit={handleAllocate} className="space-y-4">
            {allocateMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                allocateMessage.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {allocateMessage.text}
              </div>
            )}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Available:</strong> {selectedWarehouseItem.availableQuantity} units
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Select Pharmacy *</label>
              <select
                value={allocateFormData.pharmacyId}
                onChange={(e) => setAllocateFormData({ ...allocateFormData, pharmacyId: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              >
                <option value="">Select pharmacy</option>
                {PHARMACIES.map(pharmacy => (
                  <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Quantity to Allocate *</label>
              <input
                type="number"
                max={selectedWarehouseItem.availableQuantity}
                value={allocateFormData.quantity}
                onChange={(e) => setAllocateFormData({ ...allocateFormData, quantity: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum: {selectedWarehouseItem.availableQuantity} units</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Notes</label>
              <textarea
                value={allocateFormData.notes}
                onChange={(e) => setAllocateFormData({ ...allocateFormData, notes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary" className="flex-1">
                Create Allocation
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAllocateModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <Modal
          isOpen={isReportModalOpen}
          title="Warehouse Report"
          onClose={() => setIsReportModalOpen(false)}
          size="lg"
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Date Range Filter */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Report Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={reportDateRange.startDate}
                    onChange={(e) => setReportDateRange({ ...reportDateRange, startDate: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={reportDateRange.endDate}
                    onChange={(e) => setReportDateRange({ ...reportDateRange, endDate: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Report Content */}
            {(() => {
              const report = generateWarehouseReport()
              return (
                <div className="space-y-6">
                  {/* Report Header */}
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Warehouse Management Report</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Generated: {formatDate(report.reportDate.generated)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={generatePDFReport}
                          variant="secondary"
                          className="text-xs px-3 py-2"
                        >
                          <PictureAsPdfIcon fontSize="small" className="mr-1" />
                          Export PDF
                        </Button>
                        <Button
                          onClick={() => window.print()}
                          variant="secondary"
                          className="text-xs px-3 py-2"
                        >
                          <PrintIcon fontSize="small" className="mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-4 text-sm">
                      <span className="text-gray-600">
                        <strong>Period:</strong> {report.reportDate.period}
                      </span>
                      {report.reportDate.period === 'Date Range' && (
                        <>
                          <span className="text-gray-600">
                            <strong>From:</strong> {formatDate(report.reportDate.startDate)}
                          </span>
                          <span className="text-gray-600">
                            <strong>To:</strong> {formatDate(report.reportDate.endDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <h3 className="text-sm font-bold text-primary-900 mb-3">Executive Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-primary-700">Total Items</p>
                        <p className="text-lg font-bold text-primary-900">{report.summary.totalItems}</p>
                      </div>
                      <div>
                        <p className="text-xs text-primary-700">Total Stock</p>
                        <p className="text-lg font-bold text-primary-900">{report.summary.totalQuantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-primary-700">Available</p>
                        <p className="text-lg font-bold text-green-600">{report.summary.availableQuantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-primary-700">Allocated</p>
                        <p className="text-lg font-bold text-blue-600">{report.summary.allocatedQuantity}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Financial Overview</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-600">Total Purchase Value</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(report.financial.totalPurchaseValue)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-600">Total Potential Revenue</td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">
                              {formatCurrency(report.financial.totalPotentialRevenue)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-600">Total Allocated Value</td>
                            <td className="px-4 py-3 text-sm font-medium text-blue-600 text-right">
                              {formatCurrency(report.financial.totalAllocatedValue)}
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">Gross Profit Potential</td>
                            <td className="px-4 py-3 text-sm font-bold text-primary-600 text-right">
                              {formatCurrency(report.financial.grossProfit)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Allocation by Pharmacy */}
                  {report.allocationByPharmacy.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Allocation by Pharmacy</h3>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pharmacy</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {report.allocationByPharmacy.map((pharmacy: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">{pharmacy.pharmacyName}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right">{pharmacy.totalQuantity}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right">{pharmacy.totalItems}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                  {formatCurrency(pharmacy.allocationValue)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Top Medicines */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Top Medicines by Quantity</h3>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-200">
                            {report.topMedicineByQuantity.map((item: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.medicineName}</td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                  {item.totalQuantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Top Medicines by Value</h3>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-200">
                            {report.topMedicineByValue.map((item: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.medicineName}</td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                  {formatCurrency(item.purchasePrice * item.totalQuantity)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Low Stock Alert */}
                  {report.lowStockItems.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-red-900 mb-3">
                        Low Stock Alert ({report.lowStockItems.length} items)
                      </h3>
                      <div className="space-y-2">
                        {report.lowStockItems.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-red-800">{item.medicineName}</span>
                            <span className="text-red-600 font-medium">
                              {item.availableQuantity} / {item.reorderLevel}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expiring Items Alert */}
                  {report.expiringItems.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-yellow-900 mb-3">
                        Expiring Soon ({report.expiringItems.length} items)
                      </h3>
                      <div className="space-y-2">
                        {report.expiringItems.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-yellow-800">{item.medicineName}</span>
                            <span className="text-yellow-600 font-medium">
                              {item.daysUntilExpiry} days
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock Movement */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Stock Movement Summary</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-600">Total Stock Out (Allocations)</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              {report.stockMovement.totalStockOut} units
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-600">Total Stock Out Value</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(report.stockMovement.totalStockOutValue)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Allocation by Medicine */}
                  {report.allocationByMedicine.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Medicine Allocation Details</h3>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Allocations</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pharmacies</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {report.allocationByMedicine.map((medicine: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">{medicine.medicineName}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right">{medicine.totalQuantity}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right">{medicine.totalAllocations}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{medicine.pharmacies.join(', ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </Modal>
      )}
    </div>
  )
}