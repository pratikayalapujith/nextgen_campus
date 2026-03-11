import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatsCard from './StatsCard';
import { DashboardStats, Notice } from '../../utils/types';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/recent-notices'),
    ]).then(([statsRes, noticesRes]) => {
      setStats(statsRes.data);
      setNotices(noticesRes.data.notices);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Students" value={stats?.total_students ?? 0} color="blue" />
        <StatsCard title="Total Faculty" value={stats?.total_faculty ?? 0} color="green" />
        <StatsCard title="Departments" value={stats?.total_departments ?? 0} color="purple" />
        <StatsCard title="Pending Bookings" value={stats?.pending_bookings ?? 0} color="orange" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Recent Notices</h2>
        {notices.length === 0 ? (
          <p className="text-sm text-gray-400">No notices yet</p>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="flex items-start justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    {n.is_pinned && <span className="text-xs text-orange-500 font-medium">PINNED</span>}
                    <h3 className="text-sm font-medium text-gray-800">{n.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    By {n.author_name} &middot; {n.category}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 capitalize">
                  {n.target_role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
