import Modal from 'react-modal'
import { useDispatch } from 'react-redux'
import { placeOrder } from '../features/order/orderSlice'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import React, { useState, useEffect } from 'react'

Modal.setAppElement('#root') // For accessibility

const AddOrderModal = ({ isOpen, onRequestClose, product }) => {
  const dispatch = useDispatch()
  const [quantity, setQuantity] = useState(1)
  
  const { loading, successMessage, error } = useSelector((state) => state.order)

  useEffect(() => {
    if (successMessage) toast.success(successMessage)
    if (error) toast.error(error)
  }, [successMessage, error])

  const handlePlaceOrder = () => {
    dispatch(placeOrder({
      productId: product.id,
      quantity,
    }))
    onRequestClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="bg-white p-6 max-w-md mx-auto mt-20 rounded shadow"
      overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start"
    >
      <h2 className="text-xl font-bold mb-4">🛒 Place Order</h2>
      <p className="mb-2 text-gray-600">{product.name}</p>

      <label className="block mb-2">Quantity:</label>
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="w-full px-3 py-2 border rounded mb-4"
      />

      <div className="flex justify-end gap-4">
        <button onClick={onRequestClose} className="px-4 py-2 border rounded text-gray-700">Cancel</button>
        <button onClick={handlePlaceOrder} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Confirm
        </button>
      </div>
    </Modal>
  )
}

export default AddOrderModal
