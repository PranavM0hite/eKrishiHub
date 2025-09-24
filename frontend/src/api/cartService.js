import api from "./axios";

export async function addToCart(productId, quantity = 1) {
  const { data } = await api.post("/api/cart/items", { productId, quantity });
  return data;
}

export async function getCart() {
  const { data } = await api.get("/api/cart");
  return data; // { items: [ {id,product,quantity,subtotal} ], total }
}

export async function updateCartItem(cartItemId, quantity) {
  const { data } = await api.put(`/api/cart/items/${cartItemId}`, { quantity });
  return data;
}

export async function removeCartItem(cartItemId) {
  const { data } = await api.delete(`/api/cart/items/${cartItemId}`);
  return data;
}

export async function clearCart() {
  const { data } = await api.delete(`/api/cart`);
  return data;
}
