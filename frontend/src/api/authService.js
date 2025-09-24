import api from "./axios";

export async function login(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  // expecting { token: "...", role: "...", name: "..." }
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("name", data.name || "");
  return data;
}

export async function register(payload) {
  // choose endpoint based on role
  const url =
    payload.role === "FARMER"
      ? "/api/auth/register/farmer"
      : "/api/auth/register/customer";
  const { data } = await api.post(url, payload);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
}
