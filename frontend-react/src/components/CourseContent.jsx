import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Edit, X, Eye, Loader, Trash2, Eye as EyeOff } from 'lucide-react';
import RichTextEditor from './Editor/RichTextEditor';
import Toast from './ui/Toast';
import axios from 'axios';

// Get axios instance with auth interceptors
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function CourseContent({ courseId, isTeacher = false, onSave }) {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [originalContent, setOriginalContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [courseId]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const endpoint = isTeacher ? '' : '/view';
      const url = `/courses/${courseId}/content${endpoint}`;
      
      const response = await api.get(url);
      
      if (response.data.success && response.data.content) {
        setContent(response.data.content.content || '');
        setOriginalContent(response.data.content.content || '');
      }
    } catch (error) {
      console.error('Error fetching course content:', error);
      setToast({ message: 'Failed to load course content', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await api.post(`/courses/${courseId}/content`, 
        { content }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save content');
      }

      setOriginalContent(content);
      setToast({ message: 'Course content saved successfully!', type: 'success' });
      setIsEditing(false);
      
      if (onSave) {
        onSave(content);
      }
    } catch (error) {
      setToast({ message: error.message || 'Failed to save course content', type: 'error' });
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      setIsSaving(true);
      
      const response = await api.delete(`/courses/${courseId}/content`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete content');
      }

      setContent('');
      setOriginalContent('');
      setShowDeleteConfirm(false);
      setToast({ message: 'Course content deleted successfully!', type: 'success' });
      
      if (onSave) {
        onSave('');
      }
    } catch (error) {
      setToast({ message: error.message || 'Failed to delete course content', type: 'error' });
      console.error('Error deleting content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader className="w-8 h-8 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {isEditing && isTeacher ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Create Course Content</h2>
                  <p className="text-sm text-gray-400">Build engaging course materials with our WYSIWYG editor</p>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-600/30 transition"
                  title={showPreview ? "Hide preview" : "Show preview"}
                >
                  <Eye size={18} />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
            </div>

            {/* Editor and Preview Layout */}
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-700">
              {/* Editor Section */}
              <div className="flex-1 p-6">
                <div className="mb-3">
                  <label className="text-sm font-semibold text-gray-300 mb-2 block">
                    📝 Editor
                  </label>
                </div>
                <RichTextEditor value={content} onChange={setContent} />
              </div>

              {/* Preview Section */}
              {showPreview && (
                <div className="flex-1 p-6 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
                  <div className="mb-3">
                    <label className="text-sm font-semibold text-gray-300 mb-2 block">
                      👁️ Live Preview (Student View)
                    </label>
                  </div>
                  <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 max-h-[600px] overflow-y-auto">
                    {content ? (
                      <div 
                        className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-4"
                        style={{ fontSize: '0.95rem', lineHeight: '1.7' }}
                      >
                        <div 
                          dangerouslySetInnerHTML={{ __html: content }}
                          className="space-y-3"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>Start editing to see a live preview of how students will see your content</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-800/50 border-t border-gray-700 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-700 transition"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition disabled:opacity-50 font-medium shadow-lg shadow-orange-900/30"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {isTeacher && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                <Edit size={18} />
                Edit Content
              </button>
              {content && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 size={18} />
                  Delete Content
                </button>
              )}
            </div>
          )}

          {content ? (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye size={20} />
                Course Content
              </h2>
              <div 
                className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-4"
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: content }}
                  className="space-y-4"
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
              <p className="text-gray-400">
                {isTeacher
                  ? 'No course content yet. Click "Edit Content" to add information about this course.'
                  : 'No course content available'}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4">Delete Course Content?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete all course content for this course? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
