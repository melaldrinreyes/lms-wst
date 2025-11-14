import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Edit, X, Eye, Loader, Trash2, Plus, ChevronDown, ChevronRight, Indent } from 'lucide-react';
import RichTextEditor from './Editor/RichTextEditor';
import Toast from './ui/Toast';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function HierarchicalLectureContent({ courseId, isTeacher = false, onSave }) {
  const [lectures, setLectures] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [expandedLectures, setExpandedLectures] = useState({});
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newParentId, setNewParentId] = useState(null);
  const [currentContent, setCurrentContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAddSubModal, setShowAddSubModal] = useState(null); // For adding sub-lectures
  const [subLectureTitle, setSubLectureTitle] = useState('');
  const [unsavedLectures, setUnsavedLectures] = useState([]); // Track newly created sub-lectures

  useEffect(() => {
    fetchLectures();
  }, [courseId]);

  const fetchLectures = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/courses/${courseId}/lectures`);
      
      if (response.data.success) {
        const allLectures = response.data.lectures || [];
        console.log('Fetched lectures:', allLectures);
        console.log('Root lectures:', allLectures.filter(l => !l.parent_lecture_id));
        console.log('Sub-lectures:', allLectures.filter(l => l.parent_lecture_id));
        
        setLectures(allLectures);
        
        // Expand root lectures by default
        const expanded = {};
        allLectures.forEach((lecture) => {
          if (!lecture.parent_lecture_id) {
            expanded[lecture.id] = true;
          }
        });
        setExpandedLectures(expanded);
      }
    } catch (error) {
      console.error('Error fetching lectures:', error);
      setLectures([]);
      setToast({ message: 'No lectures found. Click "Add Module" to create one.', type: 'info' });
    } finally {
      setIsLoading(false);
    }
  };

  // Get root lectures (modules)
  const getRootLectures = () => {
    return lectures.filter(l => !l.parent_lecture_id);
  };

  // Get children of a lecture
  const getChildren = (parentId) => {
    return lectures.filter(l => l.parent_lecture_id === parentId);
  };

  const addLecture = () => {
    if (!newLectureTitle.trim()) {
      setToast({ message: 'Please enter a title', type: 'error' });
      return;
    }

    const newLecture = {
      id: Date.now(),
      parent_lecture_id: newParentId,
      title: newLectureTitle,
      content: '',
      order: lectures.length + 1,
      level: newParentId ? 1 : 0,
      created_at: new Date().toISOString(),
    };

    const updatedLectures = [...lectures, newLecture];
    setLectures(updatedLectures);
    if (newParentId) {
      setExpandedLectures({ ...expandedLectures, [newParentId]: true });
    }
    setNewLectureTitle('');
    setNewParentId(null);
    setToast({ message: 'Lecture added! Click Edit to add content.', type: 'success' });
  };

  // Add a sub-lecture to a specific parent
  const addSubLecture = (parentId) => {
    if (!subLectureTitle.trim()) {
      setToast({ message: 'Please enter a sub-lecture title', type: 'error' });
      return;
    }

    // Find the parent lecture
    const parentLecture = lectures.find(l => l.id === parentId);
    if (!parentLecture) {
      setToast({ message: 'Parent lecture not found', type: 'error' });
      return;
    }

    // Check if parent has a temporary ID (not yet saved)
    const parentHasTemporaryId = !Number.isInteger(parentId) || parentId > 2147483647 || parentId < 1;
    
    if (parentHasTemporaryId) {
      // Parent hasn't been saved yet
      setToast({ message: 'Please save the parent module first by clicking "Save All"', type: 'warning' });
      return;
    }

    const newLecture = {
      id: Date.now(),
      parent_lecture_id: parentId,
      title: subLectureTitle,
      content: '',
      order: getChildren(parentId).length + 1,
      level: parentLecture.level + 1,
      created_at: new Date().toISOString(),
    };

    const updatedLectures = [...lectures, newLecture];
    setLectures(updatedLectures);
    setUnsavedLectures([...unsavedLectures, newLecture.id]); // Mark as unsaved
    setExpandedLectures({ ...expandedLectures, [parentId]: true });
    setSubLectureTitle('');
    setShowAddSubModal(null);
    setToast({ message: 'Sub-lecture created! Remember to save when done.', type: 'info' });
  };

  const editLecture = (lecture) => {
    setEditingLectureId(lecture.id);
    setCurrentContent(lecture.content || '');
    setIsEditing(true);
  };

  const saveLecture = async () => {
    try {
      setIsSaving(true);
      const updatedLectures = lectures.map(l =>
        l.id === editingLectureId
          ? { 
              ...l, 
              content: currentContent, 
              updated_at: new Date().toISOString(),
              parent_lecture_id: l.parent_lecture_id || null,
              level: typeof l.level !== 'undefined' ? l.level : 0,
            }
          : {
              ...l,
              parent_lecture_id: l.parent_lecture_id || null,
              level: typeof l.level !== 'undefined' ? l.level : 0,
            }
      );

      console.log('Sending lectures to backend:', updatedLectures);

      const response = await api.post(`/courses/${courseId}/lectures`, {
        lectures: updatedLectures,
      });

      if (response.data.success) {
        setLectures(response.data.lectures || updatedLectures);
        setUnsavedLectures([]); // Clear unsaved after successful save
        setIsEditing(false);
        setEditingLectureId(null);
        setCurrentContent('');
        setToast({ message: 'Lecture saved successfully!', type: 'success' });

        if (onSave) {
          onSave(response.data.lectures || updatedLectures);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save lecture';
      const errorDetails = error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
      setToast({ message: `Error: ${errorMsg} ${errorDetails}`, type: 'error' });
      console.error('Error saving lecture:', error);
      console.error('Response data:', error.response?.data);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllLectures = async () => {
    try {
      setIsSaving(true);
      
      // Sort lectures by level to ensure parents are saved before children
      // This prevents foreign key constraint violations
      const sortedLectures = [...lectures].sort((a, b) => {
        const levelA = typeof a.level !== 'undefined' ? a.level : 0;
        const levelB = typeof b.level !== 'undefined' ? b.level : 0;
        return levelA - levelB;
      });

      // Ensure all lectures have required fields
      const lecturesWithDefaults = sortedLectures.map(l => ({
        ...l,
        parent_lecture_id: l.parent_lecture_id || null,
        level: typeof l.level !== 'undefined' ? l.level : 0,
        content: l.content || '',
      }));

      console.log('Sending all lectures to backend (sorted by level):', lecturesWithDefaults);

      const response = await api.post(`/courses/${courseId}/lectures`, {
        lectures: lecturesWithDefaults,
      });

      if (response.data.success) {
        setLectures(response.data.lectures || lecturesWithDefaults);
        setUnsavedLectures([]); // Clear unsaved
        setToast({ message: 'All lectures saved successfully!', type: 'success' });

        if (onSave) {
          onSave(response.data.lectures || lecturesWithDefaults);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save lectures';
      const errorDetails = error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
      setToast({ message: `Error: ${errorMsg} ${errorDetails}`, type: 'error' });
      console.error('Error saving lectures:', error);
      console.error('Response data:', error.response?.data);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLecture = async (lectureId) => {
    try {
      setIsSaving(true);
      const updatedLectures = lectures.filter(l => l.id !== lectureId && l.parent_lecture_id !== lectureId);
      
      const response = await api.post(`/courses/${courseId}/lectures`, {
        lectures: updatedLectures,
      });

      if (response.data.success) {
        setLectures(response.data.lectures || updatedLectures);
        setShowDeleteConfirm(null);
        setToast({ message: 'Lecture deleted successfully!', type: 'success' });

        if (onSave) {
          onSave(response.data.lectures || updatedLectures);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete lecture';
      setToast({ message: `Error: ${errorMsg}`, type: 'error' });
      console.error('Error deleting lecture:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLecture = (lectureId) => {
    setExpandedLectures({
      ...expandedLectures,
      [lectureId]: !expandedLectures[lectureId],
    });
  };

  // Render hierarchical lecture item
  const LectureItem = ({ lecture, isChild = false }) => {
    const children = getChildren(lecture.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedLectures[lecture.id];

    return (
      <div key={lecture.id} className={isChild ? 'ml-6' : ''}>
        <div className="bg-gray-900 rounded-lg border border-gray-800 mb-2 overflow-hidden hover:border-orange-500/50 transition">
          <div
            onClick={() => toggleLecture(lecture.id)}
            className={`px-4 py-3 flex items-center gap-3 ${
              'cursor-pointer hover:bg-gray-800'
            } transition`}
          >
            {hasChildren ? (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown size={18} className="text-orange-500" />
                ) : (
                  <ChevronRight size={18} className="text-gray-500" />
                )}
              </div>
            ) : (
              <Indent size={18} className="text-gray-500" />
            )}

            <div className="flex-1">
              <h4 className={`font-semibold ${
                lecture.level === 0 ? 'text-lg text-white' : 'text-gray-300'
              }`}>
                {lecture.title}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {lecture.content ? '✓ Has content' : 'No content yet'}
              </p>
            </div>

            {isTeacher && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddSubModal(lecture.id);
                  }}
                  className="p-1.5 hover:bg-green-600/20 rounded text-green-400 transition"
                  title="Add Sub-Lecture"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editLecture(lecture);
                  }}
                  className="p-1.5 hover:bg-blue-600/20 rounded text-blue-400 transition"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(lecture.id);
                  }}
                  className="p-1.5 hover:bg-red-600/20 rounded text-red-400 transition"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Show content if expanded and this is a leaf node (no children) */}
          {isExpanded && !hasChildren && lecture.content && (
            <div className="border-t border-gray-700 p-4 bg-gray-800/30">
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
          )}

          {/* Render children if expanded */}
          {hasChildren && isExpanded && (
            <div className="border-t border-gray-700 p-3 bg-gray-900/50">
              {children.map(child => (
                <LectureItem key={child.id} lecture={child} isChild={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
    const editingLecture = lectures.find(l => l.id === editingLectureId);
    
    return (
      <div className="space-y-4">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Edit: {editingLecture?.title}
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

            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-700">
              <div className="flex-1 p-6">
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  📝 Editor
                </label>
                <RichTextEditor value={currentContent} onChange={setCurrentContent} />
              </div>

              {showPreview && (
                <div className="flex-1 p-6 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
                  <label className="text-sm font-semibold text-gray-300 mb-2 block">
                    👁️ Live Preview
                  </label>
                  <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 max-h-[600px] overflow-y-auto">
                    {currentContent ? (
                      <div 
                        className="prose prose-invert max-w-none text-gray-300"
                        dangerouslySetInnerHTML={{ __html: currentContent }}
                      />
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        Start editing to see preview
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition disabled:opacity-50 font-medium"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save'}
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
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-900/20 to-orange-900/20 border border-blue-700/50 rounded-xl p-4">
            <label className="text-sm font-semibold text-gray-300 mb-2 block">
              ➕ Add New Module/Lecture
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLectureTitle}
                onChange={(e) => setNewLectureTitle(e.target.value)}
                placeholder="e.g., Module 1: Introduction"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyPress={(e) => e.key === 'Enter' && addLecture()}
              />
              <button
                onClick={addLecture}
                className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium"
              >
                <Plus size={18} className="inline mr-1" />
                Add
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Tip: Add modules first, then expand to add sub-lectures
            </p>
          </div>

          {unsavedLectures.length > 0 && (
            <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-400">
                  ✓ {unsavedLectures.length} unsaved sub-lecture{unsavedLectures.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Click "Save All" to save to database
                </p>
              </div>
              <button
                onClick={saveAllLectures}
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save All'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Root lectures (modules) */}
      <div className="space-y-2">
        {getRootLectures().length === 0 ? (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400">
              {isTeacher
                ? 'No modules yet. Click "Add Module" to create one.'
                : 'No course materials available yet.'}
            </p>
          </div>
        ) : (
          getRootLectures().map(lecture => (
            <LectureItem key={lecture.id} lecture={lecture} />
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
              Delete this item?
            </h3>
            <p className="text-gray-300 mb-6">
              This will delete the item and all its sub-lectures. This action cannot be undone.
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

      {/* Add Sub-Lecture Modal */}
      {showAddSubModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              Create Sub-Lecture
            </h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">
                Sub-Lecture Title
              </label>
              <input
                type="text"
                value={subLectureTitle}
                onChange={(e) => setSubLectureTitle(e.target.value)}
                placeholder="e.g., Chapter 1: Getting Started"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => e.key === 'Enter' && addSubLecture(showAddSubModal)}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddSubModal(null);
                  setSubLectureTitle('');
                }}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => addSubLecture(showAddSubModal)}
                disabled={isSaving || !subLectureTitle.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
