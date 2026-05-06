import { useState } from 'react';
import { useAuthStore } from '../../lib/store';
import { useToast } from '../../lib/useToast';
import { updateProfile, updateMentorProfileData, updateMenteeProfileData } from '../../lib/api';
import type { Profile, MentorProfile, MenteeProfile } from '../../types';
import {
  User, Edit3, Loader2, CheckCircle,
  ChevronDown, Eye, EyeOff, X,
} from 'lucide-react';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const MENTORSHIP_AREAS = [
  'Technology & Programming', 'Business & Entrepreneurship', 'Design & Creative',
  'Data Science & Analytics', 'Marketing & Growth', 'Leadership & Management',
  'Career Development', 'Finance & Accounting', 'Healthcare & Medicine',
  'Education & Teaching', 'Other',
];

type EditSection = 'basic' | 'professional' | null;

export default function ProfilePage() {
  const { profile, mentorProfile, menteeProfile, setProfile, setMentorProfile, setMenteeProfile } = useAuthStore();
  const [editSection, setEditSection] = useState<EditSection>(null);

  if (!profile) return null;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          My Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 ml-[52px]">View and manage your profile information.</p>
      </div>

      {/* Basic Information */}
      {editSection === 'basic' ? (
        <BasicInfoEdit profile={profile} onSave={setProfile} onCancel={() => setEditSection(null)} />
      ) : (
        <BasicInfoView profile={profile} onEdit={() => setEditSection('basic')} />
      )}

      {/* Professional Information */}
      <div className="mt-6">
        {editSection === 'professional' ? (
          profile.role === 'mentor' && mentorProfile ? (
            <MentorProfessionalEdit mentorProfile={mentorProfile} profile={profile} onSave={setMentorProfile} onCancel={() => setEditSection(null)} />
          ) : menteeProfile ? (
            <MenteeProfessionalEdit menteeProfile={menteeProfile} profile={profile} onSave={setMenteeProfile} onCancel={() => setEditSection(null)} />
          ) : null
        ) : (
          <ProfessionalInfoView profile={profile} mentorProfile={mentorProfile} menteeProfile={menteeProfile} onEdit={() => setEditSection('professional')} />
        )}
      </div>

      {/* Profile Completion */}
      <div className="mt-6">
        <ProfileCompletion profile={profile} mentorProfile={mentorProfile} menteeProfile={menteeProfile} />
      </div>
    </div>
  );
}

/* ================================================================
   VIEW: Basic Information
   ================================================================ */
function BasicInfoView({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Basic Information</h2>
        <button onClick={onEdit} className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white flex items-center gap-1">
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>
      <hr className="border-slate-100 dark:border-slate-700 mb-4" />
      <div className="space-y-4">
        <Field label="First Name" value={profile.first_name || profile.full_name?.split(' ')[0] || '—'} />
        <Field label="Last Name" value={profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '—'} />
        <Field label="Preferred Username" value={profile.username || '—'} />
        <Field label="Role" value={profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '—'} />
        <Field label="Gender" value={profile.gender || '—'} />
      </div>
    </div>
  );
}

/* ================================================================
   VIEW: Professional Information
   ================================================================ */
function ProfessionalInfoView({ profile, mentorProfile, menteeProfile, onEdit }: {
  profile: Profile; mentorProfile: MentorProfile | null; menteeProfile: MenteeProfile | null; onEdit: () => void;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Professional Information</h2>
        <button onClick={onEdit} className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white flex items-center gap-1">
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>
      <hr className="border-slate-100 dark:border-slate-700 mb-4" />
      {profile.role === 'mentor' && mentorProfile ? (
        <div className="space-y-4">
          <Field label="Area of Mentorship" value={mentorProfile.area_of_mentorship || '—'} />
          <Field label="Years of Experience" value={mentorProfile.years_of_experience?.toString() || '0'} />
          <Field label="Portfolio" value={mentorProfile.portfolio || '—'} />
          <Field label="Bio" value={mentorProfile.bio || '—'} />
          <Field label="Mentorship Style" value={mentorProfile.mentorship_style || '—'} />
        </div>
      ) : menteeProfile ? (
        <div className="space-y-4">
          <Field label="Aspirations" value={menteeProfile.aspirations || '—'} />
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Learning Goals</p>
            <div className="flex flex-wrap gap-2">
              {(menteeProfile.learning_goals || []).map((g) => (
                <span key={g} className="badge-green">{g}</span>
              ))}
              {(menteeProfile.learning_goals || []).length === 0 && <span className="text-sm text-slate-900 dark:text-white font-medium">—</span>}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Desired Skills</p>
            <div className="flex flex-wrap gap-2">
              {(menteeProfile.desired_skills || []).map((s) => (
                <span key={s} className="badge-blue">{s}</span>
              ))}
              {(menteeProfile.desired_skills || []).length === 0 && <span className="text-sm text-slate-900 dark:text-white font-medium">—</span>}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">No professional information available.</p>
      )}
    </div>
  );
}

