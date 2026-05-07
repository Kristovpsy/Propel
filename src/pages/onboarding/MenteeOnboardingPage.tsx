import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { menteeProfileSchema, type MenteeProfileFormData } from '../../lib/validators';
import { Loader2, Plus, X, Upload, ChevronRight, ChevronLeft, Camera } from 'lucide-react';

const INTEREST_AREAS = [
  'Technology & Programming',
  'Business & Entrepreneurship',
  'Design & Creative',
  'Data Science & Analytics',
  'Marketing & Growth',
  'Leadership & Management',
  'Career Development',
  'Finance & Accounting',
  'Healthcare & Medicine',
  'Education & Teaching',
  'Other',
];

const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'Data Analysis', 'UI Design', 'UX Research',
  'Project Management', 'Leadership', 'Public Speaking', 'Machine Learning',
  'Cloud Computing', 'DevOps', 'Mobile Development', 'System Design',
  'Product Strategy', 'Agile Methodology', 'TypeScript', 'SQL',
];

const GOAL_SUGGESTIONS = [
  'Land a senior role', 'Transition to tech', 'Build a portfolio',
  'Learn system design', 'Improve leadership skills', 'Start a startup',
  'Master a new language', 'Get promoted', 'Build a network',
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const;

export default function MenteeOnboardingPage() {
  const navigate = useNavigate();
  const { user, setProfile, setMenteeProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger } = useForm<MenteeProfileFormData>({
    resolver: zodResolver(menteeProfileSchema),
    defaultValues: {
      username: '',
      gender: undefined,
      area_of_interest: '',
      bio: '',
      aspirations: '',
      learning_goals: [],
      desired_skills: [],
    },
  });

  const desiredSkills = watch('desired_skills');
  const learningGoals = watch('learning_goals');

  const steps = [
    { title: 'Your Profile', subtitle: 'Set up your basic profile info' },
    { title: 'About You', subtitle: 'Tell mentors about yourself' },
    { title: 'Your Aspirations', subtitle: 'Where do you see yourself?' },
    { title: 'Goals & Skills', subtitle: 'What do you want to achieve and learn?' },
  ];

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !desiredSkills.includes(trimmed) && desiredSkills.length < 10) {
      setValue('desired_skills', [...desiredSkills, trimmed]);
    }
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setValue('desired_skills', desiredSkills.filter(s => s !== skill));
  }

  function addGoal(goal: string) {
    const trimmed = goal.trim();
    if (trimmed && !learningGoals.includes(trimmed) && learningGoals.length < 5) {
      setValue('learning_goals', [...learningGoals, trimmed]);
    }
    setGoalInput('');
  }

  function removeGoal(goal: string) {
    setValue('learning_goals', learningGoals.filter(g => g !== goal));
  }

  async function nextStep() {
    let fieldsToValidate: (keyof MenteeProfileFormData)[] = [];
    if (step === 0) fieldsToValidate = ['username', 'gender', 'area_of_interest'];
    if (step === 1) fieldsToValidate = ['bio'];
    if (step === 2) fieldsToValidate = ['aspirations'];
    if (step === 3) fieldsToValidate = ['learning_goals', 'desired_skills'];

    const valid = await trigger(fieldsToValidate);
    if (valid) setStep(step + 1);
  }

  async function onSubmit(data: MenteeProfileFormData) {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let avatar_url: string | null = null;

      // Upload avatar if provided
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(path);
          avatar_url = urlData.publicUrl;
        }
      }

      // Update profile with new fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url,
          username: data.username,
          gender: data.gender,
          onboarding_complete: true,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create mentee profile
      const { data: menteeData, error: menteeError } = await supabase
        .from('mentee_profiles')
        .insert({
          user_id: user.id,
          bio: data.bio,
          area_of_interest: data.area_of_interest,
          aspirations: data.aspirations,
          learning_goals: data.learning_goals,
          desired_skills: data.desired_skills,
        })
        .select()
        .single();

      if (menteeError) throw menteeError;

      // Update local state
      setProfile({
        ...useAuthStore.getState().profile!,
        avatar_url,
        username: data.username,
        gender: data.gender,
        onboarding_complete: true,
      });
      setMenteeProfile(menteeData);

      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-green-50/30 font-montserrat">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="Propel" className="h-7 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{steps[step].title}</h1>
          <p className="text-slate-500 text-sm">{steps[step].subtitle}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-brand-green-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card p-8">
            {/* Step 0: Profile Info (username, gender, area of interest) */}
            {step === 0 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="label">Preferred Username (required)</label>
                  <input
                    {...register('username')}
                    className="input-field"
                    placeholder="e.g. jane_doe"
                  />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                </div>

                <div>
                  <label className="label">Gender (required)</label>
                  <select
                    {...register('gender')}
                    className="input-field"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                </div>

                <div>
                  <label className="label">Area of Interest (required)</label>
                  <select
                    {...register('area_of_interest')}
                    className="input-field"
                  >
                    <option value="">Select area</option>
                    {INTEREST_AREAS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  {errors.area_of_interest && <p className="text-red-500 text-xs mt-1">{errors.area_of_interest.message}</p>}
                </div>
              </div>
            )}

            {/* Step 1: Bio & Photo */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-brand-green-400 transition-colors overflow-hidden group"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-400 group-hover:text-brand-green-500 transition-colors" />
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-brand-green-600 font-medium mt-2 hover:underline flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload Photo
                  </button>
                </div>

                <div>
                  <label className="label">Bio</label>
                  <textarea
                    {...register('bio')}
                    className="input-field min-h-[120px] resize-none"
                    placeholder="Tell mentors about yourself, your background, and what you're passionate about..."
                  />
                  {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Aspirations */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="label">Career Aspirations</label>
                  <p className="text-xs text-slate-400 mb-2">Share your career vision and what you hope to achieve through mentorship.</p>
                  <textarea
                    {...register('aspirations')}
                    className="input-field min-h-[150px] resize-none"
                    placeholder="I'm looking to grow into a senior role in product design. I want to deepen my skills in user research, build a strong portfolio, and eventually lead a design team..."
                  />
                  {errors.aspirations && <p className="text-red-500 text-xs mt-1">{errors.aspirations.message}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Goals & Skills */}
            {step === 3 && (
              <div className="space-y-8 animate-fade-in">
                {/* Learning Goals */}
                <div>
                  <label className="label">Learning Goals</label>
                  <p className="text-xs text-slate-400 mb-2">What specific things do you want to achieve? (max 5)</p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGoal(goalInput); } }}
                      className="input-field flex-1"
                      placeholder="Type a goal and press Enter..."
                    />
                    <button type="button" onClick={() => addGoal(goalInput)} className="btn-primary px-4 py-2">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {learningGoals.map((goal) => (
                      <span key={goal} className="badge-green flex items-center gap-1.5 pl-3 pr-2 py-1.5">
                        {goal}
                        <button type="button" onClick={() => removeGoal(goal)} className="hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.learning_goals && <p className="text-red-500 text-xs">{errors.learning_goals.message}</p>}

                  {/* Suggestions */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_SUGGESTIONS.filter(g => !learningGoals.includes(g)).slice(0, 5).map((goal) => (
                        <button key={goal} type="button" onClick={() => addGoal(goal)} className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-brand-green-400 hover:text-brand-green-600 hover:bg-brand-green-50 transition-all">
                          + {goal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desired Skills */}
                <div>
                  <label className="label">Desired Skills</label>
                  <p className="text-xs text-slate-400 mb-2">What skills do you want to develop? (max 10)</p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                      className="input-field flex-1"
                      placeholder="Type a skill and press Enter..."
                    />
                    <button type="button" onClick={() => addSkill(skillInput)} className="btn-primary px-4 py-2">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {desiredSkills.map((skill) => (
                      <span key={skill} className="badge-blue flex items-center gap-1.5 pl-3 pr-2 py-1.5">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.desired_skills && <p className="text-red-500 text-xs">{errors.desired_skills.message}</p>}

                  {/* Suggestions */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_SUGGESTIONS.filter(s => !desiredSkills.includes(s)).slice(0, 8).map((skill) => (
                        <button key={skill} type="button" onClick={() => addSkill(skill)} className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-brand-blue-400 hover:text-brand-blue-600 hover:bg-brand-blue-50 transition-all">
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mt-4">{error}</div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < steps.length - 1 ? (
              <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-1">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
