import { useState, useEffect } from 'react'
import { categoryService, Category } from '@services/index'
import Button from '@components/Common/Button'
import Modal from '@components/Common/Modal'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const data = await categoryService.getAll()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!formData.name.trim()) return

    try {
      await categoryService.create({ name: formData.name })
      setFormData({ name: '' })
      setShowModal(false)
      loadCategories()
    } catch (error) {
      console.error('Failed to add category:', error)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        await categoryService.delete(id)
        loadCategories()
      } catch (error) {
        console.error('Failed to delete category:', error)
      }
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading categories...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="mt-2 text-gray-600">Manage medicine categories</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-blue-500 hover:bg-blue-600">
          + Add Category
        </Button>
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{category.name}</td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal isOpen={showModal} title="Add Category" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Category name"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <div className="flex gap-3">
              <Button onClick={handleAddCategory} className="flex-1 bg-blue-500 hover:bg-blue-600">
                Add
              </Button>
              <Button onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 hover:bg-gray-400">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
