import { useState, useEffect } from 'react';
import api from '../api/axios';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Department } from '../utils/types';

interface StudentRow {
  id: number;
  full_name: string;
  email: string;
  roll_number: string;
  department_name: string;
  semester: number;
  section: string;
  [key: string]: unknown;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    roll_number: '', department_id: '', semester: '', section: '',
    admission_year: new Date().getFullYear().toString(),
    guardian_name: '', guardian_phone: '', address: '',
  });

  const fetchStudents = () => {
    api.get('/students').then((res) => {
      setStudents(res.data.items);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
    api.get('/departments').then((res) => setDepartments(res.data.departments));
  }, []);

  const resetForm = () => {
    setForm({
      email: '', password: '', full_name: '', phone: '',
      roll_number: '', department_id: '', semester: '', section: '',
      admission_year: new Date().getFullYear().toString(),
      guardian_name: '', guardian_phone: '', address: '',
    });
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...form, department_id: Number(form.department_id), semester: Number(form.semester), admission_year: Number(form.admission_year) };
      if (editId) {
        await api.put(`/students/${editId}`, data);
        setToast({ message: 'Student updated', type: 'success' });
      } else {
        await api.post('/students', data);
        setToast({ message: 'Student created', type: 'success' });
      }
      setShowForm(false);
      resetForm();
      fetchStudents();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  const handleEdit = (student: StudentRow) => {
    setEditId(student.id);
    setForm({
      email: student.email || '', password: '', full_name: student.full_name || '',
      phone: '', roll_number: student.roll_number || '',
      department_id: String(student.department_id ?? ''),
      semester: String(student.semester ?? ''), section: student.section || '',
      admission_year: String(student.admission_year ?? ''),
      guardian_name: '', guardian_phone: '', address: '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      setToast({ message: 'Student deleted', type: 'success' });
      fetchStudents();
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  const columns = [
    { key: 'roll_number', label: 'Roll No' },
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department_name', label: 'Department' },
    { key: 'semester', label: 'Sem' },
    { key: 'section', label: 'Sec' },
    {
      key: 'actions', label: 'Actions',
      render: (item: StudentRow) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="text-blue-600 hover:underline text-xs">Edit</button>
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
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Student
        </button>
      </div>

      <DataTable columns={columns} data={students} />

      {showForm && (
        <Modal title={editId ? 'Edit Student' : 'Add Student'} onClose={() => { setShowForm(false); resetForm(); }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Full Name *" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Email *" type="email" required={!editId} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editId} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100" />
              {!editId && <input placeholder="Password *" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />}
              <input placeholder="Roll Number *" required={!editId} value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} disabled={!!editId} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100" />
              <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Select Department *</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input placeholder="Semester *" type="number" min={1} max={8} required value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Admission Year *" type="number" required value={form.admission_year} onChange={(e) => setForm({ ...form, admission_year: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Guardian Name" value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Guardian Phone" value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <textarea placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" rows={2} />
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
