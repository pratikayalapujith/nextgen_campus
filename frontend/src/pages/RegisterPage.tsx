import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Department } from '../utils/types';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', full_name: '', phone: '',
    roll_number: '', employee_id: '', department_id: '', semester: '',
    section: '', admission_year: new Date().getFullYear().toString(),
    designation: '', qualification: '', specialization: '',
    guardian_name: '', guardian_phone: '',
  });

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data.departments)).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const data: Record<string, unknown> = {
        email: form.email, password: form.password, full_name: form.full_name,
        role, phone: form.phone, department_id: Number(form.department_id),
      };
      if (role === 'student') {
        data.roll_number = form.roll_number;
        data.semester = Number(form.semester);
        data.section = form.section;
        data.admission_year = Number(form.admission_year);
        data.guardian_name = form.guardian_name;
        data.guardian_phone = form.guardian_phone;
      } else {
        data.employee_id = form.employee_id;
        data.designation = form.designation;
        data.qualification = form.qualification;
        data.specialization = form.specialization;
      }
      await api.post('/auth/register', data);
      navigate('/login');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none";

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradient relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="animate-fade-in-up">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <span className="text-xl font-bold">SC</span>
            </div>
            <h1 className="text-4xl font-bold">Join NextGen Campus</h1>
            <p className="mt-4 text-purple-100/80 max-w-sm leading-relaxed">Create your account and access all campus management features.</p>
          </div>
          <div className="mt-12 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {['Digital Attendance', 'Timetable Management', 'Notice Board', 'Facility Booking'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-sm text-purple-100">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-6 py-8 lg:w-3/5">
        <div className="w-full max-w-lg animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-1 text-sm text-gray-500">Step {step} of 2</p>
          <div className="mt-3 flex gap-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>

          {error && <div className="mt-4 animate-scale-in rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-6">
            {step === 1 && (
              <div className="space-y-5 animate-slide-in-right">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'student' as const, label: 'Student', desc: 'View timetable, attendance & notices' },
                      { value: 'faculty' as const, label: 'Faculty', desc: 'Manage classes & mark attendance' },
                    ]).map((r) => (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${role === r.value ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <p className="font-semibold text-gray-800">{r.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Full Name *</label><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Email *</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Password *</label><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Confirm Password *</label><input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Department *</label>
                    <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className={inputClass}>
                      <option value="">Select</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="button" onClick={() => { if (!form.full_name || !form.email || !form.password || !form.department_id) { setError('Please fill all required fields'); return; } setError(''); setStep(2); }}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98]">
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-slide-in-right">
                {role === 'student' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Roll Number *</label><input required value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Semester *</label><input type="number" min={1} max={8} required value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Section</label><input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Admission Year *</label><input type="number" required value={form.admission_year} onChange={(e) => setForm({ ...form, admission_year: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Guardian Name</label><input value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Guardian Phone</label><input value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} className={inputClass} /></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Employee ID *</label><input required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Designation</label><input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Qualification</label><input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1 block text-xs font-medium text-gray-600">Specialization</label><input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className={inputClass} /></div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors">Back</button>
                  <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 active:scale-[0.98]">
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
