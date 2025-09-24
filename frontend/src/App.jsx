// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import FarmerLogin from './pages/FarmerLogin'
import CustomerLogin from './pages/CustomerLogin'
import FarmerRegister from './pages/FarmerRegister'
import CustomerRegister from './pages/CustomerRegister'
import FarmerDashboard from './pages/FarmerDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import ProtectedRoute from './routes/ProtectedRoute'
import AddTask from './pages/AddTask'
import EditTask from './pages/EditTask'
import AddProduct from './pages/AddProduct'
import EditProduct from './pages/EditProduct'
import CustomerProductList from './pages/CustomerProductList'
import PlaceOrder from './pages/PlaceOrder'
import MyOrders from './pages/MyOrders'
import FarmerOrders from './pages/FarmerOrders'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import OrderHistory from './pages/OrderHistory'
import TaskPage from './pages/TaskPage'
import ProductPage from './pages/ProductPage'

// Layouts
import FarmerLayout from './layouts/FarmerLayout'
import CustomerLayout from './layouts/CustomerLayout'

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/farmer-login" element={<FarmerLogin />} />
          <Route path="/customer-login" element={<CustomerLogin />} />
          <Route path="/farmer-register" element={<FarmerRegister />} />
          <Route path="/customer-register" element={<CustomerRegister />} />

          {/* CUSTOMER routes with persistent layout */}
          <Route
            element={
              <ProtectedRoute role="CUSTOMER">
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/products" element={<CustomerProductList />} />
            <Route path="/place-order/:productId" element={<PlaceOrder />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/order-history" element={<OrderHistory />} />
          </Route>

          {/* FARMER routes with persistent layout */}
          <Route
            element={
              <ProtectedRoute role="FARMER">
                <FarmerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
            <Route path="/tasks" element={<TaskPage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/farmer-orders" element={<FarmerOrders />} />
            <Route path="/add-task" element={<AddTask />} />
            <Route path="/edit-task/:id" element={<EditTask />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/edit-product/:id" element={<EditProduct />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </>
  )
}

export default App
