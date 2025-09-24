import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import api from '../api/axiosInstance'        // ✅ use shared instance
import { toast } from 'react-toastify'

const PlaceOrder = () => {
  const { productId } = useParams()
  const navigate = useNavigate()

  const initialValues = { quantity: '', address: '' }

  const validationSchema = Yup.object({
    quantity: Yup.number().typeError('Enter a number').required('Required').positive().integer(),
    address: Yup.string().trim().required('Delivery address is required'),
  })

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        productId: Number(productId),
        quantity: Number(values.quantity),
        address: values.address.trim(),
      }

      // ✅ This must match your backend mapping (see section 2)
      const res = await api.post('/customer/orders', payload)

      toast.success('Order placed successfully!')
      // go to My Orders or back to products
      navigate('/my-orders')
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Order failed'
      console.error('Order failed', error)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">🧾 Place Order</h2>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block mb-1">Quantity (kg/units)</label>
                <Field name="quantity" type="number" className="w-full border rounded px-3 py-2" />
                <ErrorMessage name="quantity" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1">Delivery Address</label>
                <Field name="address" as="textarea" className="w-full border rounded px-3 py-2" />
                <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default PlaceOrder
