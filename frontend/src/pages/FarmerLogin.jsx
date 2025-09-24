// src/pages/FarmerLogin.jsx
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

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY; // <<< put your public site key here

// --- small helper: load CF Turnstile script once ---
const useTurnstileScript = () => {
  const [ready, setReady] = useState(!!window.turnstile);
  useEffect(() => {
    if (window.turnstile) {
      setReady(true);
      return;
    }
    const id = 'cf-turnstile-script';
    if (document.getElementById(id)) return; // already loading
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

const FarmerLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const turnstileReady = useTurnstileScript();

  // Turnstile widget state
  const widgetRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [tsToken, setTsToken] = useState('');
  const [tsLoading, setTsLoading] = useState(false);

  // Render/refresh widget when script ready
  useEffect(() => {
    if (!turnstileReady) return;
    if (!widgetRef.current) return;

    // If already rendered, reset instead of rendering again
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      return;
    }

    try {
      setTsLoading(true);
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'light',         // or 'auto' / 'dark'
        size: 'flexible',       // works well in forms
        callback: (token) => {  // called when solved/refreshed
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
          // auto-retry quietly
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
      toast.error('Security check unavailable. Please refresh the page.');
    }
    // no deps: render once when ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnstileReady]);

  const initialValues = { email: '', password: '' };

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
  });

  const normalizeRole = (input) => {
    const raw = Array.isArray(input) ? input[0] : (input ?? 'FARMER');
    return String(raw).toUpperCase().replace(/^ROLE_/, '');
  };

  const parseJwt = (token) => {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  };

  const toFriendly = (error) => {
    const status = error?.response?.status;
    const raw = String(
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      ''
    );

    if (status === 400 && /turnstile|captcha/i.test(raw)) {
      return { kind: 'TURNSTILE', banner: 'Please complete the security check and try again.' };
    }
    if (status === 401) {
      return { kind: 'CREDENTIALS', banner: 'Incorrect email or password. Please try again.' };
    }
    if (status === 400 && /content-type.*urlencoded|json.*not supported/i.test(raw)) {
      return {
        kind: 'FORMAT',
        banner: "We couldn't process your login. Please refresh and try again.",
      };
    }
    if (status === 400) {
      return { kind: 'BAD_REQUEST', banner: 'Please check your input and try again.' };
    }
    return { kind: 'GENERIC', banner: 'Login failed. Please try again.' };
  };

  const handleSubmit = async (values, { setSubmitting, setErrors, setStatus }) => {
    setStatus(null);
    try {
      if (!tsToken) {
        setStatus('Please complete the security check.');
        toast.error('Please complete the security check.');
        // Try to reset/refresh the widget to fetch a token
        try { window.turnstile?.reset(widgetIdRef.current); } catch {}
        return;
      }

      const email = values.email.trim().toLowerCase();
      const payloadJson = { email, username: email, password: values.password };

      // Attempt 1: JSON body with Turnstile header
      let res;
      try {
        res = await axios.post('/farmer-login', payloadJson, {
          headers: {
            'Content-Type': 'application/json',
            'X-Turnstile-Token': tsToken,      // <<< IMPORTANT
            Authorization: undefined,
          },
          transformRequest: [
            (data, headers) => {
              if (headers && 'Authorization' in headers) delete headers.Authorization;
              return JSON.stringify(data);
            },
          ],
          withCredentials: false,
        });
      } catch (e) {
        if (e?.response?.status === 400) {
          // Fallback 2: form-urlencoded with same header
          const form = new URLSearchParams();
          form.append('username', email);
          form.append('password', values.password);
          res = await axios.post('/farmer-login', form, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Turnstile-Token': tsToken,    // <<< IMPORTANT
              Authorization: undefined,
            },
            transformRequest: [
              (data, headers) => {
                if (headers && 'Authorization' in headers) delete headers.Authorization;
                return data;
              },
            ],
            withCredentials: false,
          });
        } else {
          throw e;
        }
      }

      const data  = res?.data || {};
      const token = data.token || data.jwt || data.accessToken || data.id_token;
      const roleFromServer = data.role;
      if (!token) throw new Error('Malformed login response');

      const claims = parseJwt(token);
      const user = {
        email: (claims?.email || claims?.sub || email),
        role: normalizeRole(claims?.role || roleFromServer || 'FARMER'),
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch(loginSuccess({ token, user, userType: user.role }));
      toast.success('Login successful!');

      if (user.role === 'FARMER') navigate('/farmer-dashboard');
      else if (user.role === 'CUSTOMER') navigate('/customer-dashboard');
      else navigate('/');
    } catch (error) {
      const friendly = toFriendly(error);
      if (friendly.kind === 'CREDENTIALS') {
        setErrors({ password: 'Incorrect email or password' });
      }
      setStatus(friendly.banner);
      toast.error(friendly.banner);
      // Refresh the widget/token after any error
      try { window.turnstile?.reset(widgetIdRef.current); } catch {}
      setTsToken('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <motion.div
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-extrabold mb-4 text-green-700 text-center">
          👩‍🌾 Farmer Login
        </h2>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting, status }) => (
            <Form className="space-y-4" noValidate>
              {/* Friendly error banner */}
              {status && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm"
                  role="alert"
                  aria-live="polite"
                >
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
                <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
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
                <Link to="/farmer-register" className="text-green-700 font-medium hover:underline hover:text-blue-900">
                  Create a farmer account
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

export default FarmerLogin;
