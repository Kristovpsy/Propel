import { useState, useMemo } from 'react';
import { useAuthStore } from '../../lib/store';
import { useToast } from '../../lib/useToast';
import { useConnections, useCurriculum } from '../../lib/hooks';
import { createCurriculum } from '../../lib/api';
import GoalCard from '../../components/curriculum/GoalCard';
import AddGoalModal from '../../components/curriculum/AddGoalModal';
import type { CurriculumGoal, CurriculumMilestone } from '../../types';
import {
  Target, Plus, Loader2, ChevronDown, Users, BookOpen,
} from 'lucide-react';

export default function GoalsPage() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const role = profile?.role || 'mentee';
  const { data: connections, isLoading: loadingConnections } = useConnections(
    profile?.id,
    role
  );

  // Only show active connections
  const activeConnections = useMemo(
    () => (connections || []).filter((c) => c.status === 'active'),
    [connections]
  );

  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [isCreatingCurriculum, setIsCreatingCurriculum] = useState(false);

  // Auto-select first connection
  const connectionId = selectedConnectionId || activeConnections[0]?.id || null;

  const {
    data: curriculum,
    isLoading: loadingCurriculum,
    refetch: refetchCurriculum,
  } = useCurriculum(connectionId || undefined);

  const goals = (curriculum?.goals || []) as CurriculumGoal[];
  const milestones = (curriculum?.milestones || []) as CurriculumMilestone[];

  // Progress calculation
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const overallProgress =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  // Get the other person's name for display
  function getPartnerName(conn: typeof activeConnections[0]) {
    if (role === 'mentee') {
      return (conn as any).mentor?.full_name || 'Mentor';
    }
    return (conn as any).mentee?.full_name || 'Mentee';
  }

  async function handleCreateCurriculum() {
    if (!connectionId) return;
    setIsCreatingCurriculum(true);
    try {
      await createCurriculum(connectionId);
      refetchCurriculum();
    } catch (err) {
      console.error('Failed to create curriculum:', err);
      toast.error('Failed to create curriculum.');
    } finally {
      setIsCreatingCurriculum(false);
    }
  }

  if (loadingConnections) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-4" />
        <div className="h-4 bg-slate-100 rounded w-72 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="h-5 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No active connections
  if (activeConnections.length === 0) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            Goals & Curriculum
          </h1>
        </div>

        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No active connections
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            {role === 'mentee'
              ? 'Connect with a mentor first to start building your curriculum.'
              : 'Accept a mentee connection to start building curricula together.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            Goals & Curriculum
          </h1>
          <p className="text-slate-500 ml-[52px]">
            Track your learning goals and milestones.
          </p>
        </div>

        {curriculum && (
          <button
            onClick={() => setShowAddGoal(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        )}
      </div>

      {/* Connection selector (if multiple) */}
      {activeConnections.length > 1 && (
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
            Select Connection
          </label>
          <div className="relative">
            <select
              value={connectionId || ''}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
              className="input-field appearance-none pr-10"
            >
              {activeConnections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {getPartnerName(conn)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Single connection info */}
      {activeConnections.length === 1 && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 mb-6 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-blue-500" />
          <span className="text-sm text-slate-600">
            Curriculum with <span className="font-semibold text-slate-900">{getPartnerName(activeConnections[0])}</span>
          </span>
        </div>
      )}

      {/* Loading curriculum */}
      {loadingCurriculum ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading curriculum...</p>
        </div>
      ) : !curriculum ? (
        // No curriculum yet — create one
        <div className="text-center py-16 bg-white rounded-2xl shadow-card border border-slate-100">
          <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-brand-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Start Your Curriculum
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Create a curriculum to define goals, set milestones, and track your
            mentorship progress.
          </p>
          <button
            onClick={handleCreateCurriculum}
            disabled={isCreatingCurriculum}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            {isCreatingCurriculum ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isCreatingCurriculum ? 'Creating...' : 'Create Curriculum'}
          </button>
        </div>
      ) : (
        <>
          {/* Overall progress card */}
          {totalMilestones > 0 && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-900 text-sm">
                  Overall Progress
                </h2>
                <span className="text-sm font-bold text-brand-blue-600">
                  {overallProgress}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-all duration-700 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">
                  {completedMilestones} of {totalMilestones} milestones complete
                </span>
                <span className="text-xs text-slate-400">
                  {goals.length} goal{goals.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Goals list */}
          {goals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-card border border-slate-100">
              <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500 mb-1">
                No goals yet
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Add your first goal to get started.
              </p>
              <button
                onClick={() => setShowAddGoal(true)}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  milestones={milestones.filter(
                    (m) => m.goal_id === goal.id
                  )}
                  allGoals={goals}
                  allMilestones={milestones}
                  curriculumId={curriculum.id}
                  onUpdate={refetchCurriculum}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && curriculum && (
        <AddGoalModal
          curriculumId={curriculum.id}
          currentGoals={goals}
          onClose={() => setShowAddGoal(false)}
          onSuccess={() => {
            setShowAddGoal(false);
            refetchCurriculum();
          }}
        />
      )}
    </div>
  );
}
