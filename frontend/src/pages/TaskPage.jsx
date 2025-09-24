// src/pages/TaskPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

export default function TaskPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  const userEmail = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user'))?.email || ''; }
    catch { return ''; }
  }, []);

  const onHttpError = (err, fallbackMsg = 'Something went wrong') => {
    const status = err?.response?.status;
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallbackMsg;

    if (status === 401 || status === 403) {
      toast.error('Your session expired. Please log in again.');
      navigate('/farmer-login');
      return;
    }
    toast.error(msg);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/tasks'); // -> /api/tasks
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch tasks failed:', err);
      onHttpError(err, 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const formatDate = (s) => {
    if (!s) return '-';
    try { return new Date(`${s}T00:00:00`).toLocaleDateString(); }
    catch { return s; }
  };

  const statusTone = (status) => {
    const v = String(status || 'PENDING').toUpperCase();
    if (v === 'COMPLETED') return 'bg-green-100 text-green-700 border-green-200';
    if (v === 'IN_PROGRESS') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  /** Update status inline (optimistic) */
  const changeStatus = async (id, nextRaw) => {
    const next = String(nextRaw || '').trim().toUpperCase();
    if (!STATUSES.includes(next)) return;

    const prev = tasks;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx < 0) return;

    const copy = [...tasks];
    copy[idx] = { ...copy[idx], status: next };
    setTasks(copy);
    setBusyId(id);

    try {
      await axiosInstance.put(`/tasks/${id}/status`, { status: next });
      toast.success('Status updated');
    } catch (err) {
      console.error('Change status failed:', err);
      setTasks(prev); // rollback
      onHttpError(err, 'Failed to change status');
    } finally {
      setBusyId(null);
    }
  };

  /** Delete task with confirm (optimistic) */
  const deleteTask = async (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!confirm(`Delete task "${t?.title || id}"?`)) return;

    const prev = tasks;
    setTasks(tasks.filter((x) => x.id !== id));
    setBusyId(id);

    try {
      await axiosInstance.delete(`/tasks/${id}`);
      toast.success('Task deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      setTasks(prev);
      onHttpError(err, 'Failed to delete task');
    } finally {
      setBusyId(null);
    }
  };

  // motion (content only; layout provides page shell)
  const cardVariants = { hidden: { y: 12, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.35 } } };
  const tableVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, when: 'beforeChildren', staggerChildren: 0.05 } },
  };
  const rowVariants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="flex flex-col">
      {/* Heading */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-800">Task Management</h1>
        <p className="text-sm text-gray-500">Plan and track your farming tasks.</p>
      </div>

      <motion.div variants={cardVariants} initial="hidden" animate="show" className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {loading
            ? 'Loading your tasks…'
            : tasks.length === 0
            ? 'No tasks yet. Add your first task.'
            : `${tasks.length} task${tasks.length > 1 ? 's' : ''} found.`}
        </div>
        <Link
          to="/add-task"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm shadow"
        >
          <span className="text-base leading-none">＋</span> Add Task
        </Link>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse"
            variants={cardVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-10 w-full bg-gray-100 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded mb-2" />
            <div className="h-10 w-2/3 bg-gray-100 rounded" />
          </motion.div>
        ) : tasks.length === 0 ? (
          <motion.div
            key="empty"
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center"
            variants={cardVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            <div className="text-5xl mb-3">🧺</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Start planning your farming schedule.</p>
            <Link
              to="/add-task"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm shadow"
            >
              Create Task
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            variants={tableVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold border-b">Task ID</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Title</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Description</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Due Date</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Status</th>
                    <th className="px-5 py-3 text-left font-semibold border-b w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map((t) => (
                    <motion.tr key={t.id} variants={rowVariants} className="hover:bg-gray-50">
                      <td className="px-5 py-3 whitespace-nowrap text-gray-800">{t.id}</td>
                      <td className="px-5 py-3 text-gray-800">{t.title}</td>
                      <td className="px-5 py-3 text-gray-600">{t.description || '-'}</td>
                      <td className="px-5 py-3 text-gray-700">{formatDate(t.dueDate)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusTone(
                              t.status
                            )}`}
                          >
                            {String(t.status || 'PENDING').replaceAll('_', ' ')}
                          </span>
                          <select
                            disabled={busyId === t.id}
                            value={t.status || 'PENDING'}
                            onChange={(e) => changeStatus(t.id, e.target.value)}
                            className="text-xs border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replaceAll('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/edit-task/${t.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border text-gray-700 hover:border-green-400 hover:text-green-700"
                            title="Edit"
                          >
                            ✏️ <span className="hidden sm:inline">Edit</span>
                          </Link>
                          <button
                            disabled={busyId === t.id}
                            onClick={() => deleteTask(t.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border text-gray-700 hover:border-red-400 hover:text-red-600"
                            title="Delete"
                          >
                            🗑️ <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
