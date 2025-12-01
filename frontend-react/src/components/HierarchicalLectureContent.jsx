import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Edit, X, Eye, Loader, Trash2, Plus, ChevronDown, ChevronRight, Indent, ChevronUp } from 'lucide-react';
import RichTextEditor from './Editor/RichTextEditor';
import Toast from './ui/Toast';
import Skeleton from './ui/Skeleton';
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
  // Track pending files for each lecture: { [lectureId]: [fileObj, ...] }
  const [pendingFilesMap, setPendingFilesMap] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingTotal, setUploadingTotal] = useState(0);
  const [uploadingLoaded, setUploadingLoaded] = useState(0);
  const uploadAbortController = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [expandedLectures, setExpandedLectures] = useState({});
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newParentId, setNewParentId] = useState(null);
  const [currentContent, setCurrentContent] = useState('');
  const editorRef = useRef();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAddSubModal, setShowAddSubModal] = useState(null); // For adding sub-lectures
  const [subLectureTitle, setSubLectureTitle] = useState('');
  const [unsavedLectures, setUnsavedLectures] = useState([]); // Track newly created sub-lectures
  const [searchQuery, setSearchQuery] = useState(''); // For searching lectures
  const [filteredLectures, setFilteredLectures] = useState([]); // Filtered lectures based on search
  const [showScrollUp, setShowScrollUp] = useState(false); // For scroll up button

  useEffect(() => {
    fetchLectures();
  }, [courseId]);

  // Update filtered lectures when lectures or search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = lectures.filter(lecture =>
        lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lecture.content && lecture.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredLectures(filtered);
    } else {
      setFilteredLectures(lectures);
    }
  }, [lectures, searchQuery]);

  // Handle scroll for scroll up button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollUp(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Get root lectures (modules) - use filtered lectures when searching
  const getRootLectures = () => {
    const lecturesToUse = getLecturesToDisplay();
    return lecturesToUse.filter(l => !l.parent_lecture_id);
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
      // Block save if any blob: URLs are present
      if (/blob:[^"'\s]+/.test(currentContent)) {
        setToast({ message: 'Cannot save: May natitirang blob URL sa content. Hintayin matapos ang upload o alisin ang hindi pa uploaded na file.', type: 'error' });
        return;
      }
      setIsSaving(true);
      setIsUploading(true);
      let html = currentContent;
      // 1. Get pending files from editor
      const pendingFiles = editorRef.current?.getPendingFiles?.() || [];
      const urlMap = {};
      // --- Total progress tracking ---
      let totalSize = pendingFiles.reduce((sum, pf) => sum + (pf.file?.size || 0), 0);
      let loadedSoFar = 0;
      setUploadingTotal(totalSize);
      setUploadingLoaded(0);
      // Setup AbortController for this upload
      uploadAbortController.current = new AbortController();
      // 2. Upload each file and map objectUrl to real URL
      const uploadErrors = [];
      for (const pf of pendingFiles) {
        try {
          const formData = new FormData();
          formData.append('file', pf.file);
          const uploadRes = await api.post('/modules/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                // progressEvent.loaded is for this file only
                // Add loadedSoFar (bytes from previous files)
                const currentLoaded = loadedSoFar + progressEvent.loaded;
                setUploadingLoaded(currentLoaded);
                if (totalSize > 0) {
                  setUploadProgress(Math.round((currentLoaded * 100) / totalSize));
                }
              }
            },
            signal: uploadAbortController.current.signal,
          });
          
          loadedSoFar += pf.file?.size || 0;
          setUploadingLoaded(loadedSoFar);
          if (totalSize > 0) {
            setUploadProgress(Math.round((loadedSoFar * 100) / totalSize));
          }
          
          if (uploadRes.data?.url) {
            urlMap[pf.objectUrl] = uploadRes.data.url;
          } else {
            uploadErrors.push(`Failed to upload ${pf.file?.name || 'unknown file'}: No URL returned`);
          }
        } catch (uploadError) {
          loadedSoFar += pf.file?.size || 0; // Still count as loaded for progress
          setUploadingLoaded(loadedSoFar);
          if (totalSize > 0) {
            setUploadProgress(Math.round((loadedSoFar * 100) / totalSize));
          }
          
          const errorMsg = uploadError.response?.data?.message || uploadError.message || 'Upload failed';
          uploadErrors.push(`Failed to upload ${pf.file?.name || 'unknown file'}: ${errorMsg}`);
        }
      }
      
      // If some uploads failed, show warning but continue with successful ones
      if (uploadErrors.length > 0) {
        setToast({ 
          message: `Some files failed to upload: ${uploadErrors.join('; ')}. Content saved with available files.`, 
          type: 'warning' 
        });
      }
      // 3. Replace all object URLs in HTML with real URLs
      Object.entries(urlMap).forEach(([objectUrl, realUrl]) => {
        // Escape special regex characters and replace all occurrences
        const escapedObjectUrl = objectUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedObjectUrl, 'g');
        html = html.replace(regex, realUrl);
      });
      // 4. Clear pending files
      editorRef.current?.clearPendingFiles?.();
      // 5. Save lecture with updated HTML
      const updatedLectures = lectures.map(l =>
        l.id === editingLectureId
          ? { 
              ...l, 
              content: html, // html is already real HTML, do not escape
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
      const response = await api.post(`/courses/${courseId}/lectures`, {
        lectures: updatedLectures,
      });
      if (response.data.success) {
        const newLectures = response.data.lectures || updatedLectures;
        setLectures(newLectures);
        setUnsavedLectures([]);
        // Update currentContent with the saved HTML (with real URLs)
        const updated = newLectures.find(l => l.id === editingLectureId);
        setCurrentContent(updated ? updated.content : '');
        // Force the editor to reload the updated HTML so blob URLs are replaced with backend URLs
        if (editorRef.current && editorRef.current.setContent) {
          editorRef.current.setContent(updated ? updated.content : '');
        }
        setIsEditing(false);
        setEditingLectureId(null);
        if (onSave) {
          onSave(newLectures);
        }
      }
    } catch (error) {
      if (axios.isCancel?.(error) || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED' || error?.message === 'canceled') {
        setToast({ message: 'Upload canceled.', type: 'warning' });
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to save lecture';
        const errorDetails = error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
        setToast({ message: `Error: ${errorMsg} ${errorDetails}`, type: 'error' });
        console.error('Error saving lecture:', error);
        console.error('Response data:', error.response?.data);
      }
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingTotal(0);
      setUploadingLoaded(0);
      uploadAbortController.current = null;
    }
  };

  const saveAllLectures = async () => {
    try {
      setIsSaving(true);
      setIsUploading(true);
      // Sort lectures by level to ensure parents are saved before children
      const sortedLectures = [...lectures].sort((a, b) => {
        const levelA = typeof a.level !== 'undefined' ? a.level : 0;
        const levelB = typeof b.level !== 'undefined' ? b.level : 0;
        return levelA - levelB;
      });
      // --- Total progress tracking for all files in all lectures ---
      let allPendingFiles = [];
      Object.values(pendingFilesMap).forEach(arr => { if (Array.isArray(arr)) allPendingFiles.push(...arr); });
      let totalSize = allPendingFiles.reduce((sum, pf) => sum + (pf.file?.size || 0), 0);
      let loadedSoFar = 0;
      setUploadingTotal(totalSize);
      setUploadingLoaded(0);
      // For each lecture, upload pending files and replace blob URLs
      const updatedLectures = await Promise.all(sortedLectures.map(async (l) => {
        let html = l.content || '';
        const pendingFiles = pendingFilesMap[l.id] || [];
        const urlMap = {};
        for (const pf of pendingFiles) {
          const formData = new FormData();
          formData.append('file', pf.file);
          await api.post('/modules/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const currentLoaded = loadedSoFar + progressEvent.loaded;
                setUploadingLoaded(currentLoaded);
                if (totalSize > 0) {
                  setUploadProgress(Math.round((currentLoaded * 100) / totalSize));
                }
              }
            },
          }).then(uploadRes => {
            loadedSoFar += pf.file?.size || 0;
            setUploadingLoaded(loadedSoFar);
            if (totalSize > 0) {
              setUploadProgress(Math.round((loadedSoFar * 100) / totalSize));
            }
            if (uploadRes.data?.url) {
              urlMap[pf.objectUrl] = uploadRes.data.url;
            }
          });
        }
        // Replace all object/blob URLs in HTML with real URLs (robust, logs for debug)
        console.log('Blob URL map:', urlMap);
        Object.entries(urlMap).forEach(([objectUrl, realUrl]) => {
          const regex = new RegExp(objectUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          html = html.replace(regex, realUrl);
        });
        // Log the final HTML for verification
        console.log('Final HTML after replacement:', html);
        return {
          ...l,
          content: html,
          parent_lecture_id: l.parent_lecture_id || null,
          level: typeof l.level !== 'undefined' ? l.level : 0,
        };
      }));
      // After save, clear all pending files
      setPendingFilesMap({});
      const response = await api.post(`/courses/${courseId}/lectures`, {
        lectures: updatedLectures,
      });
      if (response.data.success) {
        setLectures(response.data.lectures || updatedLectures);
        setUnsavedLectures([]);
        if (onSave) {
          onSave(response.data.lectures || updatedLectures);
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
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingTotal(0);
      setUploadingLoaded(0);
    }
  };

  const deleteLecture = async (lectureId) => {
    try {
      setIsSaving(true);
      
      // Check if this is a frontend-only lecture (unsaved)
      const isFrontendOnly = !Number.isInteger(lectureId) || lectureId > 2147483647 || lectureId < 1;
      
      if (isFrontendOnly) {
        // Just remove from local state for frontend-only lectures
        const updatedLectures = lectures.filter(l => l.id !== lectureId && l.parent_lecture_id !== lectureId);
        setLectures(updatedLectures);
        setShowDeleteConfirm(null);
        setToast({ message: 'Lecture deleted successfully!', type: 'success' });

        if (onSave) {
          onSave(updatedLectures);
        }
        return;
      }
      
      // Find all child lectures that need to be deleted
      const childrenToDelete = lectures.filter(l => l.parent_lecture_id === lectureId);
      
      // Delete children first (only database-saved ones)
      for (const child of childrenToDelete) {
        const isChildFrontendOnly = !Number.isInteger(child.id) || child.id > 2147483647 || child.id < 1;
        if (!isChildFrontendOnly) {
          await api.delete(`/courses/${courseId}/lectures/${child.id}`);
        }
      }
      
      // Delete the parent lecture from database
      const response = await api.delete(`/courses/${courseId}/lectures/${lectureId}`);

      if (response.data.success) {
        // Remove the deleted lecture and all its children from local state
        const updatedLectures = lectures.filter(l => l.id !== lectureId && l.parent_lecture_id !== lectureId);
        setLectures(updatedLectures);
        setShowDeleteConfirm(null);
        setToast({ message: 'Lecture deleted successfully!', type: 'success' });

        if (onSave) {
          onSave(updatedLectures);
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

  // Expand all lectures
  const expandAllLectures = () => {
    const allExpanded = {};
    const expandRecursively = (lectureList) => {
      lectureList.forEach(lecture => {
        allExpanded[lecture.id] = true;
        const children = getChildren(lecture.id);
        if (children.length > 0) {
          expandRecursively(children);
        }
      });
    };
    expandRecursively(filteredLectures);
    setExpandedLectures(allExpanded);
  };

  // Collapse all lectures
  const collapseAllLectures = () => {
    setExpandedLectures({});
  };

  // Get all lectures to display (filtered or all)
  const getLecturesToDisplay = () => {
    if (searchQuery.trim()) {
      // When searching, show all matching lectures and their parents for context
      const matchingIds = new Set(filteredLectures.map(l => l.id));
      const result = [];
      
      const addWithParents = (lecture) => {
        // Add parents first
        if (lecture.parent_lecture_id) {
          const parent = lectures.find(l => l.id === lecture.parent_lecture_id);
          if (parent && !result.find(l => l.id === parent.id)) {
            addWithParents(parent);
          }
        }
        // Add the lecture itself
        if (!result.find(l => l.id === lecture.id)) {
          result.push(lecture);
        }
      };
      
      filteredLectures.forEach(lecture => addWithParents(lecture));
      return result;
    }
    return lectures;
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Render hierarchical lecture item
  const LectureItem = ({ lecture }) => {
    const children = getChildren(lecture.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedLectures[lecture.id];
    const isSearchMatch = searchQuery.trim() && filteredLectures.some(l => l.id === lecture.id);

    // Function to highlight search terms
    const highlightText = (text, query) => {
      if (!query.trim()) return text;
      
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, index) => 
        regex.test(part) ? 
          <mark key={index} className="bg-yellow-200 text-gray-900 px-1 rounded">{part}</mark> : 
          part
      );
    };

    return (
      <div key={lecture.id} className={`${
        lecture.level === 1 ? 'ml-8' :
        lecture.level === 2 ? 'ml-16' :
        lecture.level > 2 ? 'ml-24' : ''
      } ${isSearchMatch ? 'ring-2 ring-orange-300 rounded-lg' : ''}`}>
        <div className={`rounded-lg border mb-2 overflow-hidden hover:border-orange-500/50 transition ${
          lecture.level === 0
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm'
            : lecture.level === 1
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200'
        } ${isSearchMatch ? 'border-orange-400 shadow-md' : ''}`}>
          <div
            onClick={() => toggleLecture(lecture.id)}
            className={`flex items-center gap-3 transition ${
              lecture.level === 0
                ? 'px-6 py-4 cursor-pointer hover:bg-blue-100/50'
                : lecture.level === 1
                ? 'px-5 py-3 cursor-pointer hover:bg-green-100/50'
                : 'px-4 py-3 cursor-pointer hover:bg-purple-100/50'
            }`}
          >
            {hasChildren ? (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown size={18} className={`${
                    lecture.level === 0 ? 'text-blue-600' :
                    lecture.level === 1 ? 'text-green-600' : 'text-purple-600'
                  }`} />
                ) : (
                  <ChevronRight size={18} className={`${
                    lecture.level === 0 ? 'text-blue-500' :
                    lecture.level === 1 ? 'text-green-500' : 'text-purple-500'
                  }`} />
                )}
              </div>
            ) : (
              <div className={`flex-shrink-0 w-4 h-4 rounded-full ${
                lecture.level === 0 ? 'bg-blue-500' :
                lecture.level === 1 ? 'bg-green-500' : 'bg-purple-500'
              } flex items-center justify-center`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  lecture.level === 0
                    ? 'bg-blue-100 text-blue-700'
                    : lecture.level === 1
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {lecture.level === 0 ? 'Module' : lecture.level === 1 ? 'Chapter' : 'Topic'}
                </span>
                <h4 className={`font-semibold ${
                  lecture.level === 0 ? 'text-xl text-gray-900' :
                  lecture.level === 1 ? 'text-lg text-gray-800' : 'text-base text-gray-700'
                }`}>
                  {highlightText(lecture.title, searchQuery)}
                </h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {lecture.content ? '✓ Has content' : 'No content yet'}
                {hasChildren && ` • ${children.length} ${children.length === 1 ? 'item' : 'items'}`}
              </p>
            </div>

            {isTeacher && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddSubModal(lecture.id);
                  }}
                  className={`p-1.5 rounded transition ${
                    lecture.level === 0
                      ? 'hover:bg-blue-100 text-blue-600'
                      : lecture.level === 1
                      ? 'hover:bg-green-100 text-green-600'
                      : 'hover:bg-purple-100 text-purple-600'
                  }`}
                  title="Add Sub-Lecture"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editLecture(lecture);
                  }}
                  className={`p-1.5 rounded transition ${
                    lecture.level === 0
                      ? 'hover:bg-blue-100 text-blue-500'
                      : lecture.level === 1
                      ? 'hover:bg-green-100 text-green-500'
                      : 'hover:bg-purple-100 text-purple-500'
                  }`}
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(lecture.id);
                  }}
                  className="p-1.5 hover:bg-red-100 rounded text-red-500 transition"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Show content if expanded and this is a leaf node (no children) */}
          {isExpanded && !hasChildren && lecture.content && (
            <div className={`border-t p-4 ${
              lecture.level === 0
                ? 'border-blue-200 bg-blue-50/30'
                : lecture.level === 1
                ? 'border-green-200 bg-green-50/30'
                : 'border-purple-200 bg-purple-50/30'
            }`}>
              <style>{`
                .lecture-content h1 { font-size: 2.25rem; font-weight: bold; margin: 1.5rem 0 0.75rem 0; color: #ea580c; line-height: 1.2; }
                .lecture-content h2 { font-size: 1.875rem; font-weight: bold; margin: 1.25rem 0 0.75rem 0; color: #c2410c; line-height: 1.3; }
                .lecture-content h3 { font-size: 1.5rem; font-weight: bold; margin: 1rem 0 0.5rem 0; color: #9a3412; line-height: 1.4; }
                .lecture-content p { margin: 0.75rem 0; line-height: 1.8; color: #374151; }
                .lecture-content ul { list-style-type: disc; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                .lecture-content ol { list-style-type: decimal; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                .lecture-content li { margin: 0.5rem 0; color: #4b5563; }
                .lecture-content blockquote { border-left: 4px solid #f97316; padding-left: 1.5rem; margin: 1rem 0; color: #4b5563; font-style: italic; background: linear-gradient(90deg, #fef3c7 0%, rgba(249, 115, 22, 0.1) 10%, transparent 20%); padding: 1rem; border-radius: 0.5rem; }
                .lecture-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                .lecture-content video { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                .lecture-content table { border-collapse: collapse; width: 100%; margin: 1rem 0; background: #ffffff; border: 2px solid #e5e7eb; border-radius: 0.75rem; }
                .lecture-content table th { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); font-weight: bold; color: white; padding: 1rem; }
                .lecture-content table td { border: 1px solid #e5e7eb; padding: 1rem; color: #374151; background: #f9fafb; }
                .lecture-content iframe { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; aspect-ratio: 16 / 9; border: 2px solid #e5e7eb; }
              `}</style>
              <div 
                className="lecture-content prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: lecture.content }}
              />
            </div>
          )}

          {/* Render children if expanded */}
          {hasChildren && isExpanded && (
            <div className={`border-t p-3 ${
              lecture.level === 0
                ? 'border-blue-200 bg-blue-50/20'
                : lecture.level === 1
                ? 'border-green-200 bg-green-50/20'
                : 'border-purple-200 bg-purple-50/20'
            }`}>
              {children.map(child => (
                <LectureItem key={child.id} lecture={child} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {isTeacher && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <Skeleton className="h-4 w-48 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-10 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-64" />
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isEditing && editingLectureId !== null) {
    const editingLecture = lectures.find(l => l.id === editingLectureId);

    // --- BlobUrlHighlighter component ---
    function BlobUrlHighlighter({ html, pendingFiles = [] }) {
      // Find all <img> and <video>/<source> tags with blob: URLs
      const blobMatches = [];
      // Regex for <img src="blob:...">
      const imgRegex = /<img[^>]*src=["'](blob:[^"'>]+)["'][^>]*>/gi;
      let match;
      while ((match = imgRegex.exec(html))) {
        blobMatches.push({ tag: 'img', url: match[1], snippet: match[0] });
      }
      // Regex for <video src="blob:..."> or <source src="blob:...">
      const videoRegex = /<(video|source)[^>]*src=["'](blob:[^"'>]+)["'][^>]*>/gi;
      while ((match = videoRegex.exec(html))) {
        blobMatches.push({ tag: match[1], url: match[2], snippet: match[0] });
      }
      if (blobMatches.length === 0) return null;

      // Create a map of objectUrl to file info for better display
      const fileInfoMap = {};
      pendingFiles.forEach(pf => {
        fileInfoMap[pf.objectUrl] = {
          name: pf.file?.name || 'Unknown file',
          size: pf.file?.size || 0,
          type: pf.file?.type || 'unknown',
        };
      });

      return (
        <div style={{ background: '#fff3cd', color: '#b45309', padding: '10px', borderRadius: '6px', marginTop: '10px', fontWeight: 'normal', textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Found {blobMatches.length} file(s) that need to be uploaded:</div>
          <ul style={{ fontSize: '0.9em', paddingLeft: '18px' }}>
            {blobMatches.map((m, i) => {
              const fileInfo = fileInfoMap[m.url];
              const fileName = fileInfo?.name || 'Unknown file';
              const fileSize = fileInfo?.size ? `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size';
              const fileType = fileInfo?.type?.split('/')[0] || 'file';
              
              return (
                <li key={i} style={{ marginBottom: '8px', padding: '6px', background: '#fef3c7', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2em' }}>
                      {fileType === 'image' ? '🖼️' : fileType === 'video' ? '🎥' : '📄'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#92400e' }}>{fileName}</div>
                      <div style={{ fontSize: '0.85em', color: '#a16207' }}>
                        {fileSize} • {fileType}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '0.8em', color: '#dc2626' }}>
                    This file will be uploaded when you click "Save"
                  </div>
                </li>
              );
            })}
          </ul>
          <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#92400e', fontStyle: 'italic' }}>
            💡 Tip: Click "Save" to upload these files and make them permanently available.
            <button
              onClick={() => {
                // Remove all blob URLs from content
                let cleanedHtml = html;
                blobMatches.forEach(match => {
                  // Remove the entire element containing blob URL
                  const elementRegex = new RegExp(`<${match.tag}[^>]*src=["']${match.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>[^<]*<\/${match.tag}>`, 'gi');
                  cleanedHtml = cleanedHtml.replace(elementRegex, '');
                  // Also remove self-closing tags
                  const selfClosingRegex = new RegExp(`<${match.tag}[^>]*src=["']${match.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*/>`, 'gi');
                  cleanedHtml = cleanedHtml.replace(selfClosingRegex, '');
                });
                setCurrentContent(cleanedHtml);
                // Clear pending files
                setPendingFilesMap(prev => ({ ...prev, [editingLectureId]: [] }));
                editorRef.current?.clearPendingFiles?.();
              }}
              style={{
                marginLeft: '10px',
                padding: '4px 8px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.8em',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.target.style.background = '#b91c1c'}
              onMouseOut={(e) => e.target.style.background = '#dc2626'}
            >
              Remove All
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {isUploading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="modal-panel modal-panel--sm bg-gray-900 border border-orange-500 rounded-xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl min-w-[300px]">
              <svg className="animate-spin h-8 w-8 text-orange-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span className="text-orange-200 font-semibold mb-1">Uploading file... Please wait</span>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div className="bg-orange-500 h-3 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="text-orange-300 text-sm mt-1">{uploadProgress}%</span>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {toast && <Toast {...toast} onClose={() => setToast(null)} />}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    {/* Warning for blob URLs in content */}
                    {(() => {
                      const pendingFiles = pendingFilesMap[editingLectureId] || [];
                      const hasBlobUrls = currentContent.includes('blob:');
                      const totalSize = pendingFiles.reduce((sum, pf) => sum + (pf.file?.size || 0), 0);
                      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
                      
                      return hasBlobUrls && (
                        <div style={{ background: '#fef3c7', color: '#92400e', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #f59e0b' }}>
                          📁 Files Ready for Upload: {pendingFiles.length} file(s) ({totalSizeMB} MB total). Click "Save" to upload them permanently, or "Remove All" to clear them.
                          <br /><br />
                          <BlobUrlHighlighter html={currentContent} pendingFiles={pendingFiles} />
                        </div>
                      );
                    })()}

                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      Edit: {editingLecture?.title}
                    </h2>
                    <p className="text-sm text-gray-600">Lecture content editor</p>
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
              <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                <div className="flex-1 p-6">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    📝 Editor
                  </label>
                  <RichTextEditor
                    ref={editorRef}
                    value={currentContent}
                    onChange={setCurrentContent}
                    pendingFiles={pendingFilesMap[editingLectureId] || []}
                    onPendingFilesChange={files => setPendingFilesMap(prev => ({ ...prev, [editingLectureId]: files }))}
                  />
                </div>
                {showPreview && (
                  <div className="flex-1 p-6 bg-gray-50">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      👁️ Live Preview
                    </label>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
                      {currentContent ? (
                        <div 
                          className="prose max-w-none text-gray-700"
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
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingLectureId(null);
                    setCurrentContent('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
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
      </>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-gray-900 border border-orange-500 rounded-xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl min-w-[300px]">
            <svg className="animate-spin h-8 w-8 text-orange-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-orange-200 font-semibold mb-1">Uploading file... Please wait</span>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div className="bg-orange-500 h-3 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span className="text-orange-300 text-sm mt-1">{uploadProgress}%</span>
            <button
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-semibold"
              onClick={() => {
                if (uploadAbortController.current) {
                  uploadAbortController.current.abort();
                }
                setIsUploading(false);
                setIsSaving(false);
                setUploadProgress(0);
                setUploadingTotal(0);
                setUploadingLoaded(0);
              }}
            >
              Cancel Upload
            </button>
          </div>
        </div>
      )}

      {isTeacher && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              ➕ Add New Module/Lecture
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLectureTitle}
                onChange={(e) => setNewLectureTitle(e.target.value)}
                placeholder="e.g., Module 1: Introduction"
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
            <p className="text-xs text-gray-500 mt-2">
              Tip: Add modules first, then expand to add sub-lectures
            </p>
          </div>

          {/* Show Save All if any unsaved lectures (modules or sub-lectures) exist */}
          {lectures.some(l => !Number.isInteger(l.id) || l.id > 2147483647 || l.id < 1) && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700">
                  ✓ Unsaved changes detected
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click "Save All" to save all new modules and topics to the database
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

      {/* Navigation and Search Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              🔍 Search Lectures
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or content..."
                className="w-full px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAllLectures}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
            >
              <ChevronDown size={16} />
              Expand All
            </button>
            <button
              onClick={collapseAllLectures}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium flex items-center gap-2"
            >
              <ChevronRight size={16} />
              Collapse All
            </button>
          </div>
        </div>
        {searchQuery.trim() && (
          <div className="mt-3 text-sm text-gray-600">
            Found {filteredLectures.length} matching lecture{filteredLectures.length !== 1 ? 's' : ''}
            {filteredLectures.length === 0 && ' - try a different search term'}
          </div>
        )}
      </div>

      {/* Quick Overview when collapsed */}
      {Object.keys(expandedLectures).length === 0 && !searchQuery.trim() && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            📋 Course Overview
            <span className="text-sm font-normal text-gray-500">
              ({lectures.length} total items)
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lectures.map(lecture => (
              <div
                key={lecture.id}
                onClick={() => toggleLecture(lecture.id)}
                className={`p-3 rounded-lg border cursor-pointer transition hover:shadow-md ${
                  lecture.level === 0
                    ? 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    : lecture.level === 1
                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                    : 'bg-purple-50 border-purple-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    lecture.level === 0
                      ? 'bg-blue-100 text-blue-700'
                      : lecture.level === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {lecture.level === 0 ? 'M' : lecture.level === 1 ? 'C' : 'T'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${
                      lecture.level === 0 ? 'text-gray-900' :
                      lecture.level === 1 ? 'text-gray-800' : 'text-gray-700'
                    }`}>
                      {lecture.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {lecture.content ? '✓ Has content' : 'No content'}
                      {getChildren(lecture.id).length > 0 && ` • ${getChildren(lecture.id).length} sub-items`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={expandAllLectures}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
            >
              Expand All to Browse Content
            </button>
          </div>
        </div>
      )}

      {/* Root lectures (modules) */}
      <div className="space-y-2">
        {getRootLectures().length === 0 ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-12 text-center">
            <p className="text-gray-600">
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
            className="modal-panel modal-panel--md bg-gray-900 rounded-lg p-6 w-full mx-4 border border-gray-700"
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
            className="modal-panel modal-panel--md bg-gray-900 rounded-lg p-6 w-full mx-4 border border-gray-700"
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

      {/* Scroll Up Button */}
      <AnimatePresence>
        {showScrollUp && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
            title="Scroll to top"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
