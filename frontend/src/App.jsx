import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import { 
  LayoutDashboard, 
  Columns, 
  ListTodo, 
  UserCircle, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Sun, 
  Moon,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle
} from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const fetchCurrentUser = useStore((state) => state.fetchCurrentUser);
  const connectWebSocket = useStore((state) => state.connectWebSocket);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
      connectWebSocket();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public/Auth Route Component
const AuthRoute = ({ children }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Global Toast Notifications Overlay
const ToastContainer = () => {
  const { notifications, removeNotification } = useStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        let bgColor = 'bg-blue-500';
        let Icon = Info;
        if (n.type === 'success') {
          bgColor = 'bg-emerald-500';
          Icon = CheckCircle2;
        } else if (n.type === 'warning') {
          bgColor = 'bg-amber-500';
          Icon = AlertTriangle;
        } else if (n.type === 'danger') {
          bgColor = 'bg-rose-500';
          Icon = AlertCircle;
        }

        return (
          <div
            key={n.id}
            className={`flex items-center gap-3 p-4 text-white rounded-xl shadow-lg pointer-events-auto backdrop-blur-md bg-opacity-90 transform translate-y-0 transition-all duration-300 border border-white/10`}
          >
            <Icon size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium flex-grow">{n.message}</p>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Sidebar / Layout Wrapper
const DashboardLayout = ({ children }) => {
  const { user, logout, darkMode, toggleDarkMode } = useStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Kanban Board', path: '/kanban', icon: Columns },
    { name: 'Tasks List', path: '/tasks', icon: ListTodo },
    { name: 'Profile Settings', path: '/profile', icon: UserCircle },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const avatarUrl = user?.avatar ? `${API_URL}${user.avatar}` : null;

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-slate-50 dark:bg-[#0b1329]">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/70 dark:bg-slate-900/70 border-r border-slate-200/50 dark:border-slate-800/40 backdrop-blur-lg transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex lg:flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/40">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-primary-500/20">
              S
            </div>
            <span className="font-bold font-sans text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              SaaSFlow
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer profile widget */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/40 bg-white/30 dark:bg-slate-900/30">
          <div className="flex items-center gap-3 mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-primary-500 object-cover shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold border border-primary-300/30">
                {user?.name?.substring(0, 2).toUpperCase() || 'US'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                {user?.name || 'Loading...'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || '...'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900/30 text-sm font-medium transition-all duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/40 backdrop-blur-lg flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white lg:hidden"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-bold font-sans text-slate-800 dark:text-white capitalize">
              {location.pathname.replace('/', '').replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell Icon */}
            <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500"></span>
            </button>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-grow p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Auth routes */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          }
        />

        {/* Protected app routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kanban"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Kanban />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Tasks />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Default Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
