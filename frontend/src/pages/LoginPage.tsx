import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 animate-gradient relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="animate-fade-in-up">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <span className="text-2xl font-bold">SC</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight">NextGen Campus<br /><span className="text-blue-200">Management</span></h1>
            <p className="mt-6 max-w-md text-lg text-blue-100/80 leading-relaxed">A unified platform for managing students, faculty, attendance, timetables, and campus facilities.</p>
          </div>
          <div className="mt-12 flex gap-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {[{ label: 'Students', value: '1000+' }, { label: 'Faculty', value: '100+' }, { label: 'Departments', value: '10+' }].map((s) => (
              <div key={s.label}><p className="text-3xl font-bold">{s.value}</p><p className="text-sm text-blue-200/70">{s.label}</p></div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-6 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden mb-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white"><span className="text-xl font-bold">SC</span></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 text-center lg:text-left">Welcome back</h2>
          <p className="mt-2 text-gray-500 text-center lg:text-left">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="animate-scale-in rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">{error}</div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@campus.com"
                className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-gray-400" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 pr-12 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-gray-400" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="group w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-50 active:scale-[0.98]">
              {loading ? <span className="flex items-center justify-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Signing in...</span> : <span className="flex items-center justify-center gap-2">Sign In<svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">Register here</Link></p>
          <div className="mt-8 rounded-xl bg-blue-50 border border-blue-100 p-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-xs font-medium text-blue-700 mb-1">Demo Credentials</p>
            <p className="text-xs text-blue-600">Email: admin@campus.com &middot; Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
