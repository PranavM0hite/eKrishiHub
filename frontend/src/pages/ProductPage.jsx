// src/pages/ProductPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductPage() {
  const [products, setProducts] = useState([]);
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Prefer farmer-scoped list
      const res = await axiosInstance.get('/farmer/products'); // -> /api/farmer/products
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // Fallback to public list
      try {
        const res2 = await axiosInstance.get('/products'); // -> /api/products
        setProducts(Array.isArray(res2.data) ? res2.data : []);
      } catch (err2) {
        console.error('Fetch products failed:', err, err2);
        onHttpError(err2, 'Failed to fetch products');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const fmtINR = (v) => {
    if (v == null || isNaN(v)) return '—';
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);
    } catch {
      return `₹ ${Number(v).toFixed(2)}`;
    }
  };

  /** Delete product (optimistic) */
  const deleteProduct = async (id, name) => {
    if (!confirm(`Delete product "${name || id}"?`)) return;

    const prev = products;
    setProducts(products.filter(p => (p.id ?? p.productId) !== id));
    setBusyId(id);

    try {
      await axiosInstance.delete(`/farmer/products/${id}`);
      toast.success('Product deleted');
    } catch (err) {
      try {
        await axiosInstance.delete(`/products/${id}`);
        toast.success('Product deleted');
      } catch (err2) {
        console.error('Delete failed:', err, err2);
        setProducts(prev); // rollback
        onHttpError(err2, 'Failed to delete product');
      }
    } finally {
      setBusyId(null);
    }
  };

  // Motion helpers
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
        <h1 className="text-2xl sm:text-3xl font-bold text-green-800">Product Management</h1>
        <p className="text-sm text-gray-500">Add, edit, and manage your products.</p>
      </div>

      <motion.div variants={cardVariants} initial="hidden" animate="show" className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {loading
            ? 'Loading your products…'
            : products.length === 0
            ? 'No products yet. Add your first product.'
            : `${products.length} product${products.length > 1 ? 's' : ''} found.`}
        </div>
        <Link
          to="/add-product"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm shadow"
        >
          <span className="text-base leading-none">＋</span> Add Product
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
        ) : products.length === 0 ? (
          <motion.div
            key="empty"
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center"
            variants={cardVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            <div className="text-5xl mb-3">🧺</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No products yet</h3>
            <p className="text-gray-500 mb-4">Start listing your produce.</p>
            <Link
              to="/add-product"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm shadow"
            >
              Create Product
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
                    <th className="px-5 py-3 text-left font-semibold border-b">ID</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Name</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Category</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Price</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Quantity</th>
                    <th className="px-5 py-3 text-left font-semibold border-b">Description</th>
                    <th className="px-5 py-3 text-left font-semibold border-b w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => {
                    const pid = p.id ?? p.productId; // handle both shapes
                    return (
                      <motion.tr key={pid} variants={rowVariants} className="hover:bg-gray-50">
                        <td className="px-5 py-3 whitespace-nowrap text-gray-800">{pid}</td>
                        <td className="px-5 py-3 text-gray-800">{p.name ?? 'Untitled'}</td>
                        <td className="px-5 py-3 text-gray-700">{p.category ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-800">{fmtINR(p.price)}</td>
                        <td className="px-5 py-3 text-gray-800">{p.quantity ?? p.stock ?? 0}</td>
                        <td className="px-5 py-3 text-gray-600">{p.description ?? '—'}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/edit-product/${pid}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border text-gray-700 hover:border-green-400 hover:text-green-700"
                              title="Edit"
                            >
                              ✏️ <span className="hidden sm:inline">Edit</span>
                            </Link>
                            <button
                              disabled={busyId === pid}
                              onClick={() => deleteProduct(pid, p.name)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border text-gray-700 hover:border-red-400 hover:text-red-600"
                              title="Delete"
                            >
                              🗑️ <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
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
