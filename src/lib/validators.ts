import { z } from 'zod';

export const signUpSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['mentor', 'mentee'], { error: 'Please select a role' }),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const mentorProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be under 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say'], { error: 'Please select your gender' }),
  area_of_mentorship: z.string().min(1, 'Please select an area of mentorship'),
  years_of_experience: z.number().min(0, 'Must be 0 or more').max(50, 'Maximum 50 years'),
  portfolio: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(1000, 'Bio must be under 1000 characters'),
  expertise_tags: z.array(z.string()).min(1, 'Add at least one expertise tag').max(10, 'Maximum 10 tags'),
  work_history: z.array(z.object({
    role: z.string().min(2, 'Role is required'),
    company: z.string().min(2, 'Company is required'),
    years: z.number().min(0).max(50),
  })).min(1, 'Add at least one work experience'),
  mentorship_style: z.string().min(1, 'Please select a mentorship style'),
  max_capacity: z.number().min(1, 'Minimum 1 mentee').max(20, 'Maximum 20 mentees'),
});

export const menteeProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be under 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say'], { error: 'Please select your gender' }),
  aspirations: z.string().min(20, 'Aspirations must be at least 20 characters').max(1000, 'Must be under 1000 characters'),
  learning_goals: z.array(z.string()).min(1, 'Add at least one learning goal').max(5, 'Maximum 5 goals'),
  desired_skills: z.array(z.string()).min(1, 'Add at least one desired skill').max(10, 'Maximum 10 skills'),
});

export const connectionRequestSchema = z.object({
  request_message: z.string().min(20, 'Message must be at least 20 characters').max(500, 'Message must be under 500 characters'),
});

export const goalSchema = z.object({
  title: z.string().min(3, 'Goal title must be at least 3 characters').max(200, 'Goal title must be under 200 characters'),
  target_date: z.string().min(1, 'Please set a target date'),
});

export const milestoneSchema = z.object({
  title: z.string().min(2, 'Milestone must be at least 2 characters').max(200, 'Milestone must be under 200 characters'),
});

export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  event_date: z.string().min(1, 'Please select a date and time'),
  invite_type: z.enum(['group', 'private']),
  invitee_id: z.string().optional(),
  zoom_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const reviewSchema = z.object({
  score: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(500, 'Review must be under 500 characters'),
});

export const profileUpdateSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say']),
  bio: z.string().max(1000).optional(),
  calendly_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type MentorProfileFormData = z.infer<typeof mentorProfileSchema>;
export type MenteeProfileFormData = z.infer<typeof menteeProfileSchema>;
export type ConnectionRequestFormData = z.infer<typeof connectionRequestSchema>;
export type GoalFormData = z.infer<typeof goalSchema>;
export type MilestoneFormData = z.infer<typeof milestoneSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

