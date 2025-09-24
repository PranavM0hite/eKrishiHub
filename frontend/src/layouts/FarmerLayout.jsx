import React, { useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import FarmerNavbar from '../components/FarmerNavbar';

export default function FarmerLayout() {
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/farmer-login');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <FarmerNavbar onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs text-gray-500">
          <span>© {new Date().getFullYear()} eKrishiHub</span>
          <span className="hidden sm:inline">Grow smart. Sell better. 🌾</span>
        </div>
      </footer>
    </div>
  );
}
