import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { TimetableEntry, Department, Subject } from '../utils/types';
import { DAY_NAMES } from '../utils/constants';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function TimetablePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<{ id: number; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    subject_id: '', faculty_id: '', department_id: '', semester: '',
    section: '', day_of_week: '', start_time: '', end_time: '', room: '',
  });

  const fetchTimetable = () => {
    const endpoint = user?.role === 'admin' ? '/timetable' : '/timetable/my';
    api.get(endpoint).then((res) => setEntries(res.data.timetable)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTimetable();
    if (user?.role === 'admin') {
      Promise.all([api.get('/departments'), api.get('/subjects'), api.get('/faculty')]).then(([d, s, f]) => {
        setDepartments(d.data.departments);
        setSubjects(s.data.subjects);
        setFacultyList(f.data.items.map((x: Record<string, unknown>) => ({ id: x.id, full_name: x.full_name })));
      });
    }
  }, [user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/timetable', {
        ...form,
        subject_id: Number(form.subject_id), faculty_id: Number(form.faculty_id),
        department_id: Number(form.department_id), semester: Number(form.semester),
        day_of_week: Number(form.day_of_week),
      });
      setToast({ message: 'Entry created', type: 'success' });
      setShowForm(false);
      fetchTimetable();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    await api.delete(`/timetable/${id}`);
    fetchTimetable();
  };

  if (loading) return <LoadingSpinner />;

  // Group by day
  const byDay: Record<number, TimetableEntry[]> = {};
  entries.forEach((e) => {
    if (!byDay[e.day_of_week]) byDay[e.day_of_week] = [];
    byDay[e.day_of_week].push(e);
  });

  const slotColors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800', 'bg-pink-100 text-pink-800', 'bg-teal-100 text-teal-800'];

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'admin' ? 'Timetable Management' : 'My Timetable'}
        </h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all hover:shadow-lg">+ Add Entry</button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <div className="min-w-[800px]">
          {DAY_NAMES.slice(0, 6).map((day, dayIdx) => {
            const dayEntries = byDay[dayIdx] || [];
            return (
              <div key={dayIdx} className="flex border-b border-gray-100 last:border-b-0">
                <div className="w-28 shrink-0 bg-gray-50 p-3 font-medium text-sm text-gray-700 flex items-center">
                  {day}
                </div>
                <div className="flex flex-1 gap-2 p-2 overflow-x-auto">
                  {dayEntries.length === 0 ? (
                    <span className="text-xs text-gray-400 p-2">No classes</span>
                  ) : (
                    dayEntries
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((e, i) => (
                        <div
                          key={e.id}
                          className={`rounded-lg p-2.5 text-xs shrink-0 min-w-[140px] transition-all hover:shadow-md ${slotColors[i % slotColors.length]}`}
                        >
                          <p className="font-semibold">{e.subject_name}</p>
                          <p className="opacity-75">{e.start_time} - {e.end_time}</p>
                          <p className="opacity-75">{e.faculty_name}</p>
                          {e.room && <p className="opacity-75">Room: {e.room}</p>}
                          {user?.role === 'admin' && (
                            <button onClick={() => handleDelete(e.id)} className="mt-1 text-red-600 hover:underline">Delete</button>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <Modal title="Add Timetable Entry" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Department *</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Subject *</option>
                {subjects.filter((s) => !form.department_id || s.department_id === Number(form.department_id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select required value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Faculty *</option>
                {facultyList.map((f) => <option key={f.id} value={f.id}>{f.full_name}</option>)}
              </select>
              <input placeholder="Semester *" type="number" min={1} max={8} required value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <input placeholder="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <select required value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Day *</option>
                {DAY_NAMES.slice(0, 6).map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              <select required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Start Time *</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">End Time *</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
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
