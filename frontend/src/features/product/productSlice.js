// src/features/product/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axiosInstance'

// Normalize any backend shape into a plain array
const normalizeProducts = (p) => {
  if (Array.isArray(p)) return p
  if (Array.isArray(p?.content)) return p.content
  if (Array.isArray(p?.data)) return p.data
  if (Array.isArray(p?.items)) return p.items
  return []
}

// ---- Thunks ----

// Public list (for customers)
export const fetchPublicProducts = createAsyncThunk(
  'product/fetchPublicProducts',
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/products') // <- USE api, not axios
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || 'Failed to fetch products'
      )
    }
  }
)

// Farmer-scoped list (requires auth)
export const fetchFarmerProducts = createAsyncThunk(
  'product/fetchFarmerProducts',
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/farmer/products') // <- USE api, not axios
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || 'Failed to fetch my products'
      )
    }
  }
)

// Back-compat alias so older imports keep working
export const fetchProducts = fetchPublicProducts

const initialState = {
  products: [],
  loading: false,
  error: null,
}

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = normalizeProducts(action.payload)
      state.error = null
    },
    appendProducts: (state, action) => {
      const more = normalizeProducts(action.payload)
      state.products = [...state.products, ...more]
    },
    clearProducts: (state) => {
      state.products = []
      state.error = null
      state.loading = false
    },
  },
  extraReducers: (builder) => {
    const addCases = (thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.loading = true
          state.error = null
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false
          state.products = normalizeProducts(action.payload)
          state.error = null
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false
          state.error = action.payload ?? 'Failed to load products'
          state.products = []
        })
    }
    addCases(fetchPublicProducts)
    addCases(fetchFarmerProducts)
  },
})

export const { setProducts, appendProducts, clearProducts } = productSlice.actions
export const selectProducts = (state) => state.product.products
export const selectProductsLoading = (state) => state.product.loading
export const selectProductsError = (state) => state.product.error
export default productSlice.reducer
