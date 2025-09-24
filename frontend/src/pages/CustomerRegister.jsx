import React, { useEffect, useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import axios from '../api/axiosInstance'
import { useNavigate } from 'react-router-dom'
import PasswordField from '../components/PasswordField'

const CustomerRegister = () => {
  const navigate = useNavigate()

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)
  const RESEND_COOLDOWN = 60 // keep in sync with backend property

  useEffect(() => {
    if (!showOtpModal || resendSeconds <= 0) return
    const t = setInterval(() => setResendSeconds(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [showOtpModal, resendSeconds])

  const initialValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  }

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
  })

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const email = values.email.trim().toLowerCase()
      await axios.post('/auth/register', {
        name: values.name,
        email,
        password: values.password,
        role: 'CUSTOMER',
      })
      setPendingEmail(email)
      setOtp('')
      setOtpError('')
      setResendSeconds(RESEND_COOLDOWN)
      setShowOtpModal(true)
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Registration failed. Try a different email.'
      setErrors({ email: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async () => {
    setOtpError('')
    const code = otp.trim()
    if (!/^\d{6}$/.test(code)) {
      setOtpError('Please enter the 6-digit code')
      return
    }
    try {
      await axios.post('/auth/verify-otp', { email: pendingEmail, otp: code })
      setShowOtpModal(false)
      navigate('/customer-login')
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Invalid or expired OTP. Please try again.'
      setOtpError(msg)
    }
  }

  const handleResend = async () => {
    if (resendSeconds > 0) return
    setOtpError('')
    try {
      await axios.post('/auth/resend-otp', { email: pendingEmail })
      setResendSeconds(RESEND_COOLDOWN)
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Could not resend code. Please try again.'
      setOtpError(msg)
    }
  }

  const closeModal = () => setShowOtpModal(false)

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <motion.div
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">🧑‍🌾 Customer Register</h2>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-5">
              <div>
                <label className="block mb-1 text-sm font-medium">Full Name</label>
                <Field
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-green-300"
                />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Email</label>
                <Field
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-green-300"
                />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <PasswordField name="password" label="Password" autoComplete="new-password" />
              </div>

              <div>
                <PasswordField name="confirmPassword" label="Confirm Password" autoComplete="new-password" />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded shadow disabled:opacity-60"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>

              <p className="text-center text-sm text-gray-600 mt-3">
                Already have an account?{' '}
                <span
                  onClick={() => navigate('/customer-login')}
                  className="text-green-700 font-medium hover:underline cursor-pointer"
                >
                  Back to Login
                </span>
              </p>
            </Form>
          )}
        </Formik>
      </motion.div>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
              initial={{ scale: 0.95, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold text-green-700">Verify your email</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 rounded p-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-600 mt-2">
                We’ve sent a 6-digit verification code to <span className="font-medium">{pendingEmail}</span>.
                Enter it below to activate your account.
              </p>

              <div className="mt-5">
                <label className="block mb-1 text-sm font-medium">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(v)
                    setOtpError('')
                  }}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-green-300 tracking-widest text-center text-lg"
                  placeholder="••••••"
                />
                {otpError && <div className="text-red-600 text-sm mt-2">{otpError}</div>}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleVerifyOtp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded shadow"
                >
                  Verify
                </button>

                <button
                  onClick={handleResend}
                  disabled={resendSeconds > 0}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-800 py-2 rounded shadow"
                >
                  {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend Code'}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Didn’t get the email? Check Promotions/Spam. Resend is limited to prevent abuse.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomerRegister
