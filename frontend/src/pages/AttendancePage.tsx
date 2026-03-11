import { useState, useEffect } from 'react';
import api from '../api/axios';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { TimetableEntry, StudentForClass } from '../utils/types';

export default function AttendancePage() {
  const { user } = useAuth();

  if (user?.role === 'faculty') return <FacultyAttendance />;
  if (user?.role === 'student') return <StudentAttendance />;
  return <AdminAttendance />;
}

function FacultyAttendance() {
  const [classes, setClasses] = useState<TimetableEntry[]>([]);
  const [selectedClass, setSelectedClass] = useState<TimetableEntry | null>(null);
  const [students, setStudents] = useState<StudentForClass[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api.get('/timetable/my').then((res) => setClasses(res.data.timetable)).finally(() => setLoading(false));
  }, []);

  const selectClass = async (entry: TimetableEntry) => {
    setSelectedClass(entry);
    const res = await api.get(`/attendance/students-for-class?timetable_entry_id=${entry.id}`);
    setStudents(res.data.students);
    const defaultAtt: Record<number, string> = {};
    res.data.students.forEach((s: StudentForClass) => { defaultAtt[s.id] = 'present'; });
    setAttendance(defaultAtt);
  };

  const submitAttendance = async () => {
    try {
      const records = Object.entries(attendance).map(([sid, status]) => ({
        student_id: Number(sid), status,
      }));
      await api.post('/attendance/mark', {
        timetable_entry_id: selectedClass!.id,
        date,
        records,
      });
      setToast({ message: 'Attendance marked successfully!', type: 'success' });
      setSelectedClass(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setToast({ message: axiosErr.response?.data?.error || 'Error', type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>

      {!selectedClass ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Select a class to mark attendance:</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => selectClass(c)}
                className="group rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <p className="font-semibold text-gray-800 group-hover:text-blue-600">{c.subject_name}</p>
                <p className="text-xs text-gray-500 mt-1">{c.day_name} &middot; {c.start_time}-{c.end_time}</p>
                <p className="text-xs text-gray-500">Sem {c.semester} {c.section && `Sec ${c.section}`} &middot; Room: {c.room || 'TBA'}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{selectedClass.subject_name}</h2>
              <p className="text-sm text-gray-500">{selectedClass.day_name} {selectedClass.start_time}-{selectedClass.end_time}</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <button onClick={() => setSelectedClass(null)} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Back</button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="grid grid-cols-[1fr_auto] gap-0 divide-y">
              <div className="grid grid-cols-[1fr_auto] bg-gray-50 px-4 py-2 text-xs uppercase text-gray-600 font-medium">
                <span>Student</span>
                <span>Status</span>
              </div>
              <div />
              {students.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_auto] items-center px-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.full_name}</p>
                    <p className="text-xs text-gray-500">{s.roll_number}</p>
                  </div>
                  <div className="flex gap-1">
                    {['present', 'absent', 'late'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setAttendance({ ...attendance, [s.id]: status })}
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                          attendance[s.id] === status
                            ? status === 'present' ? 'bg-green-500 text-white shadow-md' :
                              status === 'absent' ? 'bg-red-500 text-white shadow-md' :
                              'bg-yellow-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={submitAttendance}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-all hover:shadow-lg"
            >
              Submit Attendance ({students.length} students)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentAttendance() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<{ total: number; present: number; absent: number; percentage: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.student_profile) {
      api.get(`/attendance/by-student/${user.student_profile.id}`).then((res) => setSummary(res.data.summary)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
      {summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className={`rounded-xl border p-5 ${summary.percentage >= 75 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-sm font-medium opacity-75">Overall</p>
            <p className="mt-2 text-3xl font-bold">{summary.percentage}%</p>
          </div>
          <div className="rounded-xl border bg-blue-50 border-blue-200 p-5">
            <p className="text-sm font-medium text-blue-700 opacity-75">Total Classes</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{summary.total}</p>
          </div>
          <div className="rounded-xl border bg-green-50 border-green-200 p-5">
            <p className="text-sm font-medium text-green-700 opacity-75">Present</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{summary.present}</p>
          </div>
          <div className="rounded-xl border bg-red-50 border-red-200 p-5">
            <p className="text-sm font-medium text-red-700 opacity-75">Absent</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{summary.absent}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No attendance records found.</p>
      )}
    </div>
  );
}

function AdminAttendance() {
  const [report, setReport] = useState<Array<{ student_id: number; student_name: string; roll_number: string; total: number; present: number; percentage: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/report').then((res) => setReport(res.data.report)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Roll No</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Present</th>
              <th className="px-4 py-3">%</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {report.map((r) => (
              <tr key={r.student_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{r.roll_number}</td>
                <td className="px-4 py-3 font-medium">{r.student_name}</td>
                <td className="px-4 py-3">{r.total}</td>
                <td className="px-4 py-3">{r.present}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.percentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.percentage}%
                  </span>
                </td>
              </tr>
            ))}
            {report.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No attendance data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
