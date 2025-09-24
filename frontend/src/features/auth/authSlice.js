import { createSlice } from '@reduxjs/toolkit'

const token = localStorage.getItem('token')
const userType = localStorage.getItem('userType')

const initialState = {
  token: token || null,
  userType: userType || null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token
      state.userType = action.payload.userType
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('userType', action.payload.userType)
    },
    logout: (state) => {
      state.token = null
      state.userType = null
      localStorage.removeItem('token')
      localStorage.removeItem('userType')
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions

export default authSlice.reducer
