// src/pages/FarmerDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import WeatherWidget from '../components/WeatherWidget';
import TaskList from '../components/TaskList';
import ProductList from '../components/ProductList';

/* ----------------------------- Motion helpers ---------------------------- */
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: 0.05 + i * 0.05 },
  }),
};

export default function FarmerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="mb-2"
      >
        <h1 className="text-3xl font-bold text-green-800 tracking-tight">
          Welcome, Farmer!
        </h1>
        <p className="text-gray-600">
          Get today’s weather, manage your tasks, and keep products up to date.
        </p>
      </motion.div>

      {/* Quick tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { k: 0, label: 'Weather', value: 'Live' },
          { k: 1, label: 'Tasks', value: 'Plan' },
          { k: 2, label: 'Products', value: 'Manage' },
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

      {/* Content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather */}
        <motion.section
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="rounded-xl bg-white p-4 shadow-sm border border-gray-200"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl">🌦️</span>
            <h2 className="text-lg font-semibold text-green-700">
              Weather Forecast
            </h2>
          </div>
          <WeatherWidget />
        </motion.section>

        {/* Tasks */}
        <motion.section
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="rounded-xl bg-white p-4 shadow-sm border border-gray-200"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🗓️</span>
              <h2 className="text-lg font-semibold text-green-700">
                My Farming Tasks
              </h2>
            </div>
            <button
              onClick={() => navigate('/add-task')}
              className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow"
            >
              ➕ Add Task
            </button>
          </div>
          <TaskList />
        </motion.section>

        {/* Products */}
        <motion.section
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 rounded-xl bg-white p-4 shadow-sm border border-gray-200"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌾</span>
              <h2 className="text-lg font-semibold text-green-700">
                My Products
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/add-product')}
                className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 shadow"
              >
                ➕ Add Product
              </button>
            </div>
          </div>
          <ProductList />
        </motion.section>
      </div>
    </div>
  );
}
