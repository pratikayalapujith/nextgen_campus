import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { Notice } from '../utils/types';
import { CATEGORIES } from '../utils/constants';

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', target_role: 'all', is_pinned: false });

  const fetchNotices = () => {
    api.get('/notices').then((res) => setNotices(res.data.notices)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/notices', form);
      setToast({ message: 'Notice created', type: 'success' });
      setShowForm(false);
      setForm({ title: '', content: '', category: 'general', target_role: 'all', is_pinned: false });
      fetchNotices();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this notice?')) return;
    await api.delete(`/notices/${id}`);
    fetchNotices();
  };

  const categoryColors: Record<string, string> = {
    general: 'bg-gray-100 text-gray-700',
    academic: 'bg-blue-100 text-blue-700',
    event: 'bg-purple-100 text-purple-700',
    urgent: 'bg-red-100 text-red-700',
    exam: 'bg-orange-100 text-orange-700',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notice Board</h1>
        {(user?.role === 'admin' || user?.role === 'faculty') && (
          <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all hover:shadow-lg">+ New Notice</button>
        )}
      </div>

      <div className="space-y-3">
        {notices.map((n, i) => (
          <div
            key={n.id}
            className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md animate-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {n.is_pinned && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">PINNED</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${categoryColors[n.category] || categoryColors.general}`}>{n.category}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 capitalize">{n.target_role}</span>
                </div>
                <h3 className="text-base font-semibold text-gray-800">{n.title}</h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">{n.content}</p>
                <p className="mt-3 text-xs text-gray-400">
                  By {n.author_name} &middot; {n.published_at ? new Date(n.published_at).toLocaleDateString() : ''}
                </p>
              </div>
              {(user?.role === 'admin' || user?.id === n.author_id) && (
                <button onClick={() => handleDelete(n.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs ml-3">Delete</button>
              )}
            </div>
          </div>
        ))}
        {notices.length === 0 && <p className="text-center text-gray-400 py-8">No notices yet</p>}
      </div>

      {showForm && (
        <Modal title="Create Notice" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input placeholder="Title *" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <textarea placeholder="Content *" required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <select value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="all">All</option>
                <option value="student">Students Only</option>
                <option value="faculty">Faculty Only</option>
                <option value="admin">Admin Only</option>
              </select>
            </div>
            {user?.role === 'admin' && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} className="rounded" />
                Pin this notice
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Publish</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
