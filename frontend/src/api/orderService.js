import api from "./axios";
import { loadRazorpay } from "../utils/razorpay";

export async function placeOrderFromCart() {
  // 1) ask backend to create an Order & Razorpay order
  const { data } = await api.post("/api/orders/create"); 
  // expect backend to return: { orderId, razorpayOrderId, amount, currency, key }
  return data;
}

export async function openRazorpayCheckout(init) {
  const ok = await loadRazorpay();
  if (!ok) throw new Error("Razorpay SDK failed to load.");

  return new Promise((resolve, reject) => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY || init.key,
      amount: Math.round(init.amount * 100), // in paise
      currency: init.currency || "INR",
      order_id: init.razorpayOrderId,       // <-- from backend
      name: "eKrishiHub",
      description: `Order #${init.orderId}`,
      handler: async function (response) {
        try {
          // 3) verify on server
          const verify = await api.post(`/api/orders/${init.orderId}/verify`, {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve(verify.data);
        } catch (e) {
          reject(e);
        }
      },
      prefill: { name: localStorage.getItem("name") || "", email: "" },
      theme: { color: "#3399cc" },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => reject(resp.error));
    rzp.open();
  });
}

export async function listMyOrders() {
  const { data } = await api.get("/api/orders/my");
  return data;
}
