// TypeScript types for the Propel platform

export type UserRole = 'mentor' | 'mentee';

export type ConnectionStatus = 'pending' | 'active' | 'rejected' | 'ended';

export type MessageType = 'dm' | 'group';

export type InviteType = 'group' | 'private';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  username: string | null;
  gender: string | null;
  role: UserRole;
  avatar_url: string | null;
  onboarding_complete: boolean;
  calendly_url?: string | null;
  notification_prefs?: NotificationPrefs;
  field_visibility?: Record<string, string>;
  created_at: string;
}

export interface MentorProfile {
  id: string;
  user_id: string;
  bio: string;
  expertise_tags: string[];
  work_history: WorkHistoryEntry[];
  mentorship_style: string;
  max_capacity: number;
  current_count: number;
  is_at_capacity: boolean;
  area_of_mentorship: string;
  years_of_experience: number;
  portfolio: string | null;
  created_at: string;
}

export interface WorkHistoryEntry {
  role: string;
  company: string;
  years: number;
}

export interface MenteeProfile {
  id: string;
  user_id: string;
  aspirations: string;
  learning_goals: string[];
  desired_skills: string[];
  created_at: string;
}

export interface Connection {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: ConnectionStatus;
  request_message: string;
  created_at: string;
  updated_at: string;
  // Joined data
  mentor?: Profile & { mentor_profile?: MentorProfile };
  mentee?: Profile & { mentee_profile?: MenteeProfile };
}

export interface Message {
  id: string;
  sender_id: string;
  connection_id: string | null;
  group_id: string | null;
  content: string;
  type: MessageType;
  created_at: string;
  sender?: Profile;
}

export interface Group {
  id: string;
  mentor_id: string;
  name: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Curriculum {
  id: string;
  connection_id: string;
  goals: CurriculumGoal[];
  milestones: CurriculumMilestone[];
  created_at: string;
}

export interface CurriculumGoal {
  id: string;
  title: string;
  target_date: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface CurriculumMilestone {
  id: string;
  goal_id: string;
  title: string;
  completed: boolean;
}

export interface Event {
  id: string;
  mentor_id: string;
  title: string;
  description: string;
  event_date: string;
  zoom_link: string | null;
  invite_type: InviteType;
  invitee_id: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  connection_id: string;
  score: number;
  comment: string;
  created_at: string;
  reviewer?: Profile;
}

// Composite types for Phase 2 views
export interface MentorSearchResult extends Profile {
  mentor_profiles: MentorProfile[];
  avg_rating: number;
  review_count: number;
}

export interface ConnectionWithProfiles extends Connection {
  mentor: Profile & { mentor_profiles: MentorProfile[] };
  mentee: Profile & { mentee_profiles: MenteeProfile[] };
}

export type ReviewWithReviewer = Omit<Rating, 'reviewer'> & {
  reviewer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
};

// Phase 3 types
export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_rejected'
  | 'new_message'
  | 'event_created'
  | 'event_reminder'
  | 'review_received';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export type RSVPStatus = 'going' | 'maybe' | 'declined';

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  created_at: string;
  profile?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

export interface EventWithRSVPs extends Event {
  rsvps: EventRSVP[];
  mentor?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

export interface NotificationPrefs {
  [key: string]: boolean;
  in_app_connections: boolean;
  in_app_messages: boolean;
  in_app_events: boolean;
  in_app_reviews: boolean;
  email_connections: boolean;
  email_messages: boolean;
  email_events: boolean;
  email_reviews: boolean;
}

export type MessageWithSender = Omit<Message, 'sender'> & {
  sender: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
};

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string;
  connectionId?: string;
  groupId?: string;
  partnerId?: string;
  partnerAvatar?: string | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}
