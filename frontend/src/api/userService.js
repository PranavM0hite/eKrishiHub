import api from "./axios";

export async function getProfile() {
  const { data } = await api.get("/api/profile/me");
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put("/api/profile/me", payload);
  return data;
}
