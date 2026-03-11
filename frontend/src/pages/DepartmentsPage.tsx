import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Department } from '../utils/types';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });

  const fetchDepartments = () => {
    api.get('/departments').then((res) => setDepartments(res.data.departments)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/departments/${editId}`, form);
        setToast({ message: 'Department updated', type: 'success' });
      } else {
        await api.post('/departments', form);
        setToast({ message: 'Department created', type: 'success' });
      }
      setShowForm(false);
      setForm({ name: '', code: '' });
      setEditId(null);
      fetchDepartments();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      setToast({ message: 'Department deleted', type: 'success' });
      fetchDepartments();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Failed to delete', type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <button onClick={() => { setForm({ name: '', code: '' }); setEditId(null); setShowForm(true); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">+ Add Department</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <div key={d.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{d.name}</h3>
                <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{d.code}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditId(d.id); setForm({ name: d.name, code: d.code }); setShowForm(true); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:underline text-xs">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title={editId ? 'Edit Department' : 'Add Department'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input placeholder="Department Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input placeholder="Code (e.g. CSE) *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">{editId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
