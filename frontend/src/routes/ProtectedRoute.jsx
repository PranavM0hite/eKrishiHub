// src/routes/ProtectedRoute.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { isTokenExpired } from '../utils/checkTokenExpiry';
import { logout } from '../features/auth/authSlice';

/**
 * Use: <ProtectedRoute role="FARMER"> ... </ProtectedRoute>
 *      <ProtectedRoute role="CUSTOMER"> ... </ProtectedRoute>
 */
const ProtectedRoute = ({ role, children }) => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth) || {};

  // pick redirect based on required role
  const loginPath =
    String(role).toUpperCase() === 'CUSTOMER' ? '/customer-login' : '/farmer-login';

  // No token or expired -> logout & go to the correct login
  if (!token || isTokenExpired(token)) {
    dispatch(logout());
    return <Navigate to={loginPath} replace />;
  }

  // If a role is required, enforce it (uses Redux user.role or localStorage fallback)
  const currentRole =
    (user?.role || JSON.parse(localStorage.getItem('user') || '{}')?.role || '').toUpperCase();

  if (role && currentRole && currentRole !== String(role).toUpperCase()) {
    // logged in but wrong role: send them to their role's dashboard
    const fallback =
      currentRole === 'CUSTOMER' ? '/customer-dashboard' : '/farmer-dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
