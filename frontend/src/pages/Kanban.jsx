import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import TaskDetailsModal from '../components/TaskDetailsModal';
import {
  DndContext,
  useDroppable,
  useDraggable,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  MessageSquare, 
  Paperclip, 
  Calendar, 
  Eye, 
  AlertCircle,
  Tag,
  GripVertical
} from 'lucide-react';

// Draggable Task Card Component
function KanbanCard({ task, onViewDetails, isOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const getPriorityBorder = (p) => {
    if (p === 'High') return 'border-l-4 border-l-rose-500';
    if (p === 'Medium') return 'border-l-4 border-l-amber-500';
    return 'border-l-4 border-l-emerald-500';
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={`bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 shadow-card hover:shadow-md transition-all relative group select-none ${
        isOverlay ? 'cursor-grabbing shadow-2xl rotate-2 scale-105 border-primary-500 ring-2 ring-primary-500/20' : 'cursor-grab active:cursor-grabbing'
      } ${getPriorityBorder(task.priority)}`}
    >
      {/* Title */}
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1 group-hover:text-primary-500 transition-colors">
          {task.title}
        </h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isOverlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(task.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="View details"
            >
              <Eye size={14} />
            </button>
          )}
          <GripVertical size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed pointer-events-none">
        {task.description || 'No description added yet.'}
      </p>

      {/* Tags wrapper */}
      <div className="flex flex-wrap gap-1 mt-3.5 pointer-events-none">
        {task.tags && task.tags.slice(0, 3).map((tag) => (
          <span 
            key={tag.id} 
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold inline-flex items-center gap-0.5"
          >
            <Tag size={8} />
            {tag.name}
          </span>
        ))}
      </div>

      {/* Card Footer Widgets */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 text-[10px] text-slate-400 font-semibold pointer-events-none">
        {/* Due Date Badge */}
        {task.due_date ? (
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span></span>
        )}

        {/* Comment and Attachments Counters */}
        <div className="flex items-center gap-2.5">
          {task.attachments && task.attachments.length > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Paperclip size={11} />
              {task.attachments.length}
            </span>
          )}
          {task.comments && task.comments.length > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare size={11} />
              {task.comments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Droppable Column Component
function KanbanColumn({ title, id, tasks, onViewDetails }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const getHeaderColors = () => {
    if (id === 'Incomplete') return 'bg-slate-800 dark:bg-slate-900';
    if (id === 'Progress') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div
      ref={setNodeRef}
      className={`glass-panel flex flex-col w-full h-[70vh] border transition-colors ${
        isOver 
          ? 'bg-primary-500/10 border-primary-500/50 ring-2 ring-primary-500/20' 
          : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/40'
      }`}
    >
      {/* Column title header */}
      <div className="px-5 py-4 border-b border-slate-200/50 dark:border-slate-800/40 flex justify-between items-center select-none bg-slate-50/50 dark:bg-slate-950/20 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${getHeaderColors()}`}></span>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm capitalize">
            {title}
          </h3>
        </div>
        <span className="px-2 py-0.5 text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
          {tasks.length}
        </span>
      </div>

      {/* Draggables stack container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
            <AlertCircle size={28} className="mb-2 stroke-1" />
            <p className="text-[11px] font-medium leading-normal">Drop tasks here to update statuses.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onViewDetails={onViewDetails} />
          ))
        )}
      </div>
    </div>
  );
}

// Kanban Board Controller Component
export default function Kanban() {
  const { tasks, tasksLoading, fetchTasks, patchTaskStatus, activeTask, fetchTaskDetails } = useStore();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const taskId = active.id;
    let newStatus = over.id; // Could be column ID or another task's ID

    // If dropped over another task, resolve its parent column status
    const targetTask = tasks.find((t) => t.id === over.id);
    if (targetTask) {
      newStatus = targetTask.status;
    }

    // Find original task being dragged
    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;

    if (draggedTask.status !== newStatus) {
      await patchTaskStatus(taskId, newStatus);
    }
  };

  const handleOpenDetails = async (taskId) => {
    await fetchTaskDetails(taskId);
    setDetailsOpen(true);
  };

  const draggedTaskObj = tasks.find((t) => t.id === activeDragId);

  // Group tasks by status columns
  const columns = [
    { title: 'Incomplete', id: 'Incomplete', tasks: tasks.filter((t) => t.status === 'Incomplete') },
    { title: 'In Progress', id: 'Progress', tasks: tasks.filter((t) => t.status === 'Progress') },
    { title: 'Complete', id: 'Complete', tasks: tasks.filter((t) => t.status === 'Complete') }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header title */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">Kanban Workspace</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Drag and drop project tiles between status blocks. Updates sync instantly.
        </p>
      </div>

      {/* Drag & Drop Context */}
      {tasksLoading && tasks.length === 0 ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-450 text-xs">Syncing board cards...</span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                title={col.title}
                id={col.id}
                tasks={col.tasks}
                onViewDetails={handleOpenDetails}
              />
            ))}
          </div>

          <DragOverlay>
            {draggedTaskObj ? (
              <KanbanCard task={draggedTaskObj} onViewDetails={() => {}} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Task detail Modal overlay */}
      {detailsOpen && activeTask && (
        <TaskDetailsModal onClose={() => setDetailsOpen(false)} />
      )}
    </div>
  );
}

