import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { FacilityBooking, Facility } from '../utils/types';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<FacilityBooking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ facility_id: '', purpose: '', date: '', start_time: '', end_time: '' });

  const fetchBookings = () => {
    api.get('/bookings').then((res) => setBookings(res.data.items)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
    api.get('/facilities').then((res) => setFacilities(res.data.facilities));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/bookings', { ...form, facility_id: Number(form.facility_id) });
      setToast({ message: 'Booking requested', type: 'success' });
      setShowForm(false);
      setForm({ facility_id: '', purpose: '', date: '', start_time: '', end_time: '' });
      fetchBookings();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.put(`/bookings/${id}/${action}`);
      setToast({ message: `Booking ${action}d`, type: 'success' });
      fetchBookings();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all hover:shadow-lg">+ New Booking</button>
      </div>

      <div className="space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[b.status]}`}>{b.status}</span>
                </div>
                <h3 className="font-semibold text-gray-800">{b.facility_name}</h3>
                <p className="text-sm text-gray-600">{b.purpose}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {b.date} &middot; {b.start_time} - {b.end_time}
                  {b.booker_name && <> &middot; By {b.booker_name}</>}
                </p>
              </div>
              {user?.role === 'admin' && b.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleAction(b.id, 'approve')} className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 transition-colors">Approve</button>
                  <button onClick={() => handleAction(b.id, 'reject')} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {bookings.length === 0 && <p className="text-center text-gray-400 py-8">No bookings yet</p>}
      </div>

      {showForm && (
        <Modal title="Request Booking" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select required value={form.facility_id} onChange={(e) => setForm({ ...form, facility_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">Select Facility *</option>
              {facilities.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.type})</option>)}
            </select>
            <input placeholder="Purpose *" required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <div className="grid grid-cols-3 gap-3">
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Request</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
