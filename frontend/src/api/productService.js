import api from "./axios";

export async function listProducts(params = {}) {
  // params: { q, category, minPrice, maxPrice, page, size }
  const { data } = await api.get("/api/products", { params });
  return data; // {content, totalElements, ...} or array depending on your API
}

export async function getProduct(id) {
  const { data } = await api.get(`/api/products/${id}`);
  return data;
}
