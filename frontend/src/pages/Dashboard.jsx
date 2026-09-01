import React, { useEffect, useState } from 'react';
import { api, useStore } from '../store/useStore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Activity as ActivityIcon,
  Calendar,
  Layers
} from 'lucide-react';

export default function Dashboard() {
  const user = useStore((state) => state.user);
  const tasks = useStore((state) => state.tasks);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/api/analytics');
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [tasks]); // Refresh dashboard if tasks change

  if (loading || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Aggregating workspace analytics...</p>
        </div>
      </div>
    );
  }

  const { summary, status_distribution, priority_distribution, weekly_productivity, recent_activities } = data;

  const cardStats = [
    {
      title: 'Total Tasks',
      value: summary.total_tasks,
      icon: ClipboardList,
      gradient: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      description: 'Active items in workspace'
    },
    {
      title: 'In Progress',
      value: summary.in_progress_tasks,
      icon: Clock,
      gradient: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      description: 'Tasks being worked on'
    },
    {
      title: 'Completed',
      value: summary.completed_tasks,
      icon: CheckCircle,
      gradient: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      description: 'Successfully finished'
    },
    {
      title: 'Pending Incomplete',
      value: summary.incomplete_tasks,
      icon: AlertCircle,
      gradient: 'from-slate-500/10 to-slate-700/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      description: 'Backlog items to begin'
    }
  ];

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 text-white p-3 rounded-xl border border-white/10 text-xs backdrop-blur-md shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          <p className="flex items-center gap-1.5 font-medium text-emerald-400">
            Completed: <span className="text-white font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full pointer-events-none"></div>
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">
            Welcome back, {user?.name || 'Developer'}! 👋
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here is a glance at your productivity stats and active team sprints.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-500/10">
          <Calendar size={14} />
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`glass-panel p-6 border flex items-center justify-between bg-gradient-to-br ${stat.gradient} hover:-translate-y-0.5 transition-all duration-300`}>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</span>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{stat.description}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 shadow-md">
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Area Chart */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary-500" size={20} />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Weekly Productivity</h3>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Last 7 Days</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly_productivity}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="date" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis allowDecimals={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="glass-panel p-6 space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="text-indigo-500" size={20} />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Status Spread</h3>
            </div>
          </div>

          <div className="h-48 relative flex items-center justify-center">
            {summary.total_tasks === 0 ? (
              <p className="text-slate-400 text-xs font-medium">No tasks logged in database</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={status_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
            {summary.total_tasks > 0 && (
              <div className="absolute text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Progress</span>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {Math.round((summary.completed_tasks / summary.total_tasks) * 100)}%
                </p>
              </div>
            )}
          </div>

          {/* Pie Chart Legend */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-200/50 dark:border-slate-800/40 pt-4">
            {status_distribution.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority distribution chart */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Priority Load</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total metrics</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priority_distribution} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="name" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis allowDecimals={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/90 text-white p-2.5 rounded-lg text-xs border border-white/10">
                          Count: <span className="font-extrabold text-indigo-400">{payload[0].value}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priority_distribution.map((entry, index) => {
                    const colors = {
                      Low: '#10B981',
                      Medium: '#F59E0B',
                      High: '#EF4444'
                    };
                    return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#2563eb'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent activity timeline */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon className="text-emerald-500" size={20} />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Activity Timeline</h3>
            </div>
            <span className="text-xs text-slate-400">Live Workspace Updates</span>
          </div>

          <div className="space-y-4 max-h-[17rem] overflow-y-auto pr-2">
            {recent_activities.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No activity logs found. Start completing tasks to track progress history.
              </div>
            ) : (
              recent_activities.map((act) => (
                <div key={act.id} className="flex gap-3 items-start text-xs border-b border-slate-100 dark:border-slate-800/40 pb-3 last:border-b-0 last:pb-0">
                  <div className="w-6.5 h-6.5 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400 font-bold border border-slate-200/50 dark:border-slate-700/30">
                    {act.user_name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      <span className="font-bold text-slate-900 dark:text-white">{act.user_name}</span>{' '}
                      {act.action}{' '}
                      <span className="font-semibold text-primary-500 dark:text-primary-400 truncate">
                        "{act.task_title}"
                      </span>
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(act.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}{' '}
                      &bull; {new Date(act.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
