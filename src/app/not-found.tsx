import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8 text-sky-400 animate-spin-slow" />
      </div>
      <h1 className="text-3xl font-bold font-['Outfit'] text-white mb-2">404 — Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-md mb-6">
        The destination or page you are looking for does not exist in the Operations Mapping Dashboard.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
