// src/components/ProductList.jsx
import React, { useEffect, useState } from 'react'
import axios from '../api/axiosInstance'   // same as TaskList
import { useNavigate } from 'react-router-dom'

const ProductList = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  const fmtINR = (v) => {
    if (v == null || isNaN(v)) return '—'
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(Number(v))
    } catch {
      return `₹ ${Number(v).toFixed(2)}`
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    setError('')
    try {
      // Prefer farmer-scoped list
      const res = await axios.get('/farmer/products')   // -> /api/farmer/products
      setProducts(Array.isArray(res.data) ? res.data : [])
    } catch (e1) {
      try {
        // Fallback to public list if farmer endpoint not available
        const res2 = await axios.get('/products')       // -> /api/products
        setProducts(Array.isArray(res2.data) ? res2.data : [])
      } catch (e2) {
        console.error('Fetch products failed:', e1, e2)
        setError(e2?.response?.data?.message || e2.message || 'Failed to load products')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId) => {
    const ok = window.confirm('Are you sure you want to delete this product?')
    if (!ok) return

    // optimistic UI with rollback
    const prev = products
    setProducts(prev.filter((p) => p.id === undefined ? p.productId !== productId : p.id !== productId))

    try {
      await axios.delete(`/farmer/products/${productId}`)   // preferred
    } catch (e1) {
      try {
        await axios.delete(`/products/${productId}`)        // fallback
      } catch (e2) {
        console.error('Delete product failed:', e1, e2)
        alert(e2?.response?.data?.message || 'Failed to delete product')
        setProducts(prev) // rollback
      }
    }
  }

  useEffect(() => { fetchProducts() }, [])

  if (loading) return <p className="text-center">Loading products...</p>
  if (error)   return <p className="text-center text-red-500">{error}</p>

  return (
    <div className="bg-white rounded-xl shadow p-5 ">
      {/* header matches TaskList */}
      <div className="mb-3 flex items-center justify-between">
      </div>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 p-6">
          <p className="text-lg">🛒 No products listed yet!</p>
          <p className="text-sm">Start by adding your first crop or produce.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => {
            const id  = p.id ?? p.productId
            const qty = p.quantity ?? p.stock ?? '—'
            return (
              <li
                key={id}
                className="border p-3 rounded-lg flex justify-between items-center hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-800">{p.name ?? 'Untitled product'}</h3>
                  <p className="text-sm text-gray-600">
                    Category: {p.category ?? '—'} | Price: {fmtINR(p.price)} | Qty: {qty}
                  </p>
                  <p className="text-sm text-gray-500">Description : {p.description ?? '—'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.category ?? 'General'}
                  </span>
                  <button
                    onClick={() => navigate(`/edit-product/${id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ProductList
