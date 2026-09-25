import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/common/Logo';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const handleGoHome = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/teacher/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Logo size="md" className="mb-6" />
      <div className="p-3 rounded-lg bg-amber-50 text-amber-700 mb-4 border border-amber-200">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">
        404 — Page Not Found
      </h1>
      <p className="text-xs text-slate-500 max-w-sm mt-1.5">
        The requested resource is not available or you may not have authorization to view it.
      </p>
      <button
        type="button"
        onClick={handleGoHome}
        className="mt-6 px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};
