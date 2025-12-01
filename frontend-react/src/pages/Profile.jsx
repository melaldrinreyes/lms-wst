import { useState, useEffect } from 'react';
import { User, Lock, Save } from 'lucide-react';
import Toast from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import Skeleton from '../components/ui/Skeleton';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    address: '',
    dateOfBirth: '',
    gender: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Helper function to format date to yyyy-MM-dd
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle image file selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setToast({ message: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)', type: 'error' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Image size should be less than 5MB', type: 'error' });
        return;
      }

      // Validate file is not empty
      if (file.size === 0) {
        setToast({ message: 'Selected file is empty', type: 'error' });
        return;
      }

      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profile_image', selectedImage);

      // Debug: Log what we're sending
      console.log('Uploading file:', {
        name: selectedImage.name,
        size: selectedImage.size,
        type: selectedImage.type,
        lastModified: selectedImage.lastModified
      });

      // Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log('FormData entry:', key, value instanceof File ? `File: ${value.name} (${value.size} bytes, ${value.type})` : value);
      }

      const response = await authAPI.updateProfile(formData);
      if (response.success) {
        // Update user context with new image
        updateUser({ ...user, profile_image: response.user.profile_image });
        setSelectedImage(null);
        setImagePreview(null);
        // Clear the file input
        document.getElementById('profile-image-input').value = '';
        setToast({ message: 'Profile image updated successfully', type: 'success' });
      } else {
        setToast({ message: 'Failed to update profile image', type: 'error' });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      console.error('Profile image errors:', error.response?.data?.errors?.profile_image);
      setToast({ message: error.response?.data?.message || 'Failed to upload image', type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Fetch fresh user data from API on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getUser();
        if (response.success) {
          updateUser(response.user);
          setFormData({
            name: response.user.name || '',
            email: response.user.email || '',
            phone: response.user.phone || '',
            studentId: response.user.student_id || '',
            address: response.user.address || '',
            dateOfBirth: formatDate(response.user.date_of_birth),
            gender: response.user.gender || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [updateUser]);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        studentId: user.student_id || '',
        address: user.address || '',
        dateOfBirth: formatDate(user.date_of_birth),
        gender: user.gender || '',
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await authAPI.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        // allow updating student_id if present in the form data
        student_id: formData.studentId || undefined,
      });

      if (response.success) {
        // Update user in auth context
        updateUser(response.user);
        setToast({ message: 'Profile updated successfully!', type: 'success' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setToast({ message: error.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const response = await authAPI.updatePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation,
      });

      if (response.success) {
        setToast({ message: 'Password updated successfully!', type: 'success' });
        setPasswordData({
          current_password: '',
          new_password: '',
          new_password_confirmation: '',
        });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setToast({ message: error.response?.data?.message || 'Failed to update password', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-orange-500">
        <h1 className="text-2xl font-bold text-white">
          Profile Settings
        </h1>
      </div>

      {loading ? (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-12 border border-orange-500">
          <div className="space-y-4">
            <Skeleton variant="avatar" className="mx-auto" />
            <Skeleton variant="title" className="w-1/3 mx-auto" />
            <Skeleton className="w-1/2 mx-auto" />
          </div>
        </div>
      ) : (
        <>
      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="flex gap-4">
          {[
            { id: 'account', label: 'Account Info', icon: User },
            { id: 'security', label: 'Security', icon: Lock },
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
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl border border-orange-500 p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-orange-500">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-orange-500"
                />
              ) : user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <User className="text-orange-500" size={48} />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {formData.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {user?.student_id ? `Student ID: ${formData.studentId}` : user?.email}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('profile-image-input').click()}
                    className="text-sm text-orange-500 hover:text-orange-400"
                  >
                    Change Photo
                  </button>
                  {selectedImage && (
                    <>
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={uploadingImage}
                        className="text-sm text-green-500 hover:text-green-400 disabled:opacity-50"
                      >
                        {uploadingImage ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                          // Clear the file input
                          document.getElementById('profile-image-input').value = '';
                        }}
                        className="text-sm text-red-500 hover:text-red-400"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
                <input
                  id="profile-image-input"
                  type="file"
                  onChange={handleImageSelect}
                  className="hidden"
                />
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
                  className="w-full px-4 py-2 bg-gray-800 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
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
                  className="w-full px-4 py-2 bg-gray-800 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
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
                  className="w-full px-4 py-2 bg-gray-800 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                  placeholder="+63 XXX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                  placeholder="Enter your complete address"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl border border-orange-500 p-6">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-white/70"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-white/70"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.new_password_confirmation}
                onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-white/70"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock size={18} />
              {saving ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      
      </>
      )}
    </div>
  );
}
