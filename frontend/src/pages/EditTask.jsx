// src/pages/EditTask.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from '../api/axiosInstance'; // <-- use the instance with baseURL '/api'
import { toast } from 'react-toastify';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const schema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string().nullable(),
  dueDate: Yup.string().required('Due date is required'), // yyyy-MM-dd
  status: Yup.mixed().oneOf(STATUSES).required('Status is required'),
});

const EMPTY = { title: '', description: '', dueDate: '', status: 'PENDING' };

// Ensure string yyyy-MM-dd for date input
const toDateInput = (s) => {
  if (!s) return '';
  // if backend already sends "yyyy-MM-dd", keep it
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export default function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // ✅ hits /api/tasks/:id via proxy
        const res = await axios.get(`/tasks/${id}`);
        const raw = res?.data;

        // Defensive: ensure object, not HTML string
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          throw new Error('Unexpected task response');
        }

        setInitial({
          title: raw.title || '',
          description: raw.description || '',
          dueDate: toDateInput(raw.dueDate),
          status: String(raw.status || 'PENDING').toUpperCase(),
        });
      } catch (e) {
        console.error('Failed to load task:', e);
        toast.error(e?.response?.data?.message || 'Failed to load task');
        navigate('/tasks');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id, navigate]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // PUT expects { title, description, dueDate, status }
      await axios.put(`/tasks/${id}`, {
        title: values.title.trim(),
        description: values.description?.trim() || '',
        dueDate: values.dueDate,               // "yyyy-MM-dd"
        status: values.status.toUpperCase(),   // enum-safe
      });
      toast.success('Task updated');
      navigate('/tasks');
    } catch (e) {
      console.error('Failed to update task:', e);
      toast.error(e?.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading task…</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-green-700">✏️ Edit Task</h2>
          <Link to="/tasks" className="text-sm text-green-700 hover:underline">Back to Tasks</Link>
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
                <label className="block mb-1 text-sm font-medium">Title</label>
                <Field name="title" type="text" className="w-full border rounded px-3 py-2" />
                <ErrorMessage name="title" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Description</label>
                <Field as="textarea" name="description" rows="3" className="w-full border rounded px-3 py-2" />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Due Date</label>
                <Field name="dueDate" type="date" className="w-full border rounded px-3 py-2" />
                <ErrorMessage name="dueDate" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Status</label>
                <Field as="select" name="status" className="w-full border rounded px-3 py-2">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </Field>
                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="w-1/2 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                >
                  {isSubmitting ? 'Saving…' : 'Update Task'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
