import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, GraduationCap, Lock, Mail, ArrowRight, AlertCircle, HeartHandshake, Zap } from 'lucide-react';
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleQuickLogin = (accountEmail: string, accountPass: string) => {
    setEmail(accountEmail);
    setPassword(accountPass);
    setTimeout(async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const user = await login(accountEmail, accountPass);
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

  const quickAccounts = [
    {
      name: 'Administrator',
      roleSubtitle: 'Full Management Access',
      email: 'admin@aksharpaaul.org',
      pass: 'admin123',
      isAdmin: true
    },
    {
      name: 'Riya Patil',
      roleSubtitle: 'Teacher — Navchetna Std 3 (Dharavi)',
      email: 'riya.patil@aksharpaaul.org',
      pass: 'teacher123',
      isAdmin: false
    },
    {
      name: 'Vikram Kulkarni',
      roleSubtitle: 'Teacher — Prerana Std 4 (Govandi)',
      email: 'vikram.kulkarni@aksharpaaul.org',
      pass: 'teacher123',
      isAdmin: false
    },
    {
      name: 'Anita Sharma',
      roleSubtitle: 'Teacher — Udaan Std 5 (Wadala)',
      email: 'anita.sharma@aksharpaaul.org',
      pass: 'teacher123',
      isAdmin: false
    },
    {
      name: 'Suresh Pawar',
      roleSubtitle: 'Teacher — Sankalp Std 6 (Kurla)',
      email: 'suresh.pawar@aksharpaaul.org',
      pass: 'teacher123',
      isAdmin: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header controls */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <Logo size="sm" showSubtitle={true} className="sm:hidden" />
        <Logo size="md" showSubtitle={true} className="hidden sm:flex" />
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-6">
        <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800">
          {/* Centered Brand Presentation */}
          <div className="mb-6">
            <Logo size="lg" stacked={true} showSubtitle={true} />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('auth.welcomeBack')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('auth.signInSubtitle')}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Normal Login Form */}
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

          {/* Quick Login Section */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {t('auth.quickLogin')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {t('auth.quickLoginSubtitle')}
              </span>
            </div>

            <div className="space-y-2">
              {quickAccounts.map(account => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account.email, account.pass)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 hover:bg-teal-50/70 dark:bg-slate-900/60 dark:hover:bg-slate-800 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      account.isAdmin
                        ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {account.isAdmin ? <Shield className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                        {account.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {account.roleSubtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 ml-2">
                    Sign in &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 pb-2">
        <HeartHandshake className="w-4 h-4 text-teal-600" />
        <span>{t('brand.name')} &bull; {t('brand.ngo')}</span>
      </div>
    </div>
  );
};
