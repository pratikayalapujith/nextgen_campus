import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import FacultyDashboard from '../components/dashboard/FacultyDashboard';
import StudentDashboard from '../components/dashboard/StudentDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'faculty') return <FacultyDashboard />;
  if (user?.role === 'student') return <StudentDashboard />;

  return <div>Unknown role</div>;
}
