import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 font-montserrat flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4">
        <Link to="/" className="inline-block">
          <img src="/propel-logo.png" alt="Propel" className="h-7" />
        </Link>
      </div>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Bottom */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-slate-400">© 2026 Propel. Professional Mentorship for Emerging Leaders.</p>
      </div>
    </div>
  );
}
