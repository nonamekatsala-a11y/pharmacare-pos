import React from 'react'

interface QuantityControlProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}

export default function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 999,
  label = 'Quantity',
}: QuantityControlProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1)
  }

  const handleIncrement = () => {
    if (value < max) onChange(value + 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10) || 0
    if (newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-primary-700">{label}</label>
      <div className="flex items-center gap-3">
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="flex items-center justify-center w-9 h-9 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className="w-20 px-3 py-2 text-center border rounded-lg bg-primary-50 text-primary-900 border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
        />
        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="flex items-center justify-center w-9 h-9 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
