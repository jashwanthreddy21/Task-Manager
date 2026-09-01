import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import TaskDetailsModal from '../components/TaskDetailsModal';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Eye, 
  Trash2, 
  Calendar,
  AlertTriangle,
  FolderOpen,
  X,
  Edit2
} from 'lucide-react';

export default function Tasks() {
  const { 
    tasks, 
    tasksLoading, 
    fetchTasks, 
    createTask, 
    updateTask, 
    deleteTask,
    activeTask,
    fetchTaskDetails
  } = useStore();

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modal Control States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Create Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskStatus, setTaskStatus] = useState('Incomplete');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [formError, setFormError] = useState('');

  // Open Details Modal
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchTasks({ search, status, priority, sortBy });
  }, [search, status, priority, sortBy]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setTaskPriority('Medium');
    setTaskStatus('Incomplete');
    setDueDate('');
    setTagsInput('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setDueDate(task.due_date ? new Date(task.due_date).toISOString().substring(0, 10) : '');
    setTagsInput(task.tags ? task.tags.map(t => t.name).join(', ') : '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    const taskPayload = {
      title: title.trim(),
      description: description.trim() || null,
      priority: taskPriority,
      status: taskStatus,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      tags: tagsArray
    };

    let result;
    if (editingTask) {
      result = await updateTask(editingTask.id, taskPayload);
    } else {
      result = await createTask(taskPayload);
    }

    if (result) {
      setModalOpen(false);
      fetchTasks({ search, status, priority, sortBy });
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to permanently delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const handleRowClick = async (taskId) => {
    await fetchTaskDetails(taskId);
    setDetailsOpen(true);
  };

  // Priority styling util
  const getPriorityStyle = (p) => {
    if (p === 'High') return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/10';
    if (p === 'Medium') return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10';
    return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/10';
  };

  // Status styling util
  const getStatusStyle = (s) => {
    if (s === 'Complete') return 'bg-emerald-500 text-white';
    if (s === 'Progress') return 'bg-amber-500 text-white';
    return 'bg-slate-700 text-white';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">Workspace Tasks</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage, sort, and add details to your developer roadmap.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-primary-500/15 active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          Create Task
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search task title/description..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary-500 dark:focus:border-primary-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-400 flex-shrink-0" />
          <select
            className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-600 dark:text-slate-300"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Progress">In Progress</option>
            <option value="Complete">Complete</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-400 flex-shrink-0" />
          <select
            className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-600 dark:text-slate-300"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Sort By Filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-400 flex-shrink-0" />
          <select
            className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-600 dark:text-slate-300"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority Order</option>
          </select>
        </div>
      </div>

      {/* Task List Representation Table */}
      {tasksLoading ? (
        <div className="glass-panel py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-xs">Querying database schema...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel py-16 flex flex-col items-center justify-center gap-4 text-center">
          <FolderOpen size={44} className="text-slate-300 dark:text-slate-700" />
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300">No tasks matched filter settings</h4>
            <p className="text-xs text-slate-400 mt-1">Try resetting parameters or create a new team task card.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-semibold bg-primary-100 hover:bg-primary-200 dark:bg-primary-950/40 dark:hover:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-300/20"
          >
            Add First Task
          </button>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/50 dark:border-slate-800/40">
                  <th className="px-6 py-4">Title & Description</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Tags</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {tasks.map((task) => (
                  <tr 
                    key={task.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                    onClick={() => handleRowClick(task.id)}
                  >
                    <td className="px-6 py-4.5 max-w-sm">
                      <div className="font-semibold text-slate-800 dark:text-white group-hover:text-primary-500 truncate transition-colors text-sm">
                        {task.title}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">
                        {task.description || 'No description provided.'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getPriorityStyle(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase ${getStatusStyle(task.status)}`}>
                        {task.status === 'Progress' ? 'In Progress' : task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {task.due_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-medium">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {task.tags && task.tags.length > 0 ? (
                          task.tags.map((tag) => (
                            <span 
                              key={tag.id} 
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold"
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-xs">--</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleRowClick(task.id)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                          title="Workspace detail overlay"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                          title="Quick edit fields"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-colors"
                          title="Delete card permanently"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Creation & Update Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full pointer-events-none"></div>
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                {editingTask ? 'Modify Roadmap Task' : 'Formulate New Task'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleSaveTask} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {formError && (
                <div className="flex gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/10 text-xs font-semibold">
                  <AlertTriangle size={15} />
                  {formError}
                </div>
              )}

              {/* Task Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Task Title *</label>
                <input
                  type="text"
                  placeholder="Summarize the work item..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-400"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Specify task instructions, goals, and checklists..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-400 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Priority & Status inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Priority</label>
                  <select
                    className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none text-sm"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</label>
                  <select
                    className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none text-sm"
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                  >
                    <option value="Incomplete">Incomplete</option>
                    <option value="Progress">In Progress</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Due Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary-500 transition-all"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Tags comma-separated */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="frontend, backend, design, bug"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-400"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-primary-500/10 active:scale-[0.98] transition-all"
                >
                  Save Task Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Workspace Details Modal */}
      {detailsOpen && activeTask && (
        <TaskDetailsModal onClose={() => setDetailsOpen(false)} />
      )}
    </div>
  );
}
