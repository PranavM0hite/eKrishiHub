import React, { useMemo } from 'react';
import { NavLink, Link } from 'react-router-dom';

const FarmerNavbar = React.memo(function FarmerNavbar({ onLogout }) {
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
  const email = user?.email || 'farmer@ekrishihub';

  const active = 'text-green-800 font-semibold border-b-2 border-green-600 pb-1';
  const idle   = 'text-gray-600 hover:text-green-700 pb-1 transition-colors';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
      <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/farmer-dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="text-lg sm:text-xl font-bold text-green-700 tracking-tight">
            eKrishiHub <span className="text-gray-400">Farmer</span>
          </span>
        </Link>

        {/* Tabs */}
        <ul className="hidden md:flex items-center gap-6 text-sm">
          <li><NavLink to="/farmer-dashboard" className={({isActive}) => isActive ? active : idle}>Dashboard</NavLink></li>
          <li><NavLink to="/tasks"           className={({isActive}) => isActive ? active : idle}>Tasks</NavLink></li>
          <li><NavLink to="/product"         className={({isActive}) => isActive ? active : idle}>Products</NavLink></li>
          <li><NavLink to="/farmer-orders"   className={({isActive}) => isActive ? active : idle}>Orders</NavLink></li>
        </ul>

        {/* User / Logout */}
        <div className="flex items-center gap-3">
          <span
            className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 max-w-[220px] truncate"
            title={email}
          >
            {email}
          </span>
          <button
            onClick={onLogout}
            className="rounded-md bg-green-600 text-white px-3 py-1.5 text-sm hover:bg-green-700 shadow"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
});

export default FarmerNavbar;
