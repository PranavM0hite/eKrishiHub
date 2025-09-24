// src/pages/FarmerOrders.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axiosInstance';

/* ----------------------------- helpers ----------------------------- */
const normalizeOrders = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.content)) return resData.content; // Spring pageable
  if (Array.isArray(resData?.data)) return resData.data;       // common wrapper
  if (Array.isArray(resData?.items)) return resData.items;     // REST-ish
  return [];
};
const fmtINR = (v) => {
  if (v == null || isNaN(v)) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `₹ ${Number(v).toFixed(2)}`;
  }
};

/* ----------------------------- Motion helpers ---------------------------- */
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.05 + i * 0.05 } }),
};
const rowVariants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

/* ------------------------------ Page ------------------------------ */
export default function FarmerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/farmer/orders'); // -> /api/farmer/orders
      setOrders(normalizeOrders(res.data));
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to load orders';
      if (status === 401 || status === 403) {
        setError('Session expired. Please log in again.');
        setTimeout(() => navigate('/farmer-login'), 600);
      } else {
        setError(msg);
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);
  const list = Array.isArray(orders) ? orders : [];

  const paid = list.filter(o => String(o.paymentStatus || 'PENDING').toUpperCase() === 'PAID').length;

  return (
    <div className="flex flex-col">
      {/* Heading */}
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="show" className="mb-6">
        <h1 className="text-3xl font-bold text-green-800 tracking-tight">Orders for Your Products</h1>
        <p className="text-gray-600">View customer orders, amounts, and payment status.</p>
      </motion.div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { k: 0, label: 'Total Orders', value: list.length },
          { k: 1, label: 'Paid', value: paid },
          { k: 2, label: 'Unpaid', value: Math.max(list.length - paid, 0) },
        ].map(({ k, label, value }) => (
          <motion.div
            key={label}
            custom={k}
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-xl bg-white p-4 shadow-sm border border-gray-200"
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-green-700">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Table */}
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
        ) : error ? (
          <motion.div
            key="error"
            className="p-6 text-center text-red-600 bg-white rounded-xl border border-gray-200 shadow-sm"
            variants={rowVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.div>
        ) : list.length === 0 ? (
          <motion.div
            key="empty"
            className="p-10 text-center bg-white rounded-xl border border-gray-200 shadow-sm text-gray-500"
            variants={rowVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            <div className="text-5xl mb-3">📭</div>
            <p>No orders yet for your products.</p>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            variants={cardVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold border-b">Order #</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Product</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Category</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Qty</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Total</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Address</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.map((o) => {
                    const status = String(o.paymentStatus || 'PENDING').toUpperCase();
                    return (
                      <motion.tr key={o.id} variants={rowVariants} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-800">{o.id}</td>
                        <td className="px-5 py-3 text-gray-800">{o.productName ?? `#${o.productId}`}</td>
                        <td className="px-5 py-3 text-gray-600">{o.productCategory ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-800">{o.quantity ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-800">{fmtINR(o.totalAmount)}</td>
                        <td className="px-5 py-3 text-gray-600">{o.address ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${
                              status === 'PAID'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : status === 'FAILED'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
