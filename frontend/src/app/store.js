import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import productReducer from '../features/product/productSlice'
import taskReducer from '../features/task/taskSlice'
import weatherReducer from '../features/weather/weatherSlice'
import orderReducer from '../features/order/orderSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    task: taskReducer,
    weather: weatherReducer,
    order: orderReducer,
  },
})
