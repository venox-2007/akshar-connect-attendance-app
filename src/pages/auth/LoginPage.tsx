import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, GraduationCap, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { Logo } from '../../components/common/Logo';
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
      roleSubtitle: 'Teacher — 3-A',
      email: 'riya.patil@aksharpaaul.org',
      pass: 'teacher123',
      isAdmin: false
    },
    {
      name: 'Vikram Kulkarni',
      roleSubtitle: 'Teacher — 4-B',
      email: 'vikram.kulkarni@aksharpaaul.org',
      pass: 'teacher123',
      isAdmin: false
    },
    {
      name: 'Anita Sharma',
      roleSubtitle: 'Teacher — 5-A',
      email: 'anita.sharma@aksharpaaul.org',
      pass: 'teacher123',
      isAdmin: false
    },
    {
      name: 'Suresh Pawar',
      roleSubtitle: 'Teacher — 7-A',
      email: 'suresh.pawar@aksharpaaul.org',
      pass: 'teacher123',
      isAdmin: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header controls */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <Logo size="sm" showSubtitle={true} className="sm:hidden" />
        <Logo size="md" showSubtitle={true} className="hidden sm:flex" />
        <div className="flex items-center gap-2">
          <LanguageSelector />
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-6">
        <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-slate-200">
          {/* Centered Brand Presentation */}
          <div className="mb-6">
            <Logo size="lg" stacked={true} showSubtitle={true} />
          </div>

          <div className="text-center mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">
              {t('auth.welcomeBack')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('auth.signInSubtitle')}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Normal Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{t('auth.loggingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.signInButton')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Section */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                {t('auth.quickLogin')}
              </span>
              <span className="text-[10px] text-slate-500">
                {t('auth.quickLoginSubtitle')}
              </span>
            </div>

            <div className="space-y-1.5">
              {quickAccounts.map(account => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account.email, account.pass)}
                  className="w-full flex items-center justify-between p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                      {account.isAdmin ? <Shield className="w-3 h-3 text-slate-700" /> : <GraduationCap className="w-3 h-3 text-slate-700" />}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-semibold text-slate-800 mr-2">
                        {account.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {account.roleSubtitle}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-teal-700 group-hover:underline shrink-0 ml-2">
                    Sign in &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 pb-2">
        <span>{t('brand.name')} &bull; {t('brand.ngo')}</span>
      </div>
    </div>
  );
};
