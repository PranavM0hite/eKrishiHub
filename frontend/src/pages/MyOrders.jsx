import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

/* helpers */
const normalizeOrders = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.content)) return resData.content;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.items)) return resData.items;
  return [];
};
const fmtINR = (v) => {
  if (v == null || isNaN(v)) return '—';
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v); }
  catch { return `₹ ${Number(v).toFixed(2)}`; }
};

/* motion */
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.05 + i * 0.05 } }),
};
const tableVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, when: 'beforeChildren', staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // edit modal
  const [editing, setEditing] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [editAddress, setEditAddress] = useState('');

  // load Razorpay once
  useEffect(() => {
    const id = 'razorpay-chk';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onerror = () => toast.error('Failed to load Razorpay. Check your network.');
    document.body.appendChild(s);
  }, []);

  const fetchOrders = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get('/customer/orders');
      setOrders(normalizeOrders(res.data));
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to load orders';
      if (status === 401 || status === 403) {
        setError('Session expired. Please log in again.');
        setTimeout(() => navigate('/customer-login'), 600);
      } else {
        setError(msg);
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);
  const unpaid = orders.filter(o => String(o.paymentStatus || 'PENDING').toUpperCase() !== 'PAID');
  const grandTotal = unpaid.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  /* edit/delete */
  const openEdit = (o) => { setEditing(o); setEditQty(o.quantity || 1); setEditAddress(o.address || ''); };
  const closeEdit = () => setEditing(null);

  const saveEdit = async () => {
    try {
      if (!editing) return;
      if (Number(editQty) <= 0) { toast.error('Quantity must be > 0'); return; }
      await axios.put(`/customer/orders/${editing.id}`, { quantity: Number(editQty), address: editAddress });
      toast.success('Order updated');
      closeEdit();
      fetchOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Update failed');
    }
  };

  const deleteOrder = async (o) => {
    try {
      const status = String(o.paymentStatus || 'PENDING').toUpperCase();
      if (status === 'PAID') { toast.info('Paid orders cannot be deleted.'); return; }
      if (!window.confirm(`Delete order #${o.id}?`)) return;
      await axios.delete(`/customer/orders/${o.id}`);
      toast.success('Order deleted');
      fetchOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Delete failed');
    }
  };

  /* pay all unpaid */
  const payAllUnpaid = async () => {
    try {
      if (!window.Razorpay) { toast.error('Razorpay is not ready yet. Please retry.'); return; }
      if (unpaid.length === 0) { toast.info('No unpaid orders.'); return; }

      const orderIds = unpaid.map(o => o.id);
      const resp = await axios.post('/orders/payment/create-bundle', { orderIds });
      const data = resp?.data || {};
      if (!data.key || !data.razorpayOrderId) { toast.error('Payment init failed.'); return; }

      const options = {
        key: data.key,
        amount: Math.round((Number(data.amount) || grandTotal || 0) * 100),
        currency: data.currency || 'INR',
        name: 'eKrishiHub',
        description: `Payment for ${orderIds.length} order(s)`,
        order_id: data.razorpayOrderId,
        theme: { color: '#16a34a' },
        handler: async (rzp) => {
          await axios.post('/orders/payment/update-bundle', {
            orderIds,
            paymentId: rzp?.razorpay_payment_id,
            status: 'PAID',
          });
          toast.success('Payment successful!');
          fetchOrders();
        },
        modal: {
          ondismiss: async () => {
            try {
              await axios.post('/orders/payment/update-bundle', { orderIds, paymentId: '', status: 'FAILED' });
              fetchOrders();
            } catch {}
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async () => {
        toast.error('Payment failed.');
        try {
          await axios.post('/orders/payment/update-bundle', { orderIds, paymentId: '', status: 'FAILED' });
          fetchOrders();
        } catch {}
      });
      rzp.open();
    } catch (e) {
      console.error('Payment error', e);
      toast.error(e?.response?.data?.message || 'Could not start payment. Try again.');
    }
  };

  /* render */
  return (
    <div className="flex flex-col">
      {/* Heading */}
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="show" className="mb-6">
        <h1 className="text-3xl font-bold text-green-800 tracking-tight">My Orders</h1>
        <p className="text-gray-600">Track your purchases and payment status.</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse" variants={cardVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
            <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-10 w-full bg-gray-100 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded mb-2" />
            <div className="h-10 w-2/3 bg-gray-100 rounded" />
          </motion.div>
        ) : error ? (
          <motion.div key="error" className="p-6 text-center text-red-600 bg-white rounded-xl border border-gray-200 shadow-sm" variants={rowVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
            {error}
          </motion.div>
        ) : orders.length === 0 ? (
          <motion.div key="empty" className="p-10 text-center bg-white rounded-xl border border-gray-200 shadow-sm text-gray-500" variants={rowVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
            <div className="text-5xl mb-3">🧾</div>
            <p>No orders yet.</p>
            <Link to="/products" className="inline-block mt-3 text-green-700 hover:underline">
              Browse products
            </Link>
          </motion.div>
        ) : (
          <motion.div key="table" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" variants={tableVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold border-b">Order #</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Product</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Category</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Qty</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Total</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Payment</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => {
                    const status = String(o.paymentStatus || 'PENDING').toUpperCase();
                    const isPaid = status === 'PAID';
                    return (
                      <motion.tr key={o.id} variants={rowVariants} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-800">{o.id}</td>
                        <td className="px-5 py-3 text-gray-800">{o.productName ?? `#${o.productId}`}</td>
                        <td className="px-5 py-3 text-gray-700">{o.productCategory ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-800">{o.quantity ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-800">{fmtINR(o.totalAmount)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full border ${
                            isPaid
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : status === 'FAILED'
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-3 flex items-center gap-2">
                          <button
                            onClick={() => openEdit(o)}
                            disabled={isPaid}
                            className={`text-xs px-3 py-1 rounded border border-gray-300 ${isPaid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteOrder(o)}
                            disabled={isPaid}
                            className={`text-xs px-3 py-1 rounded border border-red-300 text-red-700 ${isPaid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'}`}
                          >
                            Delete
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* footer bar */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-t">
              <div className="text-sm text-gray-600">
                Unpaid orders: <span className="font-semibold text-gray-800">{unpaid.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  Grand Total:&nbsp;
                  <span className="font-semibold text-green-700">{fmtINR(grandTotal)}</span>
                </div>
                <button
                  onClick={payAllUnpaid}
                  disabled={unpaid.length === 0}
                  className={`text-sm px-4 py-2 rounded shadow text-white ${unpaid.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  Pay Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-md bg-white rounded-lg shadow p-5" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <h3 className="text-lg font-semibold text-green-700 mb-3">Edit Order #{editing.id}</h3>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm text-gray-700">Quantity</span>
                  <input type="number" min="1" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700">Delivery Address</span>
                  <textarea rows="3" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={closeEdit} className="px-3 py-1.5 rounded border">Cancel</button>
                <button onClick={saveEdit} className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
