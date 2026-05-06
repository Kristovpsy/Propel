import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { signUpSchema, type SignUpFormData } from '../../lib/validators';
import type { UserRole } from '../../types';
import { Eye, EyeOff, GraduationCap, Award, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const preselectedRole = searchParams.get('role') as UserRole | null;
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: preselectedRole || undefined,
    },
  });

  const selectedRole = watch('role');

  async function onSubmit(data: SignUpFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: `${data.first_name} ${data.last_name}`,
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignUp() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) setError(error.message);
  }

  if (success) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-brand-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h2>
        <p className="text-slate-500 mb-6">
          We've sent a verification link to your email address. Click the link to verify your account.
        </p>
        <Link to="/login" className="text-brand-blue-600 font-semibold hover:underline text-sm">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Your Account</h1>
        <p className="text-slate-500 text-sm">Start your mentorship journey today</p>
      </div>

      {/* Role Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setValue('role', 'mentee')}
          className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
            selectedRole === 'mentee'
              ? 'border-brand-green-500 bg-brand-green-50 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <GraduationCap className={`w-6 h-6 mx-auto mb-2 ${selectedRole === 'mentee' ? 'text-brand-green-600' : 'text-slate-400'}`} />
          <p className={`font-semibold text-sm ${selectedRole === 'mentee' ? 'text-brand-green-700' : 'text-slate-600'}`}>Mentee</p>
          <p className="text-xs text-slate-400 mt-0.5">I want to learn</p>
        </button>
        <button
          type="button"
          onClick={() => setValue('role', 'mentor')}
          className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
            selectedRole === 'mentor'
              ? 'border-brand-blue-500 bg-brand-blue-50 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Award className={`w-6 h-6 mx-auto mb-2 ${selectedRole === 'mentor' ? 'text-brand-blue-600' : 'text-slate-400'}`} />
          <p className={`font-semibold text-sm ${selectedRole === 'mentor' ? 'text-brand-blue-700' : 'text-slate-600'}`}>Mentor</p>
          <p className="text-xs text-slate-400 mt-0.5">I want to guide</p>
        </button>
      </div>
      {errors.role && <p className="text-red-500 text-xs mb-3 -mt-3">{errors.role.message}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="label">First Name</label>
            <input id="first_name" type="text" {...register('first_name')} className="input-field" placeholder="First name" />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <label htmlFor="last_name" className="label">Last Name</label>
            <input id="last_name" type="text" {...register('last_name')} className="input-field" placeholder="Last name" />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" {...register('email')} className="input-field" placeholder="you@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className="input-field pr-10"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-400 font-medium">or continue with</span>
        </div>
      </div>

      <button onClick={handleGoogleSignUp} className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm text-slate-700">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-blue-600 font-semibold hover:underline">Log in</Link>
      </p>
    </div>
  );
}
