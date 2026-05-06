import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // Listen for auth state changes (email confirmed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        window.location.href = '/dashboard';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function resendEmail() {
    setResending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        await supabase.auth.resend({
          type: 'signup',
          email: session.user.email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        setResent(true);
      }
    } catch (err) {
      console.error('Error resending email:', err);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="card p-8 text-center animate-fade-in">
      {/* Animated envelope */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 bg-brand-blue-100 rounded-full animate-pulse-soft" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-10 h-10 text-brand-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h1>
      <p className="text-slate-500 mb-2">
        We've sent a verification link to your email address.
      </p>
      <p className="text-slate-400 text-sm mb-8">
        Click the link in the email to activate your account and get started.
      </p>

      <div className="space-y-3">
        <button
          onClick={resendEmail}
          disabled={resending || resent}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {resent ? 'Email Resent ✓' : resending ? 'Resending...' : 'Resend Verification Email'}
        </button>

        <Link to="/login" className="block text-sm text-slate-500 hover:text-brand-blue-600 transition-colors">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
