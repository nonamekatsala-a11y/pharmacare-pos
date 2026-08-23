import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface CartItem {
  medicineId: string
  medicineName: string
  barcode: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
  maxStock: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (medicineId: string) => void
  updateQuantity: (medicineId: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTax: () => number
  getTotal: () => number
  getChange: (amountReceived: number) => number
}

export const useCartStore = create<CartStore>()(
  devtools((set, get) => ({
    items: [],

    addItem: (item) =>
      set((state) => {
        const existing = state.items.find((i) => i.medicineId === item.medicineId)
        if (existing) {
          const newQuantity = existing.quantity + item.quantity
          if (newQuantity <= item.maxStock) {
            const itemTotal = newQuantity * existing.unitPrice
            return {
              items: state.items.map((i) =>
                i.medicineId === item.medicineId
                  ? {
                      ...i,
                      quantity: newQuantity,
                      total: itemTotal,
                    }
                  : i,
              ),
            }
          }
          return state
        }
        return { items: [...state.items, item] }
      }),

    removeItem: (medicineId) =>
      set((state) => ({
        items: state.items.filter((i) => i.medicineId !== medicineId),
      })),

    updateQuantity: (medicineId, quantity) =>
      set((state) => {
        const item = state.items.find((i) => i.medicineId === medicineId)
        if (quantity <= 0) {
          return { items: state.items.filter((i) => i.medicineId !== medicineId) }
        }
        if (item && quantity > item.maxStock) {
          return state // Don't update if exceeds max stock
        }
        return {
          items: state.items.map((i) =>
            i.medicineId === medicineId
              ? {
                  ...i,
                  quantity,
                  total: quantity * i.unitPrice,
                }
              : i,
          ),
        }
      }),

    clearCart: () => set({ items: [] }),

    getSubtotal: () => {
      return get().items.reduce((sum, item) => sum + (item.total / (1 + item.taxRate)), 0)
    },

    getTax: () => {
      return get().items.reduce((sum, item) => {
        const subtotal = item.total / (1 + item.taxRate)
        return sum + (item.total - subtotal)
      }, 0)
    },

    getTotal: () => {
      return get().items.reduce((sum, item) => sum + item.total, 0)
    },

    getChange: (amountReceived) => {
      const total = get().getTotal()
      return Math.max(0, amountReceived - total)
    },
  })),
)
