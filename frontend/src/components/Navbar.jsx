import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const isAuth = useSelector((state) => state.auth.isAuthenticated)
  const userType = useSelector((state) => state.auth.userType)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between">
      <div className="text-xl font-bold text-green-800">🌿 e-KrishiHub</div>

      <div className="flex gap-6 items-center text-green-700 font-medium">
        {isAuth && (
          <>
            <span className="capitalize">{userType}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
