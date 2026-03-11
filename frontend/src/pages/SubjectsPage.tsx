import { useState, useEffect } from 'react';
import api from '../api/axios';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Subject, Department } from '../utils/types';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<(Subject & Record<string, unknown>)[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyList, setFacultyList] = useState<{ id: number; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: '', name: '', department_id: '', semester: '', credits: '3', faculty_id: '' });

  const fetchData = () => {
    Promise.all([
      api.get('/subjects'),
      api.get('/departments'),
      api.get('/faculty'),
    ]).then(([subRes, deptRes, facRes]) => {
      setSubjects(subRes.data.subjects);
      setDepartments(deptRes.data.departments);
      setFacultyList(facRes.data.items.map((f: Record<string, unknown>) => ({ id: f.id, full_name: f.full_name })));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ code: '', name: '', department_id: '', semester: '', credits: '3', faculty_id: '' }); setEditId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...form, department_id: Number(form.department_id), semester: Number(form.semester), credits: Number(form.credits), faculty_id: form.faculty_id ? Number(form.faculty_id) : null };
      if (editId) {
        await api.put(`/subjects/${editId}`, data);
        setToast({ message: 'Subject updated', type: 'success' });
      } else {
        await api.post('/subjects', data);
        setToast({ message: 'Subject created', type: 'success' });
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subject?')) return;
    try { await api.delete(`/subjects/${id}`); setToast({ message: 'Subject deleted', type: 'success' }); fetchData(); }
    catch { setToast({ message: 'Failed to delete', type: 'error' }); }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Subject' },
    { key: 'department_name', label: 'Department' },
    { key: 'semester', label: 'Sem' },
    { key: 'credits', label: 'Credits' },
    { key: 'faculty_name', label: 'Faculty' },
    {
      key: 'actions', label: 'Actions',
      render: (item: Subject & Record<string, unknown>) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); setEditId(item.id); setForm({ code: item.code, name: item.name, department_id: String(item.department_id), semester: String(item.semester), credits: String(item.credits), faculty_id: item.faculty_id ? String(item.faculty_id) : '' }); setShowForm(true); }} className="text-blue-600 hover:underline text-xs">Edit</button>
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
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">+ Add Subject</button>
      </div>
      <DataTable columns={columns} data={subjects} />
      {showForm && (
        <Modal title={editId ? 'Edit Subject' : 'Add Subject'} onClose={() => { setShowForm(false); resetForm(); }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Subject Code *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} disabled={!!editId} className="rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100 focus:border-blue-500 focus:outline-none" />
              <input placeholder="Subject Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Department *</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input placeholder="Semester *" type="number" min={1} max={8} required value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Credits" type="number" min={1} max={6} value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <select value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Assign Faculty</option>
                {facultyList.map((f) => <option key={f.id} value={f.id}>{f.full_name}</option>)}
              </select>
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
