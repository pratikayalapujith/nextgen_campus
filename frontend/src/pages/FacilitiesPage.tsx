import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Facility } from '../utils/types';
import { FACILITY_TYPES } from '../utils/constants';

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ name: '', type: 'lab', capacity: '', location: '', description: '' });

  const fetchFacilities = () => {
    api.get('/facilities').then((res) => setFacilities(res.data.facilities)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchFacilities(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/facilities', { ...form, capacity: form.capacity ? Number(form.capacity) : null });
      setToast({ message: 'Facility created', type: 'success' });
      setShowForm(false);
      fetchFacilities();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this facility?')) return;
    await api.delete(`/facilities/${id}`);
    fetchFacilities();
  };

  const typeIcons: Record<string, string> = { lab: 'bg-blue-100 text-blue-700', hall: 'bg-purple-100 text-purple-700', seminar_room: 'bg-green-100 text-green-700', sports: 'bg-orange-100 text-orange-700', library: 'bg-teal-100 text-teal-700' };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Facilities</h1>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">+ Add Facility</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((f) => (
          <div key={f.id} className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${typeIcons[f.type] || typeIcons.lab}`}>{f.type.replace('_', ' ')}</span>
                <h3 className="mt-2 font-semibold text-gray-800">{f.name}</h3>
                {f.location && <p className="text-xs text-gray-500 mt-1">{f.location}</p>}
                {f.capacity && <p className="text-xs text-gray-500">Capacity: {f.capacity}</p>}
              </div>
              <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title="Add Facility" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input placeholder="Facility Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {FACILITY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
              </select>
              <input placeholder="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" rows={2} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Create</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
