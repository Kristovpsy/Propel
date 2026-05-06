import { useState } from 'react';
import {
  ChevronDown, ChevronRight, Check, Circle, Plus, Trash2,
  Calendar, Loader2, X,
} from 'lucide-react';
import type { CurriculumGoal, CurriculumMilestone } from '../../types';
import {
  updateGoalStatus,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
  deleteGoal,
} from '../../lib/api';

interface GoalCardProps {
  goal: CurriculumGoal;
  milestones: CurriculumMilestone[];
  allGoals: CurriculumGoal[];
  allMilestones: CurriculumMilestone[];
  curriculumId: string;
  onUpdate: () => void;
}

export default function GoalCard({
  goal,
  milestones,
  allGoals,
  allMilestones,
  curriculumId,
  onUpdate,
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [loadingMilestone, setLoadingMilestone] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const completedCount = milestones.filter((m) => m.completed).length;
  const totalCount = milestones.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const statusColors = {
    not_started: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-brand-blue-100 text-brand-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  async function handleStatusChange(status: CurriculumGoal['status']) {
    setIsUpdatingStatus(true);
    try {
      await updateGoalStatus(curriculumId, allGoals, goal.id, status);
      onUpdate();
    } catch (err) {
      console.error('Failed to update goal status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleAddMilestone() {
    if (!newMilestoneTitle.trim()) return;
    setIsAddingMilestone(true);
    try {
      await addMilestone(curriculumId, allMilestones, goal.id, newMilestoneTitle.trim());
      setNewMilestoneTitle('');
      onUpdate();
    } catch (err) {
      console.error('Failed to add milestone:', err);
    } finally {
      setIsAddingMilestone(false);
    }
  }

  async function handleToggleMilestone(milestoneId: string) {
    setLoadingMilestone(milestoneId);
    try {
      await toggleMilestone(curriculumId, allMilestones, milestoneId);
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle milestone:', err);
    } finally {
      setLoadingMilestone(null);
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    setLoadingMilestone(milestoneId);
    try {
      await deleteMilestone(curriculumId, allMilestones, milestoneId);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    } finally {
      setLoadingMilestone(null);
    }
  }

  async function handleDeleteGoal() {
    setIsDeleting(true);
    try {
      await deleteGoal(curriculumId, allGoals, allMilestones, goal.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-card-hover">
      {/* Goal header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 p-5 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
      >
        <button className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
          {expanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm truncate">
              {goal.title}
            </h3>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColors[goal.status]}`}
            >
              {statusLabels[goal.status]}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            {/* Target date */}
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(goal.target_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>

            {/* Progress text */}
            {totalCount > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">
                {completedCount}/{totalCount} milestones
              </span>
            )}
          </div>
        </div>

        {/* Progress ring */}
        {totalCount > 0 && (
          <div className="flex-shrink-0 relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15"
                fill="none" stroke="#f1f5f9" strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke={progress === 100 ? '#10b981' : '#3b82f6'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 0.942} 100`}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-600">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 animate-fade-in">
          {/* Status selector */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium mr-1">Status:</span>
            {(['not_started', 'in_progress', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isUpdatingStatus}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                  goal.status === status
                    ? statusColors[status]
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          {/* Milestones checklist */}
          <div className="space-y-2 mb-4">
            {milestones.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No milestones yet. Add some below!
              </p>
            )}

            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center gap-3 group p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <button
                  onClick={() => handleToggleMilestone(milestone.id)}
                  disabled={loadingMilestone === milestone.id}
                  className="flex-shrink-0"
                >
                  {loadingMilestone === milestone.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  ) : milestone.completed ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-brand-blue-400 transition-colors" />
                  )}
                </button>

                <span
                  className={`flex-1 text-sm transition-all ${
                    milestone.completed
                      ? 'text-slate-400 line-through'
                      : 'text-slate-700'
                  }`}
                >
                  {milestone.title}
                </span>

                <button
                  onClick={() => handleDeleteMilestone(milestone.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add milestone input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMilestone();
                }
              }}
              placeholder="Add a milestone..."
              className="input-field text-sm py-2.5 flex-1"
              disabled={isAddingMilestone}
            />
            <button
              onClick={handleAddMilestone}
              disabled={isAddingMilestone || !newMilestoneTitle.trim()}
              className="btn-primary px-3 py-2 text-sm disabled:opacity-50"
            >
              {isAddingMilestone ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Delete goal */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Delete this goal and all its milestones?</span>
                <button
                  onClick={handleDeleteGoal}
                  disabled={isDeleting}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-slate-400 hover:text-red-500 font-medium flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete goal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
