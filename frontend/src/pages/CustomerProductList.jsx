import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosInstance';

/* helpers */
const normalizeProducts = (p) => {
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.content)) return p.content;
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p?.items)) return p.items;
  return [];
};
const fmtINR = (v) => {
  if (v == null || isNaN(v)) return '—';
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(v)); }
  catch { return `₹ ${Number(v).toFixed(2)}`; }
};
const normCat = (raw) => {
  const s = String(raw || '').trim().toUpperCase();
  if (/^GRAIN(S)?$/.test(s)) return 'GRAIN';
  if (/^FRUIT(S)?$/.test(s)) return 'FRUIT';
  if (/^VEG(ETABLE)?(S)?$/.test(s)) return 'VEGETABLE';
  return s && s !== 'GENERAL' ? s : 'OTHER';
};
const catLabel = (c) => c === 'GRAIN' ? 'Grains' : c === 'FRUIT' ? 'Fruits' : c === 'VEGETABLE' ? 'Vegetables' : 'Other';

/* motion */
const cardVariants  = { hidden: { opacity: 0, y: 10 }, show: (i=0)=>({ opacity:1, y:0, transition:{ duration:0.35, delay:0.05+i*0.05 } }) };
const tableVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, when: 'beforeChildren', staggerChildren: 0.05 } } };
const rowVariants   = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

export default function CustomerProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [activeCat, setActiveCat] = useState('ALL');

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await api.get('/products');
        const list = normalizeProducts(res?.data).map(p => ({ ...p, _cat: normCat(p.category) }));
        if (!ignore) setProducts(list);
      } catch (e) {
        if (!ignore) {
          setError(e?.response?.data?.message || e.message || 'Failed to load products.');
          setProducts([]);
        }
      } finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, []);

  const counts = useMemo(() => {
    const c = { GRAIN: 0, FRUIT: 0, VEGETABLE: 0, OTHER: 0 };
    for (const p of products) c[p._cat ?? 'OTHER'] = (c[p._cat ?? 'OTHER'] || 0) + 1;
    c.ALL = products.length;
    return c;
  }, [products]);

  const visible = useMemo(() => activeCat === 'ALL' ? products : products.filter(p => (p._cat ?? 'OTHER') === activeCat), [products, activeCat]);

  const pills = [
    { key: 'ALL',       label: `All (${counts.ALL || 0})` },
    { key: 'GRAIN',     label: `Grains (${counts.GRAIN || 0})` },
    { key: 'FRUIT',     label: `Fruits (${counts.FRUIT || 0})` },
    { key: 'VEGETABLE', label: `Vegetables (${counts.VEGETABLE || 0})` },
    { key: 'OTHER',     label: `Other (${counts.OTHER || 0})` },
  ];

  return (
    <div className="flex flex-col">
      {/* Heading */}
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="show" className="mb-6">
        <h1 className="text-3xl font-bold text-green-800 tracking-tight">Available Products</h1>
        <p className="text-gray-600">Browse fresh produce from local farmers and place your order.</p>
      </motion.div>

      {/* Card */}
      <motion.section custom={1} variants={cardVariants} initial="hidden" animate="show" className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
        <div className="mb-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥬</span>
            <h2 className="text-lg font-semibold text-green-700">Products</h2>
          </div>
          <button
            onClick={() => navigate('/my-orders')}
            className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 shadow"
          >
            📋 View My Orders
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pills.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveCat(key)}
              className={
                `text-xs sm:text-sm px-3 py-1.5 rounded-full border transition ` +
                (activeCat === key
                  ? 'bg-green-600 text-white border-green-600 shadow'
                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50')
              }
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" variants={tableVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
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
          ) : visible.length === 0 ? (
            <motion.div key="empty" variants={rowVariants} initial="hidden" animate="show" className="p-10 text-center text-gray-500">
              <div className="text-5xl mb-3">🧺</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                No {activeCat === 'ALL' ? '' : `${catLabel(activeCat).toLowerCase()} `}products right now
              </h3>
              <p>Try another category or check back soon for fresh items.</p>
            </motion.div>
          ) : (
            <motion.div key="grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" variants={tableVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              {visible.map((p) => {
                const id  = p.id ?? p.productId;
                const qty = p.quantity ?? p.stock;
                return (
                  <motion.div key={id} variants={rowVariants} className="bg-white shadow rounded-lg border border-gray-200 p-4 hover:shadow-md">
                    <h3 className="text-lg font-semibold text-green-800 truncate">{p.name ?? 'Untitled product'}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3">{p.description || '—'}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg text-green-700 font-bold">{fmtINR(p.price)}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {catLabel(p._cat)}
                      </span>
                    </div>
                    {qty != null && <p className="text-xs text-gray-500 mt-1">Qty available: {qty}</p>}
                    <button className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={() => navigate(`/place-order/${id}`)}>
                      🛒 Place Order
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