/* ================================================================
   EDIT: Basic Information
   ================================================================ */
function BasicInfoEdit({ profile, onSave, onCancel }: {
  profile: Profile; onSave: (p: Profile) => void; onCancel: () => void;
}) {
  const toast = useToast();
  const [firstName, setFirstName] = useState(profile.first_name || profile.full_name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '');
  const [username, setUsername] = useState(profile.username || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [visibility, setVisibility] = useState<Record<string, string>>(profile.field_visibility || {});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) { toast.error('First and last name are required.'); return; }
    if (!username.trim()) { toast.error('Username is required.'); return; }
    setSaving(true);
    try {
      const updated = await updateProfile(profile.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        username: username.trim(),
        gender: gender || undefined,
        field_visibility: visibility,
      });
      onSave(updated);
      onCancel();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Basic Information</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
      </div>
      <hr className="border-slate-100 dark:border-slate-700 mb-5" />
      <div className="space-y-5">
        <EditField label="First Name" required value={firstName} onChange={setFirstName} visibility={visibility.first_name} onVisibility={(v) => setVisibility({ ...visibility, first_name: v })} />
        <EditField label="Last Name" required value={lastName} onChange={setLastName} visibility={visibility.last_name} onVisibility={(v) => setVisibility({ ...visibility, last_name: v })} />
        <EditField label="Preferred Username" required value={username} onChange={setUsername} alwaysPublic />
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Role (required)</p>
          <select className="input-field" value={profile.role} disabled>
            <option value="mentor">Mentor</option>
            <option value="mentee">Mentee</option>
          </select>
          <VisibilityTag value={visibility.role || 'public'} onChange={(v) => setVisibility({ ...visibility, role: v })} />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Gender (required)</p>
          <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <VisibilityTag value={visibility.gender || 'public'} onChange={(v) => setVisibility({ ...visibility, gender: v })} />
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 mt-6">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

/* ================================================================
   EDIT: Mentor Professional Info
   ================================================================ */
function MentorProfessionalEdit({ mentorProfile, profile, onSave, onCancel }: {
  mentorProfile: MentorProfile; profile: Profile; onSave: (p: MentorProfile) => void; onCancel: () => void;
}) {
  const toast = useToast();
  const [area, setArea] = useState(mentorProfile.area_of_mentorship || '');
  const [years, setYears] = useState(mentorProfile.years_of_experience || 0);
  const [portfolio, setPortfolio] = useState(mentorProfile.portfolio || '');
  const [bio, setBio] = useState(mentorProfile.bio || '');
  const [visibility, setVisibility] = useState<Record<string, string>>(profile.field_visibility || {});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateMentorProfileData(profile.id, {
        area_of_mentorship: area,
        years_of_experience: years,
        portfolio: portfolio || null,
        bio,
      });
      await updateProfile(profile.id, { field_visibility: visibility });
      onSave(updated);
      onCancel();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Professional Information</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
      </div>
      <hr className="border-slate-100 dark:border-slate-700 mb-5" />
      <div className="space-y-5">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Area of Mentorship (required)</p>
          <select className="input-field" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Select area</option>
            {MENTORSHIP_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <VisibilityTag value={visibility.area_of_mentorship || 'only_me'} onChange={(v) => setVisibility({ ...visibility, area_of_mentorship: v })} />
        </div>
        <EditField label="Years of Experience" required value={years.toString()} onChange={(v) => setYears(Number(v) || 0)} type="number" visibility={visibility.years_of_experience} onVisibility={(v) => setVisibility({ ...visibility, years_of_experience: v })} />
        <EditField label="Portfolio" value={portfolio} onChange={setPortfolio} visibility={visibility.portfolio} onVisibility={(v) => setVisibility({ ...visibility, portfolio: v })} />
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Bio</p>
          <textarea className="input-field min-h-[100px] resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell mentees about yourself..." />
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 mt-6">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

/* ================================================================
   EDIT: Mentee Professional Info
   ================================================================ */
function MenteeProfessionalEdit({ menteeProfile, profile, onSave, onCancel }: {
  menteeProfile: MenteeProfile; profile: Profile; onSave: (p: MenteeProfile) => void; onCancel: () => void;
}) {
  const toast = useToast();
  const [aspirations, setAspirations] = useState(menteeProfile.aspirations || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateMenteeProfileData(profile.id, { aspirations });
      onSave(updated);
      onCancel();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Professional Information</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
      </div>
      <hr className="border-slate-100 dark:border-slate-700 mb-5" />
      <div className="space-y-5">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Aspirations</p>
          <textarea className="input-field min-h-[100px] resize-none" value={aspirations} onChange={(e) => setAspirations(e.target.value)} placeholder="What are your career aspirations?" />
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 mt-6">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

/* ================================================================
   Profile Completion Tracker
   ================================================================ */
function ProfileCompletion({ profile, mentorProfile, menteeProfile }: {
  profile: Profile; mentorProfile: MentorProfile | null; menteeProfile: MenteeProfile | null;
}) {
  const basicFields = [
    { label: 'First Name', filled: !!(profile.first_name || profile.full_name) },
    { label: 'Last Name', filled: !!profile.last_name },
    { label: 'Username', filled: !!profile.username },
    { label: 'Gender', filled: !!profile.gender },
    { label: 'Avatar', filled: !!profile.avatar_url },
  ];

  const professionalFields = profile.role === 'mentor' && mentorProfile ? [
    { label: 'Area of Mentorship', filled: !!mentorProfile.area_of_mentorship },
    { label: 'Years of Experience', filled: mentorProfile.years_of_experience > 0 },
    { label: 'Bio', filled: !!mentorProfile.bio },
    { label: 'Expertise Tags', filled: (mentorProfile.expertise_tags || []).length > 0 },
    { label: 'Mentorship Style', filled: !!mentorProfile.mentorship_style },
  ] : menteeProfile ? [
    { label: 'Aspirations', filled: !!menteeProfile.aspirations },
    { label: 'Learning Goals', filled: (menteeProfile.learning_goals || []).length > 0 },
    { label: 'Desired Skills', filled: (menteeProfile.desired_skills || []).length > 0 },
  ] : [];

  const allFields = [...basicFields, ...professionalFields];
  const filledCount = allFields.filter(f => f.filled).length;
  const total = allFields.length;
  const percentage = total > 0 ? Math.round((filledCount / total) * 100) : 0;

  const basicFilled = basicFields.filter(f => f.filled).length;
  const profFilled = professionalFields.filter(f => f.filled).length;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Complete your profile</h2>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{percentage}%</span>
          <span className="text-sm text-brand-green-600 font-medium">Complete</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-brand-gradient rounded-full transition-all duration-700" style={{ width: `${percentage}%` }} />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-2">
            {basicFilled === basicFields.length ? <CheckCircle className="w-4 h-4 text-brand-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
            Basic Information
          </span>
          <span className="font-medium">{basicFilled}/{basicFields.length}</span>
        </div>
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-2">
            {profFilled === professionalFields.length ? <CheckCircle className="w-4 h-4 text-brand-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
            Professional Information
          </span>
          <span className="font-medium">{profFilled}/{professionalFields.length}</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Shared Components
   ================================================================ */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white font-medium">{value}</p>
    </div>
  );
}

function EditField({ label, value, onChange, required, type, visibility, onVisibility, alwaysPublic }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
  visibility?: string; onVisibility?: (v: string) => void; alwaysPublic?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}{required ? ' (required)' : ''}</p>
      <input type={type || 'text'} className="input-field" value={value} onChange={(e) => onChange(e.target.value)} />
      {alwaysPublic ? (
        <p className="text-xs font-medium text-slate-500 mt-1">Public</p>
      ) : onVisibility ? (
        <VisibilityTag value={visibility || 'public'} onChange={onVisibility} />
      ) : null}
    </div>
  );
}

function VisibilityTag({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const isPublic = value !== 'only_me';

  return (
    <div className="relative inline-block mt-1">
      <button type="button" onClick={() => setOpen(!open)}
        className="text-xs font-medium flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700"
      >
        Visibility: <span className={isPublic ? 'text-brand-green-600' : 'text-amber-600'}>{isPublic ? 'Public' : 'Only me'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-6 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 py-1 w-32 animate-fade-in">
            <button onClick={() => { onChange('public'); setOpen(false); }}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <Eye className="w-3 h-3" /> Public
            </button>
            <button onClick={() => { onChange('only_me'); setOpen(false); }}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <EyeOff className="w-3 h-3" /> Only me
            </button>
          </div>
        </>
      )}
    </div>
  );
}
