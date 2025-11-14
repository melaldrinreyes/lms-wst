import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Edit, X, Eye, Loader, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function LectureContent({ courseId, isTeacher = false, onSave }) {
  const [lectures, setLectures] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [expandedLectures, setExpandedLectures] = useState({});
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchLectures();
  }, [courseId]);

  const fetchLectures = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/courses/${courseId}/lectures`);
      
      if (response.data.success) {
        setLectures(response.data.lectures || []);
        // Initialize expanded state
        const expanded = {};
        (response.data.lectures || []).forEach((_, index) => {
          expanded[index] = true;
        });
        setExpandedLectures(expanded);
      }
    } catch (error) {
      console.error('Error fetching lectures:', error);
      // Initialize with empty lectures
      setLectures([]);
      setToast({ message: 'No lectures found. Click "Add Lecture" to create one.', type: 'info' });
    } finally {
      setIsLoading(false);
    }
  };

  const addLecture = () => {
    if (!newLectureTitle.trim()) {
      setToast({ message: 'Please enter a lecture title', type: 'error' });
      return;
    }

    const newLecture = {
      id: Date.now(),
      title: newLectureTitle,
      content: '',
      order: lectures.length + 1,
      created_at: new Date().toISOString(),
    };

    const updatedLectures = [...lectures, newLecture];
    setLectures(updatedLectures);
    setExpandedLectures({ ...expandedLectures, [lectures.length]: true });
    setNewLectureTitle('');
    setToast({ message: 'Lecture added successfully!', type: 'success' });
  };

  const editLecture = (index) => {
    setEditingLectureId(index);
    setCurrentContent(lectures[index].content);
    setIsEditing(true);
  };

  const saveLecture = async () => {
    try {
      setIsSaving(true);
      const updatedLectures = [...lectures];
      updatedLectures[editingLectureId].content = currentContent;
      updatedLectures[editingLectureId].updated_at = new Date().toISOString();

      // Save to backend
      await api.post(`/courses/${courseId}/lectures`, {
        lectures: updatedLectures,
      });

      setLectures(updatedLectures);
      setIsEditing(false);
      setEditingLectureId(null);
      setCurrentContent('');
      setToast({ message: 'Lecture saved successfully!', type: 'success' });

      if (onSave) {
        onSave(updatedLectures);
      }
    } catch (error) {
      setToast({ message: error.message || 'Failed to save lecture', type: 'error' });
      console.error('Error saving lecture:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLecture = async (index) => {
    try {
      setIsSaving(true);
      const updatedLectures = lectures.filter((_, i) => i !== index);
      
      // Save to backend
      await api.post(`/courses/${courseId}/lectures`, {
        lectures: updatedLectures,
      });

      setLectures(updatedLectures);
      setShowDeleteConfirm(null);
      setToast({ message: 'Lecture deleted successfully!', type: 'success' });

      if (onSave) {
        onSave(updatedLectures);
      }
    } catch (error) {
      setToast({ message: error.message || 'Failed to delete lecture', type: 'error' });
      console.error('Error deleting lecture:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLecture = (index) => {
    setExpandedLectures({
      ...expandedLectures,
      [index]: !expandedLectures[index],
    });
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

  if (isEditing && editingLectureId !== null) {
    return (
      <div className="space-y-4">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

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
                  <h2 className="text-xl font-bold text-white mb-1">
                    Edit: {lectures[editingLectureId].title}
                  </h2>
                  <p className="text-sm text-gray-400">Lecture content editor</p>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-600/30 transition"
                >
                  <Eye size={18} />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
            </div>

            {/* Editor and Preview */}
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-700">
              {/* Editor */}
              <div className="flex-1 p-6">
                <div className="mb-3">
                  <label className="text-sm font-semibold text-gray-300 mb-2 block">
                    📝 Editor
                  </label>
                </div>
                <RichTextEditor value={currentContent} onChange={setCurrentContent} />
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="flex-1 p-6 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
                  <div className="mb-3">
                    <label className="text-sm font-semibold text-gray-300 mb-2 block">
                      👁️ Live Preview
                    </label>
                  </div>
                  <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 max-h-[600px] overflow-y-auto">
                    {currentContent ? (
                      <div 
                        className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-4"
                        style={{ fontSize: '0.95rem', lineHeight: '1.7' }}
                      >
                        <div 
                          dangerouslySetInnerHTML={{ __html: currentContent }}
                          className="space-y-3"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        Start editing to see preview
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-800/50 border-t border-gray-700 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingLectureId(null);
                  setCurrentContent('');
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-700 transition"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={saveLecture}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition disabled:opacity-50 font-medium shadow-lg shadow-orange-900/30"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Lecture'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {isTeacher && (
        <div className="bg-gradient-to-r from-blue-900/20 to-orange-900/20 border border-blue-700/50 rounded-xl p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-300 mb-2 block">
                Add New Lecture
              </label>
              <input
                type="text"
                value={newLectureTitle}
                onChange={(e) => setNewLectureTitle(e.target.value)}
                placeholder="e.g., Lecture 1: Introduction, Lecture 2: Security Devices"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyPress={(e) => e.key === 'Enter' && addLecture()}
              />
            </div>
            <button
              onClick={addLecture}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium shadow-lg shadow-orange-900/30"
            >
              <Plus size={18} />
              Add Lecture
            </button>
          </div>
        </div>
      )}

      {/* Lectures List */}
      <div className="space-y-3">
        {lectures.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400">
              {isTeacher
                ? 'No lectures yet. Click "Add Lecture" to create one.'
                : 'No lectures available for this course.'}
            </p>
          </div>
        ) : (
          lectures.map((lecture, index) => (
            <motion.div
              key={lecture.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-orange-500/50 transition"
            >
              {/* Lecture Header */}
              <div
                onClick={() => toggleLecture(index)}
                className="px-6 py-4 cursor-pointer flex items-center justify-between bg-gradient-to-r from-gray-900/50 to-gray-800/50 hover:from-gray-900 hover:to-gray-800 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {expandedLectures[index] ? (
                        <ChevronUp size={20} className="text-orange-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Lecture {index + 1}: {lecture.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {lecture.content ? '✓ Content ready' : 'No content yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lecture Content */}
              {expandedLectures[index] && (
                <div className="border-t border-gray-700">
                  {lecture.content ? (
                    <div className="p-6 space-y-4">
                      <style>{`
                        .lecture-content h1 { font-size: 2.25rem; font-weight: bold; margin: 1.5rem 0 0.75rem 0; color: #f97316; line-height: 1.2; }
                        .lecture-content h2 { font-size: 1.875rem; font-weight: bold; margin: 1.25rem 0 0.75rem 0; color: #fb923c; line-height: 1.3; }
                        .lecture-content h3 { font-size: 1.5rem; font-weight: bold; margin: 1rem 0 0.5rem 0; color: #fdba74; line-height: 1.4; }
                        .lecture-content p { margin: 0.75rem 0; line-height: 1.8; color: #e5e7eb; }
                        .lecture-content ul { list-style-type: disc; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                        .lecture-content ol { list-style-type: decimal; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                        .lecture-content li { margin: 0.5rem 0; color: #d1d5db; }
                        .lecture-content blockquote { border-left: 4px solid #f97316; padding-left: 1.5rem; margin: 1rem 0; color: #d1d5db; font-style: italic; background: linear-gradient(90deg, #f97316 0%, rgba(249, 115, 22, 0.1) 10%, transparent 20%); padding: 1rem; border-radius: 0.5rem; }
                        .lecture-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #4b5563; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
                        .lecture-content table { border-collapse: collapse; width: 100%; margin: 1rem 0; background: #111827; border: 2px solid #4b5563; border-radius: 0.75rem; }
                        .lecture-content table th { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); font-weight: bold; color: white; padding: 1rem; }
                        .lecture-content table td { border: 1px solid #4b5563; padding: 1rem; color: #d1d5db; background: #1f2937; }
                        .lecture-content iframe { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; aspect-ratio: 16 / 9; border: 2px solid #4b5563; }
                      `}</style>
                      <div 
                        className="lecture-content prose prose-invert max-w-none text-gray-300"
                        dangerouslySetInnerHTML={{ __html: lecture.content }}
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No content yet for this lecture
                    </div>
                  )}

                  {isTeacher && (
                    <div className="bg-gray-800/50 border-t border-gray-700 px-6 py-4 flex gap-2 justify-end">
                      <button
                        onClick={() => editLecture(index)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Edit size={18} />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(index)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        <Trash2 size={18} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              Delete "{lectures[showDeleteConfirm].title}"?
            </h3>
            <p className="text-gray-300 mb-6">
              This will permanently delete this lecture and all its content. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteLecture(showDeleteConfirm)}
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
