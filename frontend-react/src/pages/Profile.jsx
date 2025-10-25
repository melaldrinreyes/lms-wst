import { useState } from 'react';
import { User, Lock, Activity, Save } from 'lucide-react';
import Toast from '../components/ui/Toast';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('account');
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@minsu.edu.ph',
    phone: '+63 XXX XXX XXXX',
    studentId: '2021-12345',
    department: 'Computer Science',
  });

  const handleSave = (e) => {
    e.preventDefault();
    setToast({ message: 'Profile updated successfully!', type: 'success' });
  };

  const activityLog = [
    { id: 1, action: 'Submitted assignment: React Project', time: '2 hours ago' },
    { id: 2, action: 'Logged in to the system', time: '5 hours ago' },
    { id: 3, action: 'Posted in Web Development forum', time: '1 day ago' },
    { id: 4, action: 'Viewed course: Database Systems', time: '2 days ago' },
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <h1 className="text-2xl font-bold text-white">
          Profile Settings
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="flex gap-4">
          {[
            { id: 'account', label: 'Account Info', icon: User },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'activity', label: 'Activity Log', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Account Info Tab */}
      {activeTab === 'account' && (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl border border-gray-800 p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-gray-800">
              <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center">
                <User className="text-orange-500" size={48} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {formData.name}
                </h3>
                <p className="text-sm text-gray-400">
                  Student ID: {formData.studentId}
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm text-orange-500 hover:text-orange-400"
                >
                  Change Photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
            >
              <Save size={18} />
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl border border-gray-800 p-6">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
            >
              <Lock size={18} />
              Change Password
            </button>
          </form>
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {activityLog.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-gray-800 last:border-0 last:pb-0"
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
