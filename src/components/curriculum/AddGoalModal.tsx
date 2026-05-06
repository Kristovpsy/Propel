import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { goalSchema, type GoalFormData } from '../../lib/validators';
import { addGoalToCurriculum } from '../../lib/api';
import type { CurriculumGoal } from '../../types';
import { X, Loader2, Target } from 'lucide-react';

interface AddGoalModalProps {
  curriculumId: string;
  currentGoals: CurriculumGoal[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddGoalModal({
  curriculumId,
  currentGoals,
  onClose,
  onSuccess,
}: AddGoalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: '',
      target_date: '',
    },
  });

  async function onSubmit(data: GoalFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await addGoalToCurriculum(curriculumId, currentGoals, {
        title: data.title,
        target_date: data.target_date,
        status: 'not_started',
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">New Goal</h2>
              <p className="text-xs text-slate-500">Define what you want to achieve</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-6 space-y-4">
            {/* Title */}
            <div>
              <label className="label">Goal Title</label>
              <input
                {...register('title')}
                className="input-field"
                placeholder="e.g. Master React design patterns"
                disabled={isSubmitting}
                autoFocus
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Target date */}
            <div>
              <label className="label">Target Date</label>
              <input
                type="date"
                {...register('target_date')}
                min={today}
                className="input-field"
                disabled={isSubmitting}
              />
              {errors.target_date && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.target_date.message}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
