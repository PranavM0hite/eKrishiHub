import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axiosInstance' // your backend client (baseURL = http://localhost:8080/api)

export const fetchWeather = createAsyncThunk(
  'weather/fetchWeather',
  async (city, { rejectWithValue }) => {
    try {
      // Call your backend proxy, NOT OpenWeather directly.
      // Important: remove Authorization to keep this a "simple" GET (no preflight).
      const res = await api.get('/weather', {
        params: { q: city, units: 'metric' },
        headers: { Authorization: undefined },
        transformRequest: [(data, headers) => {
          if (headers && 'Authorization' in headers) delete headers.Authorization
          return data
        }],
        withCredentials: false,
      })
      return res.data
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to fetch weather'
      return rejectWithValue(msg)
    }
  }
)

const initialState = {
  data: null,
  loading: false,
  error: null,
}

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeather.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWeather.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload // OpenWeather JSON proxied through your backend
        state.error = null
      })
      .addCase(fetchWeather.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to fetch weather'
      })
  },
})

export default weatherSlice.reducer
