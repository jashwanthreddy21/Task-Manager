import { create } from 'zustand';
import axios from 'axios';

// Backend Base URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

// Axios Instance Configuration
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure Axios Token Injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// State Store creation
export const useStore = create((set, get) => ({
  // Auth State
  user: null,
  accessToken: localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || null,
  refreshToken: localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token') || null,
  isAuthenticated: !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token')),
  authLoading: false,
  authError: null,

  // Dark Mode State
  darkMode: localStorage.getItem('darkMode') === 'true',

  // Tasks State
  tasks: [],
  tasksLoading: false,
  activeTask: null, // Currently selected task in detail workspace modal

  // Notifications State (Toasts)
  notifications: [],

  // WebSocket Connection
  ws: null,

  // Theme Methods
  toggleDarkMode: () => {
    const currentTheme = get().darkMode;
    const nextTheme = !currentTheme;
    localStorage.setItem('darkMode', String(nextTheme));
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ darkMode: nextTheme });
  },

  initTheme: () => {
    const darkMode = get().darkMode;
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  // Toast Notification Actions
  addNotification: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 4000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  // Authentication Actions
  login: async (email, password, rememberMe) => {
    set({ authLoading: true, authError: null });
    try {
      const response = await api.post('/api/auth/login', { email, password, remember_me: rememberMe });
      const { access_token, refresh_token } = response.data;

      if (rememberMe) {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
      } else {
        sessionStorage.setItem('access_token', access_token);
        sessionStorage.setItem('refresh_token', refresh_token);
      }

      set({ 
        accessToken: access_token, 
        refreshToken: refresh_token,
        isAuthenticated: true,
        authLoading: false 
      });

      await get().fetchCurrentUser();
      get().connectWebSocket();
      get().addNotification('Successfully logged in!', 'success');
      return true;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Login failed. Please verify credentials.';
      set({ authLoading: false, authError: msg });
      get().addNotification(msg, 'danger');
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ authLoading: true, authError: null });
    try {
      await api.post('/api/auth/register', { name, email, password });
      set({ authLoading: false });
      get().addNotification('Registration successful! Please login.', 'success');
      return true;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Registration failed.';
      set({ authLoading: false, authError: msg });
      get().addNotification(msg, 'danger');
      return false;
    }
  },

  logout: () => {
    // Close WebSocket
    if (get().ws) {
      get().ws.close();
    }
    
    // Clear storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');

    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false,
      tasks: [],
      ws: null
    });
    get().addNotification('Logged out successfully.', 'info');
  },

  fetchCurrentUser: async () => {
    try {
      const response = await api.get('/api/users/me');
      set({ user: response.data });
    } catch (error) {
      // Access token expired, retry with refresh
      const refreshed = await get().refreshSession();
      if (!refreshed) {
        get().logout();
      }
    }
  },

  refreshSession: async () => {
    const rToken = get().refreshToken;
    if (!rToken) return false;
    try {
      const response = await api.post('/api/auth/refresh', { refresh_token: rToken });
      const { access_token, refresh_token } = response.data;
      
      // Persist where it was
      const isLocal = !!localStorage.getItem('access_token');
      if (isLocal) {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
      } else {
        sessionStorage.setItem('access_token', access_token);
        sessionStorage.setItem('refresh_token', refresh_token);
      }
      
      set({ accessToken: access_token, refreshToken: refresh_token });
      return true;
    } catch (error) {
      return false;
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put('/api/users/update', data);
      set({ user: response.data });
      get().addNotification('Profile updated successfully!', 'success');
      return true;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Profile update failed.';
      get().addNotification(msg, 'danger');
      return false;
    }
  },

  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      set({ user: response.data });
      get().addNotification('Avatar uploaded successfully!', 'success');
      return true;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Avatar upload failed.';
      get().addNotification(msg, 'danger');
      return false;
    }
  },

  deleteAccount: async () => {
    try {
      await api.delete('/api/users/delete');
      get().logout();
      get().addNotification('Account deleted permanently.', 'info');
      return true;
    } catch (error) {
      get().addNotification('Failed to delete account.', 'danger');
      return false;
    }
  },

  // Task Actions
  fetchTasks: async (filters = {}) => {
    set({ tasksLoading: true });
    try {
      const params = {};
      if (filters.status) params.status_filter = filters.status;
      if (filters.priority) params.priority_filter = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.sortBy) params.sort_by = filters.sortBy;

      const response = await api.get('/api/tasks', { params });
      set({ tasks: response.data, tasksLoading: false });
    } catch (error) {
      set({ tasksLoading: false });
      get().addNotification('Failed to fetch tasks.', 'danger');
    }
  },

  fetchTaskDetails: async (taskId) => {
    try {
      const response = await api.get(`/api/tasks/${taskId}`);
      set({ activeTask: response.data });
      // update details in standard tasks list too
      set((state) => ({
        tasks: state.tasks.map((t) => t.id === taskId ? response.data : t)
      }));
    } catch (error) {
      get().addNotification('Failed to fetch task details.', 'danger');
    }
  },

  createTask: async (data) => {
    try {
      const response = await api.post('/api/tasks', data);
      set((state) => ({ tasks: [response.data, ...state.tasks] }));
      get().addNotification('Task created successfully!', 'success');
      return response.data;
    } catch (error) {
      get().addNotification('Failed to create task.', 'danger');
      return null;
    }
  },

  updateTask: async (taskId, data) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}`, data);
      set((state) => ({
        tasks: state.tasks.map((t) => t.id === taskId ? response.data : t),
        activeTask: state.activeTask?.id === taskId ? response.data : state.activeTask
      }));
      get().addNotification('Task updated successfully.', 'success');
      return response.data;
    } catch (error) {
      get().addNotification('Failed to update task.', 'danger');
      return null;
    }
  },

  patchTaskStatus: async (taskId, status) => {
    // Optimistic status update for drag & drop UI smoothness
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, status } : t)
    }));

    try {
      const response = await api.patch(`/api/tasks/${taskId}/status`, { status });
      set((state) => ({
        tasks: state.tasks.map((t) => t.id === taskId ? response.data : t),
        activeTask: state.activeTask?.id === taskId ? response.data : state.activeTask
      }));
      return response.data;
    } catch (error) {
      // Revert status on failure
      set({ tasks: previousTasks });
      get().addNotification('Failed to update task column.', 'danger');
      return null;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
        activeTask: state.activeTask?.id === taskId ? null : state.activeTask
      }));
      get().addNotification('Task deleted successfully.', 'success');
      return true;
    } catch (error) {
      get().addNotification('Failed to delete task.', 'danger');
      return false;
    }
  },

  // Comments & Attachments
  addComment: async (taskId, content) => {
    try {
      const response = await api.post(`/api/tasks/${taskId}/comments`, { content });
      if (get().activeTask?.id === taskId) {
        set((state) => ({
          activeTask: {
            ...state.activeTask,
            comments: [response.data, ...state.activeTask.comments]
          }
        }));
      }
      // Reload details to sync activities and counts
      get().fetchTaskDetails(taskId);
      return true;
    } catch (error) {
      get().addNotification('Failed to add comment.', 'danger');
      return false;
    }
  },

  addAttachment: async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/api/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (get().activeTask?.id === taskId) {
        set((state) => ({
          activeTask: {
            ...state.activeTask,
            attachments: [...state.activeTask.attachments, response.data]
          }
        }));
      }
      get().fetchTaskDetails(taskId);
      get().addNotification('Attachment uploaded successfully.', 'success');
      return true;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to upload attachment.';
      get().addNotification(msg, 'danger');
      return false;
    }
  },

  // WebSocket Integration for Live Collaborations
  connectWebSocket: () => {
    // Clean existing
    if (get().ws) {
      get().ws.close();
    }

    const ws = new WebSocket(`${WS_URL}/ws`);

    ws.onopen = () => {
      console.log('Real-time notifications channel connected.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Dispatch notifications on changes
        if (data.event === 'task_created') {
          get().addNotification(`New task "${data.title}" added by ${data.author}`, 'info');
          get().fetchTasks(); // reload
        } else if (data.event === 'task_updated') {
          get().addNotification(`Task "${data.title}" updated by ${data.author}`, 'info');
          // If we have active view details, sync them
          if (get().activeTask?.id === data.task_id) {
            get().fetchTaskDetails(data.task_id);
          } else {
            get().fetchTasks();
          }
        } else if (data.event === 'task_status_changed') {
          get().addNotification(`Task "${data.title}" moved to ${data.status} by ${data.author}`, 'success');
          if (get().activeTask?.id === data.task_id) {
            get().fetchTaskDetails(data.task_id);
          } else {
            get().fetchTasks();
          }
        } else if (data.event === 'task_deleted') {
          get().addNotification(`Task "${data.title}" deleted by ${data.author}`, 'warning');
          if (get().activeTask?.id === data.task_id) {
            set({ activeTask: null });
          }
          get().fetchTasks();
        } else if (data.event === 'comment_added') {
          if (get().activeTask?.id === data.task_id) {
            get().fetchTaskDetails(data.task_id);
          }
        } else if (data.event === 'attachment_uploaded') {
          if (get().activeTask?.id === data.task_id) {
            get().fetchTaskDetails(data.task_id);
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket socket event:', error);
      }
    };

    ws.onclose = () => {
      console.log('Real-time channel closed. Retrying in 10s...');
      // Re-establish session websocket after a delay
      setTimeout(() => {
        if (get().isAuthenticated) {
          get().connectWebSocket();
        }
      }, 10000);
    };

    set({ ws });
  }
}));

// Initialize store themes immediately on load
if (typeof window !== 'undefined') {
  const state = useStore.getState();
  state.initTheme();
}
