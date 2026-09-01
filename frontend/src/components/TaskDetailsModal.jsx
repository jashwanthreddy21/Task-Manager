import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  X, 
  MessageSquare, 
  Paperclip, 
  History, 
  Send, 
  File, 
  Calendar,
  AlertCircle,
  Tag,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function TaskDetailsModal({ onClose }) {
  const { 
    activeTask, 
    addComment, 
    addAttachment, 
    patchTaskStatus 
  } = useStore();

  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  if (!activeTask) return null;

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommenting(true);
    const success = await addComment(activeTask.id, commentText.trim());
    if (success) {
      setCommentText('');
    }
    setCommenting(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setAttachmentError('Attachment exceeds maximum limit of 10MB');
      return;
    }
    setAttachmentError('');

    setUploading(true);
    await addAttachment(activeTask.id, file);
    setUploading(false);
  };

  const handleStatusChange = async (newStatus) => {
    await patchTaskStatus(activeTask.id, newStatus);
  };

  // Helper size formatter
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Status lists
  const statuses = [
    { name: 'Incomplete', bg: 'bg-slate-700' },
    { name: 'Progress', bg: 'bg-amber-500' },
    { name: 'Complete', bg: 'bg-emerald-500' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 right-0 w-44 h-44 bg-primary-500/5 rounded-bl-full pointer-events-none"></div>

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Task Workspace</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Calendar size={13} />
              Due: {activeTask.due_date ? new Date(activeTask.due_date).toLocaleDateString() : 'No date set'}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Inner Grid */}
        <div className="flex-grow overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800/40">
          {/* Main workspace section (Left 2 columns) */}
          <div className="lg:col-span-2 p-6 space-y-6 overflow-y-auto">
            {/* Title & Description */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {activeTask.title}
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Description / Notes</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {activeTask.description || 'Provide context by adding a task description.'}
                </p>
              </div>
            </div>

            {/* Comment Thread */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <MessageSquare className="text-primary-500" size={18} />
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Discussions ({activeTask.comments?.length || 0})</h4>
              </div>

              {/* Add Comment input */}
              <form onSubmit={handleSendComment} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Share a team progress comment..."
                  className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-2 px-4 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-400"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={commenting || !commentText.trim()}
                  className="p-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs shadow-md shadow-primary-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Send size={15} />
                </button>
              </form>

              {/* Comments Thread list */}
              <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                {(!activeTask.comments || activeTask.comments.length === 0) ? (
                  <p className="text-center py-6 text-slate-400 text-xs">No comments posted yet. Begin the conversation!</p>
                ) : (
                  activeTask.comments.map((comment) => {
                    const commentAvatar = comment.user?.avatar ? `${API_URL}${comment.user.avatar}` : null;
                    return (
                      <div key={comment.id} className="flex gap-3 items-start border-b border-slate-100 dark:border-slate-800/20 pb-3 last:border-0 last:pb-0">
                        {commentAvatar ? (
                          <img 
                            src={commentAvatar} 
                            alt="Avatar" 
                            className="w-7 h-7 rounded-full object-cover shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-[10px] font-bold border border-slate-200/50 dark:border-slate-700/30 flex-shrink-0">
                            {comment.user?.name?.substring(0, 2).toUpperCase() || 'US'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 dark:text-white text-xs">{comment.user?.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-xs mt-1 leading-normal">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right settings sidebar (1 column) */}
          <div className="p-6 space-y-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
            {/* Status Selector */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Sprints Status</span>
              <div className="flex flex-col gap-1.5">
                {statuses.map((s) => {
                  const isActive = activeTask.status === s.name;
                  return (
                    <button
                      key={s.name}
                      onClick={() => handleStatusChange(s.name)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        isActive
                          ? `${s.bg} text-white border-transparent shadow-md shadow-slate-900/10`
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{s.name === 'Progress' ? 'In Progress' : s.name}</span>
                      {isActive && <ArrowRight size={13} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Task metadata tags */}
            <div className="space-y-2 border-t border-slate-150 dark:border-slate-800/60 pt-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Task Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {activeTask.tags && activeTask.tags.length > 0 ? (
                  activeTask.tags.map((t) => (
                    <span 
                      key={t.id} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200/60 dark:bg-slate-850 text-slate-600 dark:text-slate-350 text-[10px] font-bold"
                    >
                      <Tag size={10} />
                      {t.name}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs">No tags defined.</span>
                )}
              </div>
            </div>

            {/* Attachment files */}
            <div className="space-y-3.5 border-t border-slate-150 dark:border-slate-800/60 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Attachments</span>
                <label className="text-[10px] text-primary-500 hover:text-primary-600 font-bold cursor-pointer select-none">
                  Upload file
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>

              {attachmentError && (
                <div className="flex gap-1.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/10 text-[10px] font-medium">
                  <AlertCircle size={13} className="flex-shrink-0" />
                  {attachmentError}
                </div>
              )}

              {uploading && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                  <div className="w-3.5 h-3.5 border border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  Uploading file...
                </div>
              )}

              {/* Uploads list */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(!activeTask.attachments || activeTask.attachments.length === 0) ? (
                  <p className="text-slate-400 text-xs py-2">No files uploaded (Max 10MB).</p>
                ) : (
                  activeTask.attachments.map((file) => {
                    const downloadUrl = `${API_URL}${file.file_path}`;
                    return (
                      <a
                        key={file.id}
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 hover:border-primary-500 transition-colors text-[10px] text-slate-600 dark:text-slate-350 font-medium truncate"
                        title={file.file_name}
                      >
                        <File size={14} className="text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold text-slate-700 dark:text-slate-200">{file.file_name}</p>
                          <span className="text-[9px] text-slate-400 font-bold block">{formatBytes(file.file_size)}</span>
                        </div>
                      </a>
                    );
                  })
                )}
              </div>
            </div>

            {/* Audit Logs list */}
            <div className="space-y-3.5 border-t border-slate-150 dark:border-slate-800/60 pt-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Workspace Actions</span>
              <div className="space-y-3.5 max-h-44 overflow-y-auto pr-1">
                {(!activeTask.activities || activeTask.activities.length === 0) ? (
                  <span className="text-slate-400 text-xs">No audits logged yet.</span>
                ) : (
                  activeTask.activities.map((a) => (
                    <div key={a.id} className="flex gap-2 items-start text-[10px]">
                      <History size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                          <span className="font-bold text-slate-800 dark:text-white">{a.user?.name}</span>{' '}
                          {a.action}
                        </p>
                        <span className="text-[9px] text-slate-450 block mt-0.5">
                          {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
