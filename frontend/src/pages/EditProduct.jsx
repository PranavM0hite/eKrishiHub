// src/pages/EditProduct.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from '../api/axiosInstance'; // ✅ shared instance (baseURL '/api')
import { toast } from 'react-toastify';

const schema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  category: Yup.string().trim().required('Category is required'),
  price: Yup.number()
    .typeError('Price must be a number')
    .positive('Price must be greater than 0')
    .required('Price is required'),
  quantity: Yup.number()
    .typeError('Quantity must be a number')
    .integer('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative')
    .required('Quantity is required'),
  // Make description optional; some backends ignore it
  description: Yup.string().nullable(),
});

const EMPTY = { name: '', category: '', price: '', quantity: '', description: '' };

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // 1) Prefer farmer-scoped GET /api/farmer/products/:id
        let res;
        try {
          res = await axios.get(`/farmer/products/${id}`);
        } catch (e) {
          // 2) Fallback to public GET /api/products/:id if you exposed it
          // Comment this out if you don't have a public "get one" endpoint
          res = await axios.get(`/products/${id}`);
        }

        const raw = res?.data;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          throw new Error('Unexpected product response');
        }

        setInitial({
          name: raw.name ?? '',
          category: raw.category ?? '',
          price: raw.price ?? '',
          quantity: raw.quantity ?? raw.stock ?? '',
          description: raw.description ?? '',
        });
      } catch (e) {
        console.error('Failed to load product:', e);
        toast.error(e?.response?.data?.message || 'Failed to load product');
        navigate('/product'); // your ProductPage route
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id, navigate]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        name: values.name.trim(),
        category: values.category.trim(),
        price: Number(values.price),
        quantity: Number(values.quantity),
        description: values.description?.trim() || '',
      };

      // ✅ Farmer-scoped update
      await axios.put(`/farmer/products/${id}`, payload);
      toast.success('Product updated');
      navigate('/product');
    } catch (e) {
      console.error('Failed to update product:', e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to update product';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading product…</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-green-700">✏️ Edit Product</h2>
          <Link to="/product" className="text-sm text-green-700 hover:underline">
            Back to Products
          </Link>
        </div>

        <Formik
          initialValues={initial}
          validationSchema={schema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Name</label>
                <Field name="name" type="text" className="w-full border rounded px-3 py-2" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Category</label>
                <Field as="select" name="category" className="w-full border rounded px-3 py-2">
                  <option value="">Select</option>
                  <option value="Fruit">Fruit</option>
                  <option value="Vegetable">Vegetable</option>
                  <option value="Grain">Grain</option>
                  <option value="Other">Other</option>
                </Field>
                <ErrorMessage name="category" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Price (₹)</label>
                <Field name="price" type="number" step="0.01" className="w-full border rounded px-3 py-2" />
                <ErrorMessage name="price" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Quantity (kg/unit)</label>
                <Field name="quantity" type="number" className="w-full border rounded px-3 py-2" />
                <ErrorMessage name="quantity" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Description</label>
                <Field as="textarea" name="description" rows="3" className="w-full border rounded px-3 py-2" />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/product')}
                  className="w-1/2 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                >
                  {isSubmitting ? 'Saving…' : 'Update Product'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
