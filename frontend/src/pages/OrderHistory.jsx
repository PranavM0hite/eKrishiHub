import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyOrders } from '../features/order/orderSlice'
import { motion } from 'framer-motion'

const OrderHistory = () => {
  const dispatch = useDispatch()
  const { orders, loading, error } = useSelector((state) => state.order)

  useEffect(() => {
    dispatch(fetchMyOrders())
  }, [dispatch])

  return (
    <div className="min-h-screen bg-green-50 py-10 px-6">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">📜 My Order History</h1>

        {loading && <p className="text-blue-600 text-center">Loading your orders...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {orders.length === 0 && !loading && <p className="text-gray-600 text-center">No orders found.</p>}

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded shadow p-4 border">
              <p><strong>🧺 Product:</strong> {order.productName}</p>
              <p><strong>📦 Quantity:</strong> {order.quantity}</p>
              <p><strong>📅 Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>📌 Status:</strong> {order.status || 'Pending'}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default OrderHistory
