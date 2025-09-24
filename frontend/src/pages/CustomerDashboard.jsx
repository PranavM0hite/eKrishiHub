import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchPublicProducts as fetchProducts,
  selectProducts,
  selectProductsLoading,
  selectProductsError,
} from '../features/product/productSlice';

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.05 + i * 0.05 } }),
};
const tableVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, when: 'beforeChildren', staggerChildren: 0.05 } },
};
const rowVariants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

export default function CustomerDashboard() {
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const loading  = useSelector(selectProductsLoading);
  const error    = useSelector(selectProductsError);

  useEffect(() => { dispatch(fetchProducts()); }, [dispatch]);

  const fmtINR = (v) => {
    if (v == null || isNaN(v)) return '—';
    try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v); }
    catch { return `₹ ${Number(v).toFixed(2)}`; }
  };

  const list = Array.isArray(products) ? products : [];

  return (
    <div className="flex flex-col">
      {/* Heading */}
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="show" className="mb-6">
        <h1 className="text-3xl font-bold text-green-800 tracking-tight">Welcome!</h1>
        <p className="text-gray-600">Discover fresh produce from nearby farmers and place orders instantly.</p>
      </motion.div>

      {/* Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { k: 0, label: 'Fresh Produce', value: 'Browse' },
          { k: 1, label: 'Secure Orders', value: 'Place' },
          { k: 2, label: 'Track Orders',  value: 'View' },
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

      {/* Products preview */}
      <motion.section
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="rounded-xl bg-white p-4 shadow-sm border border-gray-200"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl">🛒</span>
          <h2 className="text-lg font-semibold text-green-700">Products Available from Farmers</h2>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              variants={tableVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="h-5 w-1/2 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-1/3 bg-gray-100 rounded mb-4" />
                  <div className="h-9 w-full bg-gray-100 rounded" />
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div key="error" variants={rowVariants} initial="hidden" animate="show" className="p-6 text-center text-red-600">
              {error}
            </motion.div>
          ) : list.length === 0 ? (
            <motion.div key="empty" variants={rowVariants} initial="hidden" animate="show" className="p-10 text-center text-gray-500">
              <div className="text-5xl mb-3">🧺</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No products right now</h3>
              <p>Check back soon for fresh items from farmers near you.</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              variants={tableVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
            >
              {list.map((p) => (
                <motion.div key={p.id} variants={rowVariants} className="bg-white shadow rounded-lg border border-gray-200 p-4 hover:shadow-md">
                  <h3 className="text-lg font-semibold text-green-800 truncate">{p.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3">{p.description || '—'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg text-green-700 font-bold">{fmtINR(p.price)}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.category || 'General'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
