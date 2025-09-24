import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from '../../api/axiosInstance'

export const fetchMyOrders = createAsyncThunk('orders/fetchMyOrders', async () => {
  const res = await axios.get('/orders/my-orders') // 🔁 Adjust endpoint if needed
  return res.data
})

// 🔄 Async thunk to place order
export const placeOrder = createAsyncThunk(
  'order/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/order', orderData)
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Order failed')
    }
  }
)

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null
      state.successMessage = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false
        state.successMessage = 'Order placed successfully!'
        state.orders.push(action.payload)
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearMessages } = orderSlice.actions

export default orderSlice.reducer
