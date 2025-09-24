// src/features/task/taskSlice.js

import { createSlice } from '@reduxjs/toolkit'

// Coerce any payload shape to a plain array
const normalizeTasks = (p) => {
  if (Array.isArray(p)) return p
  if (Array.isArray(p?.content)) return p.content
  if (Array.isArray(p?.data)) return p.data
  if (Array.isArray(p?.items)) return p.items
  // If a single object slipped in, wrap it (rare but safe)
  if (p && typeof p === 'object') return []
  return []
}

const initialState = {
  tasks: [],        // always an array
  loading: false,
  error: null,
}

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    // Use this after fetching from API
    setTasks: (state, action) => {
      state.tasks = normalizeTasks(action.payload)
      state.error = null
    },

    // Optional helpers (use in thunks/UI)
    setTasksLoading: (state, action) => {
      state.loading = !!action.payload
    },
    setTasksError: (state, action) => {
      state.error = action.payload ?? 'Something went wrong'
    },

    // Create
    addTask: (state, action) => {
      const t = action.payload
      if (!t) return
      state.tasks.push(t)
      state.error = null
    },

    // Update by id (supports id or taskId just in case)
    updateTask: (state, action) => {
      const updated = action.payload
      if (!updated) return
      const id = updated.id ?? updated.taskId
      const idx = state.tasks.findIndex((task) => (task.id ?? task.taskId) === id)
      if (idx !== -1) state.tasks[idx] = { ...state.tasks[idx], ...updated }
      state.error = null
    },

    // Delete by id
    deleteTask: (state, action) => {
      const id = action.payload
      state.tasks = state.tasks.filter((task) => (task.id ?? task.taskId) !== id)
      state.error = null
    },

    // (Optional) append when paginating
    appendTasks: (state, action) => {
      const more = normalizeTasks(action.payload)
      state.tasks = [...state.tasks, ...more]
    },
  },
})

export const {
  setTasks,
  setTasksLoading,
  setTasksError,
  addTask,
  updateTask,
  deleteTask,
  appendTasks,
} = taskSlice.actions

export default taskSlice.reducer
