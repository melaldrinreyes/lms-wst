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
          <Loader className="w-8 h-8 text-[#FF4C60]" />
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
          <div className="bg-white rounded-2xl border border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] border-b border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Create Course Content</h2>
                  <p className="text-sm text-[#718096]">Build engaging course materials with our WYSIWYG editor</p>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8B0000]/20 border border-[#FF4C60]/50 text-[#ff9f66] rounded-xl hover:bg-[#8B0000]/30 transition"
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
                  <label className="text-sm font-semibold text-[#4a5568] mb-2 block">
                    📝 Editor
                  </label>
                </div>
                <RichTextEditor value={content} onChange={setContent} />
              </div>

              {/* Preview Section */}
              {showPreview && (
                <div className="flex-1 p-6 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a]
                  <div className="mb-3">
                    <label className="text-sm font-semibold text-[#4a5568] mb-2 block">
                      👁️ Live Preview (Student View)
                    </label>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-700 p-4 max-h-[600px] overflow-y-auto">
                    {content ? (
                      <div 
                        className="prose prose-invert max-w-none text-[#4a5568] leading-relaxed space-y-4"
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
            <div className="bg-white/50 border-t border-gray-700 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-xl text-[#718096] hover:bg-white transition"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 rounded-xl hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 font-medium shadow-lg shadow-blue-900/30"
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
                className="flex items-center gap-2 px-4 py-2 bg-[#ff5252] text-gray-900 rounded-xl hover:bg-[#ff4444] transition"
              >
                <Edit size={18} />
                Edit Content
              </button>
              {content && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-gray-900 rounded-xl hover:bg-red-700 transition"
                >
                  <Trash2 size={18} />
                  Delete Content
                </button>
              )}
            </div>
          )}

          {content ? (
            <div className="bg-white rounded-2xl border border-gray-800 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] border-b border-gray-700 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Eye size={20} className="text-[#ff9f66]" />
                  Course Content
                </h2>
                <p className="text-sm text-[#718096]">Course materials and resources from your instructor</p>
              </div>
              
              {/* Content Area */}
              <div className="p-6 md:p-8">
                <div 
                  className="prose prose-invert max-w-none text-[#2c3e50] leading-relaxed"
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.8',
                  }}
                >
                  <style>{`
                    .student-content h1 { font-size: 2.25rem; font-weight: bold; margin: 1.5rem 0 0.75rem 0; color: #f97316; line-height: 1.2; }
                    .student-content h2 { font-size: 1.875rem; font-weight: bold; margin: 1.25rem 0 0.75rem 0; color: #fb923c; line-height: 1.3; }
                    .student-content h3 { font-size: 1.5rem; font-weight: bold; margin: 1rem 0 0.5rem 0; color: #fdba74; line-height: 1.4; }
                    .student-content p { margin: 0.75rem 0; line-height: 1.8; color: #e5e7eb; }
                    .student-content ul { list-style-type: disc; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                    .student-content ol { list-style-type: decimal; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                    .student-content li { margin: 0.5rem 0; color: #d1d5db; }
                    .student-content blockquote { border-left: 4px solid #f97316; padding-left: 1.5rem; margin: 1rem 0; color: #d1d5db; font-style: italic; background: linear-gradient(90deg, #f97316 0%, rgba(249, 115, 22, 0.1) 10%, transparent 20%); padding: 1rem; border-radius: 0.5rem; }
                    .student-content code { background: #111827; padding: 0.25rem 0.5rem; border-radius: 0.35rem; font-family: 'Courier New', monospace; font-size: 0.9em; color: #fca5a5; border: 1px solid #4b5563; }
                    .student-content pre { background: linear-gradient(135deg, #0f172a 0%, #111827 100%); padding: 1.5rem; border-radius: 0.75rem; overflow-x: auto; margin: 1rem 0; border: 1px solid #4b5563; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
                    .student-content pre code { background: none; padding: 0; color: #a1d8f7; border: none; }
                    .student-content a { color: #60a5fa; text-decoration: underline; cursor: pointer; font-weight: 500; transition: all 0.2s ease; }
                    .student-content a:hover { color: #93c5fd; text-decoration: underline wavy; text-decoration-color: #f97316; }
                    .student-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #4b5563; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); transition: all 0.3s ease; }
                    .student-content img:hover { border-color: #f97316; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.2); transform: scale(1.02); }
                    .student-content table { border-collapse: collapse; width: 100%; margin: 1rem 0; background: #111827; border: 2px solid #4b5563; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
                    .student-content table td, .student-content table th { border: 1px solid #4b5563; padding: 1rem; text-align: left; min-width: 120px; }
                    .student-content table th { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); font-weight: bold; color: white; font-size: 0.95rem; }
                    .student-content table td { color: #d1d5db; background: #1f2937; }
                    .student-content table tr:hover td { background: #374151; }
                    .student-content iframe { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; aspect-ratio: 16 / 9; border: 2px solid #4b5563; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); transition: all 0.3s ease; }
                    .student-content iframe:hover { border-color: #f97316; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.2); }
                  `}</style>
                  <div 
                    dangerouslySetInnerHTML={{ __html: content }}
                    className="student-content space-y-4"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-800 p-12 text-center">
              <p className="text-[#718096]">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-panel modal-panel--md bg-white rounded-xl p-6 w-full mx-4 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Course Content?</h3>
            <p className="text-[#4a5568] mb-6">
              Are you sure you want to delete all course content for this course? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-xl text-[#4a5568] hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-red-600 text-gray-900 rounded-xl hover:bg-red-700 transition disabled:opacity-50"
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
