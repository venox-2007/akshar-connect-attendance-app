import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, GraduationCap, Lock, Mail, ArrowRight, AlertCircle, HeartHandshake } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { Logo } from '../../components/common/Logo';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { LanguageSelector } from '../../components/common/LanguageSelector';
import { useToast } from '../../hooks/useToast';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@aksharconnect.demo');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage(t('auth.invalidCredentials'));
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const user = await login(email, password);
      toast.success(t('auth.loggedInSuccess', { name: user.name }));

      // Redirect based on role
      const from = (location.state as any)?.from?.pathname;
      if (from && !from.includes('/login')) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/teacher/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    // Auto submit
    setTimeout(async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const user = await login(demoEmail, demoPass);
        toast.success(t('auth.loggedInSuccess', { name: user.name }));
        if (user.role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/teacher/dashboard', { replace: true });
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header controls */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('auth.welcomeBack')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('auth.signInSubtitle')}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{t('auth.loggingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.signInButton')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo One-Click Logins */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('auth.demoAccountsTitle')}
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">1-Click</span>
            </div>

            <div className="space-y-2">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@aksharconnect.demo', 'admin123')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 hover:bg-teal-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {t('auth.adminAccount')} (Dr. Anand)
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      admin@aksharconnect.demo
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                  Login &rarr;
                </span>
              </button>

              {/* Teacher 1 Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('riya@aksharconnect.demo', 'teacher123')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {t('auth.teacherAccount')} (Riya Patil - Std 3)
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      riya@aksharconnect.demo
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Login &rarr;
                </span>
              </button>

              {/* Other teachers selector */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('vikram@aksharconnect.demo', 'teacher123')}
                  className="px-2 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Vikram (Std 4)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('anita@aksharconnect.demo', 'teacher123')}
                  className="px-2 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Anita (Std 5)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('suresh@aksharconnect.demo', 'teacher123')}
                  className="px-2 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Suresh (Std 6)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 pb-2">
        <HeartHandshake className="w-4 h-4 text-rose-500" />
        <span>{t('brand.name')} &bull; {t('brand.ngo')}</span>
      </div>
    </div>
  );
};
