import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { useToast } from '../../lib/useToast';
import {
  updateProfile,
  updateMentorProfileData,
  updateMenteeProfileData,
  updateNotificationPrefs,
  deleteAccount,
} from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { Profile, MentorProfile, MenteeProfile } from '../../types';
import {
  Settings, User, Bell, Shield, Save, Loader2,
  Camera, Trash2, AlertTriangle, ExternalLink,
} from 'lucide-react';

type SettingsTab = 'profile' | 'notifications' | 'danger';

export default function SettingsPage() {
  const { profile, mentorProfile, menteeProfile, setProfile, setMentorProfile, setMenteeProfile } =
    useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'danger', label: 'Danger Zone', icon: Shield },
  ];

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 ml-[52px]">
          Manage your account and preferences.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-6 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-card border border-slate-100 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? tab.key === 'danger'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-brand-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && profile && (
        <ProfileTab
          profile={profile}
          mentorProfile={mentorProfile}
          menteeProfile={menteeProfile}
          onProfileUpdate={setProfile}
          onMentorUpdate={setMentorProfile}
          onMenteeUpdate={setMenteeProfile}
        />
      )}
      {activeTab === 'notifications' && profile && (
        <NotificationsTab profile={profile} />
      )}
      {activeTab === 'danger' && profile && <DangerTab profile={profile} />}
    </div>
  );
}

// ================================================================
// PROFILE TAB
// ================================================================

function ProfileTab({
  profile,
  mentorProfile,
  menteeProfile,
  onProfileUpdate,
  onMentorUpdate,
  onMenteeUpdate,
}: {
  profile: Profile;
  mentorProfile: MentorProfile | null;
  menteeProfile: MenteeProfile | null;
  onProfileUpdate: (p: Profile) => void;
  onMentorUpdate: (p: MentorProfile) => void;
  onMenteeUpdate: (p: MenteeProfile) => void;
}) {
  const toast = useToast();
  const [firstName, setFirstName] = useState(profile.first_name || profile.full_name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '');
  const [calendlyUrl, setCalendlyUrl] = useState(
    profile.calendly_url || ''
  );
  const [bio, setBio] = useState(mentorProfile?.bio || menteeProfile?.aspirations || '');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${profile.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const updated = await updateProfile(profile.id, { avatar_url: publicUrl });
      onProfileUpdate(updated);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      toast.error('Avatar upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSuccess(false);
    try {
      const profileUpdate = await updateProfile(profile.id, {
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        calendly_url: calendlyUrl || undefined,
      });
      onProfileUpdate(profileUpdate);

      if (profile.role === 'mentor' && mentorProfile) {
        const mpUpdate = await updateMentorProfileData(profile.id, { bio });
        onMentorUpdate(mpUpdate);
      } else if (profile.role === 'mentee' && menteeProfile) {
        const meUpdate = await updateMenteeProfileData(profile.id, {
          aspirations: bio,
        });
        onMenteeUpdate(meUpdate);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="card p-6 space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-lg">
              {profile.full_name?.charAt(0) || '?'}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
            {avatarUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <Camera className="w-4 h-4 text-slate-500" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="sr-only"
              disabled={avatarUploading}
            />
          </label>
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{profile.full_name}</p>
          <p className="text-sm text-slate-400">{profile.email}</p>
          <p className="text-xs text-slate-400 capitalize mt-0.5">
            {profile.role}
          </p>
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="label">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Bio / Aspirations */}
      <div>
        <label className="label">
          {profile.role === 'mentor' ? 'Bio' : 'Aspirations'}
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="input-field min-h-[100px] resize-none"
          placeholder={
            profile.role === 'mentor'
              ? 'Tell mentees about yourself...'
              : 'What are your career aspirations?'
          }
        />
      </div>

      {/* Calendly URL */}
      <div>
        <label className="label flex items-center gap-1.5">
          Calendly Link
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </label>
        <input
          type="url"
          value={calendlyUrl}
          onChange={(e) => setCalendlyUrl(e.target.value)}
          className="input-field"
          placeholder="https://calendly.com/your-name"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Optional. Share your scheduling link with connections.
        </p>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        {success && (
          <span className="text-sm text-emerald-600 font-medium animate-fade-in">
            ✓ Saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}

// ================================================================
// NOTIFICATIONS TAB
// ================================================================

function NotificationsTab({ profile }: { profile: Profile }) {
  const toast = useToast();
  const defaultPrefs = {
    in_app_connections: true,
    in_app_messages: true,
    in_app_events: true,
    in_app_reviews: true,
    email_connections: true,
    email_messages: false,
    email_events: true,
    email_reviews: true,
  };

  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    profile.notification_prefs || defaultPrefs
  );
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function toggle(key: string) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setIsSaving(true);
    setSuccess(false);
    try {
      await updateNotificationPrefs(profile.id, prefs);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save prefs:', err);
      toast.error('Failed to save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  }

  const sections = [
    {
      title: 'In-App Notifications',
      description: 'Show notifications in the bell menu.',
      items: [
        { key: 'in_app_connections', label: 'Connection requests & responses' },
        { key: 'in_app_messages', label: 'New messages' },
        { key: 'in_app_events', label: 'New events & reminders' },
        { key: 'in_app_reviews', label: 'New reviews' },
      ],
    },
    {
      title: 'Email Notifications',
      description: 'Receive emails for important updates.',
      note: 'Email delivery requires Resend integration (coming soon).',
      items: [
        { key: 'email_connections', label: 'Connection requests & responses' },
        { key: 'email_messages', label: 'New messages' },
        { key: 'email_events', label: 'New events & reminders' },
        { key: 'email_reviews', label: 'New reviews' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title} className="card p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-0.5">
            {section.title}
          </h3>
          <p className="text-xs text-slate-400 mb-4">{section.description}</p>
          {section.note && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-2.5 rounded-lg mb-4">
              {section.note}
            </div>
          )}
          <div className="space-y-3">
            {section.items.map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between cursor-pointer group"
              >
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                  {item.label}
                </span>
                <div
                  onClick={() => toggle(item.key)}
                  className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                    prefs[item.key] ? 'bg-brand-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      prefs[item.key] ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
        {success && (
          <span className="text-sm text-emerald-600 font-medium animate-fade-in">
            ✓ Saved!
          </span>
        )}
      </div>
    </div>
  );
}

// ================================================================
// DANGER ZONE TAB
// ================================================================

function DangerTab({ profile }: { profile: Profile }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    if (confirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await deleteAccount(profile.id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-6 border-red-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-700 text-sm">
              Delete Account
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              This action is irreversible. All your data, connections, messages,
              and reviews will be permanently deleted.
            </p>
          </div>
        </div>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </button>
        ) : (
          <div className="space-y-3 mt-4 pt-4 border-t border-red-100">
            <p className="text-sm text-red-700 font-medium">
              Type <span className="font-bold">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="input-field border-red-200 focus:ring-red-500 focus:border-red-500"
              placeholder="Type DELETE"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || isDeleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                className="btn-ghost text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
