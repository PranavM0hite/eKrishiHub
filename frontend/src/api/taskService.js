import api from "./axios";

export async function createTask(payload) {
  // { title, dueDate, status }
  const { data } = await api.post("/api/tasks", payload);
  return data;
}

export async function listMyTasks() {
  const { data } = await api.get("/api/tasks");
  return data;
}

export async function updateTask(id, payload) {
  const { data } = await api.put(`/api/tasks/${id}`, payload);
  return data;
}

export async function deleteTask(id) {
  const { data } = await api.delete(`/api/tasks/${id}`);
  return data;
}
