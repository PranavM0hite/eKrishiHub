import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance'; // ← use the shared instance
import {
  setTasks,
  setTasksLoading,
  setTasksError,
  deleteTask as deleteTaskAction,
} from '../features/task/taskSlice';

const TaskList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { tasks, loading, error } = useSelector((state) => state.task);

  const formatDate = (s) => {
    if (!s) return '-';
    try { return new Date(s + 'T00:00:00').toLocaleDateString(); }
    catch { return s; }
  };

  const fetchTasks = async () => {
    dispatch(setTasksLoading(true));
    try {
      // axiosInstance already has baseURL '/api' and (if you set it) token interceptors
      const res = await axios.get('/tasks');          // ← unified endpoint
      const data = Array.isArray(res.data) ? res.data : [];
      dispatch(setTasks(data));
    } catch (e) {
      dispatch(setTasksError(e?.response?.data?.message || e.message || 'Failed to fetch tasks'));
    } finally {
      dispatch(setTasksLoading(false));
    }
  };

  const handleDelete = async (taskId) => {
    const ok = window.confirm('Are you sure you want to delete this task?');
    if (!ok) return;
    try {
      await axios.delete(`/tasks/${taskId}`);         // ← unified endpoint
      dispatch(deleteTaskAction(taskId));
    } catch (e) {
      console.error('Error deleting task:', e);
      alert(e?.response?.data?.message || 'Delete failed');
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-center">Loading tasks...</p>;
  if (error)   return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="bg-white rounded-xl shadow p-5 ">
      <div className="mb-3 flex items-center justify-between">
      </div>

      {tasks.length === 0 ? (
        <div className="text-center text-gray-500 p-6">
          <p className="text-lg">🧺 No tasks added yet.</p>
          <p className="text-sm">Start planning your farming schedule!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="border p-3 rounded-lg flex justify-between items-center hover:shadow-md transition-all"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-800">{task.title}</h3>
                <p className="text-sm text-gray-600">Description : {task.description}</p>
                <p className="text-sm text-gray-500">🗓 Due: {formatDate(task.dueDate)}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {task.status || 'PENDING'}
                </span>
                <button
                  onClick={() => navigate(`/edit-task/${task.id}`)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
