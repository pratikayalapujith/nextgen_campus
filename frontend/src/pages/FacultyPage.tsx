import { useState, useEffect } from 'react';
import api from '../api/axios';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Department } from '../utils/types';

interface FacultyRow {
  id: number;
  full_name: string;
  email: string;
  employee_id: string;
  department_name: string;
  designation: string;
  qualification: string;
  [key: string]: unknown;
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<FacultyRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    employee_id: '', department_id: '', designation: '',
    qualification: '', specialization: '',
  });

  const fetchFaculty = () => {
    api.get('/faculty').then((res) => setFaculty(res.data.items)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFaculty();
    api.get('/departments').then((res) => setDepartments(res.data.departments));
  }, []);

  const resetForm = () => {
    setForm({ email: '', password: '', full_name: '', phone: '', employee_id: '', department_id: '', designation: '', qualification: '', specialization: '' });
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...form, department_id: Number(form.department_id) };
      if (editId) {
        await api.put(`/faculty/${editId}`, data);
        setToast({ message: 'Faculty updated', type: 'success' });
      } else {
        await api.post('/faculty', data);
        setToast({ message: 'Faculty created', type: 'success' });
      }
      setShowForm(false);
      resetForm();
      fetchFaculty();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this faculty member?')) return;
    try {
      await api.delete(`/faculty/${id}`);
      setToast({ message: 'Faculty deleted', type: 'success' });
      fetchFaculty();
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  const columns = [
    { key: 'employee_id', label: 'Emp ID' },
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department_name', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    {
      key: 'actions', label: 'Actions',
      render: (item: FacultyRow) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); setEditId(item.id); setForm({ email: item.email, password: '', full_name: item.full_name, phone: '', employee_id: item.employee_id, department_id: String(item.department_id ?? ''), designation: item.designation || '', qualification: item.qualification || '', specialization: '' }); setShowForm(true); }} className="text-blue-600 hover:underline text-xs">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-600 hover:underline text-xs">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">+ Add Faculty</button>
      </div>
      <DataTable columns={columns} data={faculty} />
      {showForm && (
        <Modal title={editId ? 'Edit Faculty' : 'Add Faculty'} onClose={() => { setShowForm(false); resetForm(); }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Full Name *" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Email *" type="email" required={!editId} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editId} className="rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100 focus:border-blue-500 focus:outline-none" />
              {!editId && <input placeholder="Password *" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />}
              <input placeholder="Employee ID *" required={!editId} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} disabled={!!editId} className="rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100 focus:border-blue-500 focus:outline-none" />
              <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Select Department *</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">{editId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
