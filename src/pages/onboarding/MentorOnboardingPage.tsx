import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { mentorProfileSchema, type MentorProfileFormData } from '../../lib/validators';
import { Loader2, Plus, X, Upload, ChevronRight, ChevronLeft, Camera } from 'lucide-react';

const MENTORSHIP_STYLES = [
  'Structured & Curriculum-based',
  'Flexible & Conversational',
  'Project-based & Hands-on',
  'Goal-oriented & Milestone-driven',
  'Peer-style & Collaborative',
];

const EXPERTISE_SUGGESTIONS = [
  'Product Design', 'Software Engineering', 'Data Science', 'Product Management',
  'Marketing', 'UX Research', 'DevOps', 'Mobile Development', 'AI/ML',
  'Cloud Architecture', 'Leadership', 'Career Transitions', 'Entrepreneurship',
  'Frontend Development', 'Backend Development', 'Full Stack', 'System Design',
];

const MENTORSHIP_AREAS = [
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

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const;

export default function MentorOnboardingPage() {
  const navigate = useNavigate();
  const { user, setProfile, setMentorProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, control, formState: { errors }, trigger } = useForm<MentorProfileFormData>({
    resolver: zodResolver(mentorProfileSchema),
    defaultValues: {
      username: '',
      gender: undefined,
      area_of_mentorship: '',
      years_of_experience: 0,
      portfolio: '',
      bio: '',
      expertise_tags: [],
      work_history: [{ role: '', company: '', years: 0 }],
      mentorship_style: '',
      max_capacity: 5,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'work_history' });
  const expertiseTags = watch('expertise_tags');

  const steps = [
    { title: 'Your Profile', subtitle: 'Set up your basic profile info' },
    { title: 'About You', subtitle: 'Tell mentees about yourself' },
    { title: 'Expertise', subtitle: 'What do you specialize in?' },
    { title: 'Experience', subtitle: 'Share your background' },
    { title: 'Preferences', subtitle: 'How do you want to mentor?' },
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

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !expertiseTags.includes(trimmed) && expertiseTags.length < 10) {
      setValue('expertise_tags', [...expertiseTags, trimmed]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setValue('expertise_tags', expertiseTags.filter(t => t !== tag));
  }

  async function nextStep() {
    let fieldsToValidate: (keyof MentorProfileFormData)[] = [];
    if (step === 0) fieldsToValidate = ['username', 'gender', 'area_of_mentorship', 'years_of_experience'];
    if (step === 1) fieldsToValidate = ['bio'];
    if (step === 2) fieldsToValidate = ['expertise_tags'];
    if (step === 3) fieldsToValidate = ['work_history'];
    if (step === 4) fieldsToValidate = ['mentorship_style', 'max_capacity'];

    const valid = await trigger(fieldsToValidate);
    if (valid) setStep(step + 1);
  }

  async function onSubmit(data: MentorProfileFormData) {
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

      // Create mentor profile
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentor_profiles')
        .insert({
          user_id: user.id,
          bio: data.bio,
          expertise_tags: data.expertise_tags,
          work_history: data.work_history,
          mentorship_style: data.mentorship_style,
          max_capacity: data.max_capacity,
          area_of_mentorship: data.area_of_mentorship,
          years_of_experience: data.years_of_experience,
          portfolio: data.portfolio || null,
          current_count: 0,
          is_at_capacity: false,
        })
        .select()
        .single();

      if (mentorError) throw mentorError;

      // Update local state
      setProfile({
        ...useAuthStore.getState().profile!,
        avatar_url,
        username: data.username,
        gender: data.gender,
        onboarding_complete: true,
      });
      setMentorProfile(mentorData);

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
            {/* Step 0: Profile Info (username, gender, area, experience, portfolio) */}
            {step === 0 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="label">Preferred Username (required)</label>
                  <input
                    {...register('username')}
                    className="input-field"
                    placeholder="e.g. john_doe"
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
                  <label className="label">Area of Mentorship (required)</label>
                  <select
                    {...register('area_of_mentorship')}
                    className="input-field"
                  >
                    <option value="">Select area</option>
                    {MENTORSHIP_AREAS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  {errors.area_of_mentorship && <p className="text-red-500 text-xs mt-1">{errors.area_of_mentorship.message}</p>}
                </div>

                <div>
                  <label className="label">Years of Experience (required)</label>
                  <input
                    type="number"
                    {...register('years_of_experience', { valueAsNumber: true })}
                    className="input-field w-32"
                    placeholder="0"
                    min="0"
                    max="50"
                  />
                  {errors.years_of_experience && <p className="text-red-500 text-xs mt-1">{errors.years_of_experience.message}</p>}
                </div>

                <div>
                  <label className="label">Portfolio</label>
                  <input
                    {...register('portfolio')}
                    className="input-field"
                    placeholder="https://your-portfolio.com"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Optional. Link to your portfolio or personal website.</p>
                  {errors.portfolio && <p className="text-red-500 text-xs mt-1">{errors.portfolio.message}</p>}
                </div>
              </div>
            )}

            {/* Step 1: Bio & Photo */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col items-center">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-brand-blue-400 transition-colors overflow-hidden group"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-400 group-hover:text-brand-blue-500 transition-colors" />
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-brand-blue-600 font-medium mt-2 hover:underline flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload Photo
                  </button>
                </div>

                <div>
                  <label className="label">Bio</label>
                  <textarea 
                    {...register('bio')} 
                    className="input-field min-h-[120px] resize-none"
                    placeholder="Tell mentees about yourself, your journey, and what drives you to mentor..."
                  />
                  {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Expertise Tags */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="label">Your Expertise Areas</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                      className="input-field flex-1"
                      placeholder="Type a skill and press Enter..."
                    />
                    <button type="button" onClick={() => addTag(tagInput)} className="btn-primary px-4 py-2">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selected tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {expertiseTags.map((tag) => (
                      <span key={tag} className="badge-blue flex items-center gap-1.5 pl-3 pr-2 py-1.5">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.expertise_tags && <p className="text-red-500 text-xs">{errors.expertise_tags.message}</p>}

                  {/* Suggestions */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {EXPERTISE_SUGGESTIONS.filter(s => !expertiseTags.includes(s)).slice(0, 8).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-brand-blue-400 hover:text-brand-blue-600 hover:bg-brand-blue-50 transition-all"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Work History */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="label">Work Experience</label>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(index)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Job Title</label>
                            <input {...register(`work_history.${index}.role`)} className="input-field text-sm py-2.5" placeholder="e.g. Senior Designer" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Company</label>
                            <input {...register(`work_history.${index}.company`)} className="input-field text-sm py-2.5" placeholder="e.g. Google" />
                          </div>
                        </div>
                        <div className="w-1/2">
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Years</label>
                          <input type="number" {...register(`work_history.${index}.years`, { valueAsNumber: true })} className="input-field text-sm py-2.5" placeholder="3" min="0" max="50" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.work_history && <p className="text-red-500 text-xs mt-1">{typeof errors.work_history.message === 'string' ? errors.work_history.message : 'Please fill in all work history fields'}</p>}

                  <button type="button" onClick={() => append({ role: '', company: '', years: 0 })} className="mt-3 text-sm text-brand-blue-600 font-medium hover:underline flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add another position
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Preferences */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="label">Mentorship Style</label>
                  <div className="space-y-2">
                    {MENTORSHIP_STYLES.map((style) => (
                      <label key={style} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        watch('mentorship_style') === style
                          ? 'border-brand-green-500 bg-brand-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}>
                        <input type="radio" value={style} {...register('mentorship_style')} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          watch('mentorship_style') === style ? 'border-brand-green-500' : 'border-slate-300'
                        }`}>
                          {watch('mentorship_style') === style && <div className="w-2 h-2 rounded-full bg-brand-green-500" />}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{style}</span>
                      </label>
                    ))}
                  </div>
                  {errors.mentorship_style && <p className="text-red-500 text-xs mt-1">{errors.mentorship_style.message}</p>}
                </div>

                <div>
                  <label className="label">Maximum Mentees</label>
                  <p className="text-xs text-slate-400 mb-2">How many mentees can you mentor at once?</p>
                  <input type="number" {...register('max_capacity', { valueAsNumber: true })} className="input-field w-32" min="1" max="20" />
                  {errors.max_capacity && <p className="text-red-500 text-xs mt-1">{errors.max_capacity.message}</p>}
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
