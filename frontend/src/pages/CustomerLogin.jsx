// src/pages/CustomerLogin.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import axios from '../api/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../features/auth/authSlice';
import { toast } from 'react-toastify';
import PasswordField from '../components/PasswordField';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY; // <<< replace with your site key

// --- Load Cloudflare Turnstile script once ---
const useTurnstileScript = () => {
  const [ready, setReady] = useState(!!window.turnstile);
  useEffect(() => {
    if (window.turnstile) {
      setReady(true);
      return;
    }
    const id = 'cf-turnstile-script';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = () => setReady(true);
    s.onerror = () => {
      console.error('Failed to load Cloudflare Turnstile');
      toast.error('Security check failed to load. Please refresh.');
    };
    document.body.appendChild(s);
  }, []);
  return ready;
};

const CustomerLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const turnstileReady = useTurnstileScript();

  // Turnstile state
  const widgetRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [tsToken, setTsToken] = useState('');
  const [tsLoading, setTsLoading] = useState(false);

  // Render widget when ready
  useEffect(() => {
    if (!turnstileReady) return;
    if (!widgetRef.current) return;

    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      return;
    }

    try {
      setTsLoading(true);
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'light',
        size: 'flexible',
        callback: (token) => {
          setTsToken(token || '');
          setTsLoading(false);
        },
        'error-callback': () => {
          setTsToken('');
          setTsLoading(false);
          toast.error('Security check failed. Please try again.');
        },
        'expired-callback': () => {
          setTsToken('');
          try { window.turnstile.reset(widgetIdRef.current); } catch {}
        },
        'timeout-callback': () => {
          setTsToken('');
          try { window.turnstile.reset(widgetIdRef.current); } catch {}
        },
      });
    } catch (e) {
      console.error('Turnstile render error', e);
      setTsLoading(false);
    }
  }, [turnstileReady]);

  const initialValues = { email: '', password: '' };

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
  });

  // Try JSON first, fall back to form-encoded
  const loginRequest = async (email, password) => {
    const username = email.trim().toLowerCase();

    try {
      return await axios.post(
        '/customer-login',
        { username, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Turnstile-Token': tsToken, // <<< send Turnstile token
            Authorization: undefined,
          },
          transformRequest: [(data, headers) => {
            if (headers && 'Authorization' in headers) delete headers.Authorization;
            return JSON.stringify(data);
          }],
          withCredentials: false,
        }
      );
    } catch (e) {
      if (e?.response?.status === 400) {
        const form = new URLSearchParams();
        form.append('username', username);
        form.append('password', password);
        return axios.post('/customer-login', form, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Turnstile-Token': tsToken,
            Authorization: undefined,
          },
          transformRequest: [(data, headers) => {
            if (headers && 'Authorization' in headers) delete headers.Authorization;
            return data;
          }],
          withCredentials: false,
        });
      }
      throw e;
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors, setStatus }) => {
    setStatus(null);
    try {
      if (!tsToken) {
        setStatus('Please complete the security check.');
        toast.error('Please complete the security check.');
        try { window.turnstile?.reset(widgetIdRef.current); } catch {}
        return;
      }

      const res = await loginRequest(values.email, values.password);
      const data = res?.data || {};

      const token = data.token || data.jwt || data.accessToken || data.id_token;
      if (!token) throw new Error('Malformed login response');

      const user = {
        email: values.email.trim().toLowerCase(),
        role: String(data.role || 'CUSTOMER').toUpperCase(),
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch(loginSuccess({ token, user, userType: user.role }));
      toast.success('Login successful!');

      if (user.role === 'CUSTOMER') navigate('/customer-dashboard');
      else if (user.role === 'FARMER') navigate('/farmer-dashboard');
      else navigate('/');
    } catch (error) {
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || '';

      if (status === 400 && /turnstile|captcha/i.test(serverMsg)) {
        setStatus('Security check failed. Please try again.');
        toast.error('Security check failed. Please try again.');
      } else if (status === 401) {
        setErrors({ password: 'Invalid email or password' });
        setStatus('Invalid email or password');
        toast.error('Invalid email or password');
      } else {
        setStatus('Login failed. Please try again.');
        toast.error('Login failed. Please try again.');
      }
      try { window.turnstile?.reset(widgetIdRef.current); } catch {}
      setTsToken('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <motion.div
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">🧑‍🌾 Customer Login</h2>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting, status }) => (
            <Form className="space-y-5" noValidate>
              {status && (
                <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm" role="alert">
                  {status}
                </div>
              )}

              <div>
                <label className="block mb-1 text-sm font-medium">Email</label>
                <Field
                  name="email"
                  type="email"
                  autoComplete="username"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-green-300"
                />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <PasswordField name="password" label="Password" />
              </div>

              {/* Turnstile widget */}
              <div className="mt-2">
                <label className="block mb-1 text-sm font-medium">Security Check</label>
                <div
                  ref={widgetRef}
                  className="cf-turnstile"
                  style={{ minHeight: 70 }}
                  aria-busy={tsLoading ? 'true' : 'false'}
                />
                {!tsToken && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    {tsLoading ? 'Loading…' : 'Please complete the security check above.'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !tsToken}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded shadow disabled:opacity-60"
              >
                {isSubmitting ? 'Logging in…' : 'Login'}
              </button>

              <p className="text-center text-sm text-gray-600">
                New here?{' '}
                <Link to="/customer-register" className="text-green-700 font-medium hover:underline hover:text-blue-900">
                  Create a customer account
                </Link>
              </p>
              <p className="text-center text-sm text-gray-600 mt-2">
                <Link to="/" className="text-green-700 font-medium hover:underline hover:text-red-800">
                  ← Back to Home
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </motion.div>
    </div>
  );
};

export default CustomerLogin;
