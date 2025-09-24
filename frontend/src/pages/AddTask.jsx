// src/pages/AddTask.jsx
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import axios from '../api/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const AddTask = () => {
  const navigate = useNavigate();

  const initialValues = {
    title: '',
    description: '',
    dueDate: '',
  };

  const validationSchema = Yup.object({
    title: Yup.string().trim().required('Title is required'),
    description: Yup.string().trim().required('Description is required'),
    dueDate: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date')
      .required('Due date is required'),
  });

  const toIsoDate = (s) => {
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already yyyy-MM-dd
    const m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s); // dd/MM/yyyy etc.
    if (m) {
      const [, d, mo, y] = m;
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    try {
      const d = new Date(s + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch {}
    return s;
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        dueDate: toIsoDate(values.dueDate),
        status: 'PENDING', // harmless default; backend may ignore/validate
      };

      const res = await axios.post('/tasks', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res || res.status >= 400) throw new Error('Task creation failed');

      toast.success('Task created successfully');
      resetForm();
      navigate('/tasks');
    } catch (error) {
      const status = error?.response?.status;
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Server error';
      if (status === 400) toast.error(serverMsg || 'Invalid input. Please check your data.');
      else if (status === 401) toast.error('Your session has expired. Please log in again.');
      else toast.error(serverMsg);

      console.error('Error creating task:', {
        status,
        body: error?.response?.data,
        msg: error?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <motion.div
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* Header with Back link */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-green-700">➕ Add Farming Task</h2>
          <Link to="/tasks" className="text-sm text-green-700 hover:underline">
            Back to Tasks
          </Link>
        </div>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Title</label>
                <Field
                  name="title"
                  type="text"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-green-300"
                />
                <ErrorMessage name="title" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Description</label>
                <Field
                  name="description"
                  as="textarea"
                  rows="3"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-green-300"
                />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Due Date</label>
                <Field
                  name="dueDate"
                  type="date"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-green-300"
                />
                <ErrorMessage name="dueDate" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="flex gap-2">
                <Link
                  to="/tasks"
                  className="w-1/2 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  {isSubmitting ? 'Saving…' : 'Save Task'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </motion.div>
    </div>
  );
};

export default AddTask;
