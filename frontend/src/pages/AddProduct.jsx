import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axiosInstance'; // ✅ use the same axios instance as the rest of the app
import { toast } from 'react-toastify';

// Map the visible category values to what your backend enum likely expects.
const CATEGORY_MAP = {
  Fruit: 'FRUIT',
  Vegetable: 'VEGETABLE',
  Grain: 'GRAIN',
  Other: 'OTHER',
};

const AddProduct = () => {
  const navigate = useNavigate();

  const initialValues = {
    name: '',
    category: '',
    price: '',
    quantity: '',
    description: '',
  };

  const validationSchema = Yup.object({
    name: Yup.string().trim().required('Name is required'),
    category: Yup.string()
      .oneOf(['Fruit', 'Vegetable', 'Grain', 'Other'], 'Select a valid category')
      .required('Category is required'),
    // Keep price as string in the form, but validate it as a positive number with up to 2 decimals
    price: Yup.string()
      .required('Price is required')
      .test('is-decimal', 'Enter a valid amount', (val) => /^(\d+)(\.\d{1,2})?$/.test(val || ''))
      .test('gt-zero', 'Price must be greater than 0', (val) => parseFloat(val || '0') > 0),
    quantity: Yup.number()
      .typeError('Quantity must be a number')
      .integer('Quantity must be an integer')
      .positive('Quantity must be greater than 0')
      .required('Quantity is required'),
    description: Yup.string().trim().required('Description is required'),
  });

  // Turn UI values into what the backend expects
  const buildPayload = (values) => {
    const priceNum = parseFloat(String(values.price).trim());
    const qtyNum = parseInt(String(values.quantity).trim(), 10);

    return {
      name: values.name.trim(),
      description: values.description.trim(),
      // if backend uses enum: send uppercase token
      category: CATEGORY_MAP[values.category] || values.category?.toUpperCase(),
      // Send price as string to keep BigDecimal precision on the server
      price: priceNum.toFixed(2),
      quantity: qtyNum,
    };
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const token = localStorage.getItem('token');

      const payload = buildPayload(values);

      const res = await axios.post('/farmer/products', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res || res.status >= 400) throw new Error('Add product failed');

      toast.success('Product added successfully');
      resetForm();
      navigate('/product'); // or wherever your list lives
    } catch (error) {
      const status = error?.response?.status;
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        // Sometimes Bean Validation returns a map/array under 'errors'
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.join(', ')
          : '') ||
        error?.message ||
        'Server error';

      if (status === 400) {
        toast.error(serverMsg || 'Invalid product data. Please check your inputs.');
      } else if (status === 401) {
        toast.error('Your session has expired. Please log in again.');
      } else {
        toast.error(serverMsg);
      }

      // Helpful during dev:
      console.error('Error adding product:', {
        status,
        payloadTried: buildPayload(values),
        serverData: error?.response?.data,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">➕ Add New Product</h2>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Name</label>
                <Field name="name" type="text" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-green-300" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Category</label>
                <Field name="category" as="select" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-green-300">
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
                <Field name="price" type="text" inputMode="decimal" placeholder="e.g. 49.99" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-green-300" />
                <ErrorMessage name="price" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Quantity (kg/unit)</label>
                <Field name="quantity" type="number" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-green-300" />
                <ErrorMessage name="quantity" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Description</label>
                <Field name="description" as="textarea" rows="3" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-green-300" />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => navigate('/product')} className="w-1/2 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50">
                  ← Back to Products
                </button>
                <button type="submit" disabled={isSubmitting} className="w-1/2 bg-green-600 text-white py-2 rounded hover:bg-green-700">
                  {isSubmitting ? 'Adding…' : 'Add Product'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddProduct;
