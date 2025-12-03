import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Edit, X, Eye, Loader, Trash2, Plus, ChevronDown, ChevronRight, 
  Indent, ChevronUp, Menu, Settings, FileText, Video, Image, Link2,
  GripVertical, BookOpen, Layers, FolderOpen, File, Check
} from 'lucide-react';
import RichTextEditor from './Editor/RichTextEditor';
import Toast from './ui/Toast';
import Skeleton from './ui/Skeleton';
import axios from 'axios';
import { useSave } from '../hooks/useSave';

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
  // Use centralized save context
  const saveContext = useSave();
  
  const [lectures, setLectures] = useState([]);
  const [originalLectures, setOriginalLectures] = useState([]); // Store original state to detect changes
  const [isEditing, setIsEditing] = useState(false);
  const [editingLectureId, setEditingLectureId] = useState(null);
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
  const [selectedLectureId, setSelectedLectureId] = useState(null); // For sidebar navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar toggle for mobile (closed by default on mobile)
  const [isDeleting, setIsDeleting] = useState(false); // For delete operations

  // Get save state from context
  const { 
    isSaving, 
    isUploading, 
    uploadProgress,
    saveLectures: saveLecturesContext,
    cancelUpload,
    pendingFilesMap,
    setPendingFilesMap 
  } = saveContext;

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
        setOriginalLectures(JSON.parse(JSON.stringify(allLectures))); // Deep clone for comparison
        
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
      setOriginalLectures([]);
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

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    // Check for new lectures (temp IDs)
    const hasNewLectures = lectures.some(l => !Number.isInteger(l.id) || l.id > 2147483647 || l.id < 1);
    
    // Check for modified lectures (compare with original)
    const hasModifiedLectures = lectures.some(lecture => {
      const original = originalLectures.find(o => o.id === lecture.id);
      if (!original) return false; // New lecture, already covered above
      
      // Compare content and title
      return lecture.content !== original.content || 
             lecture.title !== original.title ||
             lecture.order !== original.order ||
             lecture.parent_lecture_id !== original.parent_lecture_id;
    });
    
    return hasNewLectures || hasModifiedLectures;
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
    const result = await saveLecturesContext(courseId, lectures, pendingFilesMap);
    
    if (result.success) {
      setLectures(result.lectures);
      setOriginalLectures(JSON.parse(JSON.stringify(result.lectures)));
      setUnsavedLectures([]);
      setPendingFilesMap({});
      setToast({ message: 'All changes saved successfully!', type: 'success' });
      
      if (onSave) {
        onSave(result.lectures);
      }
    } else {
      const errorMsg = result.error || 'Failed to save lectures';
      const errorDetails = result.details ? JSON.stringify(result.details) : '';
      setToast({ message: `Error: ${errorMsg} ${errorDetails}`, type: 'error' });
    }
  };

  const deleteLecture = async (lectureId) => {
    try {
      setIsDeleting(true);
      
      // Check if this is a frontend-only lecture (unsaved)
      const isFrontendOnly = !Number.isInteger(lectureId) || lectureId > 2147483647 || lectureId < 1;
      
      // Function to get all descendants recursively
      const getAllDescendants = (parentId) => {
        const children = lectures.filter(l => l.parent_lecture_id === parentId);
        let allDescendants = [...children];
        children.forEach(child => {
          allDescendants = [...allDescendants, ...getAllDescendants(child.id)];
        });
        return allDescendants;
      };

      const allDescendants = getAllDescendants(lectureId);
      
      if (isFrontendOnly) {
        // Just remove from local state for frontend-only lectures
        const idsToRemove = [lectureId, ...allDescendants.map(d => d.id)];
        const updatedLectures = lectures.filter(l => !idsToRemove.includes(l.id));
        setLectures(updatedLectures);
        setOriginalLectures(updatedLectures);
        setSelectedLectureId(null); // Clear selection
        setShowDeleteConfirm(null);
        setToast({ message: 'Item deleted successfully!', type: 'success' });

        if (onSave) {
          onSave(updatedLectures);
        }
        return;
      }
      
      // Delete all descendants first (from database)
      for (const descendant of allDescendants) {
        const isDescendantFrontendOnly = !Number.isInteger(descendant.id) || descendant.id > 2147483647 || descendant.id < 1;
        if (!isDescendantFrontendOnly) {
          await api.delete(`/courses/${courseId}/lectures/${descendant.id}`);
        }
      }
      
      // Delete the parent lecture from database
      const response = await api.delete(`/courses/${courseId}/lectures/${lectureId}`);

      if (response.data.success) {
        // Remove the deleted lecture and all its descendants from local state
        const idsToRemove = [lectureId, ...allDescendants.map(d => d.id)];
        const updatedLectures = lectures.filter(l => !idsToRemove.includes(l.id));
        setLectures(updatedLectures);
        setOriginalLectures(updatedLectures);
        setSelectedLectureId(null); // Clear selection
        setShowDeleteConfirm(null);
        setToast({ message: 'Item deleted successfully!', type: 'success' });

        if (onSave) {
          onSave(updatedLectures);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete item';
      setToast({ message: `Error: ${errorMsg}`, type: 'error' });
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
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

  // Sidebar navigation item (recursive) - NetAcad Style
  const SidebarLectureItem = ({ lecture, level }) => {
    const children = getChildren(lecture.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedLectures[lecture.id];
    const isSelected = selectedLectureId === lecture.id;
    
    // Check if this lecture has unsaved changes
    const isUnsaved = (() => {
      // Check for new lecture (temp ID)
      if (!Number.isInteger(lecture.id) || lecture.id > 2147483647 || lecture.id < 1) return true;
      
      // Check for modified lecture
      const original = originalLectures.find(o => o.id === lecture.id);
      if (!original) return false;
      
      return lecture.content !== original.content || 
             lecture.title !== original.title ||
             lecture.order !== original.order ||
             lecture.parent_lecture_id !== original.parent_lecture_id;
    })();

    // Icons based on level
    const getIcon = () => {
      if (lecture.level === 0) return <FolderOpen size={16} className={isSelected ? "text-white" : "text-blue-600"} />;
      if (lecture.level === 1) return <BookOpen size={16} className={isSelected ? "text-white" : "text-green-600"} />;
      return <FileText size={16} className={isSelected ? "text-white" : "text-purple-600"} />;
    };

    return (
      <div>
        <div
          onClick={() => {
            setSelectedLectureId(lecture.id);
            if (hasChildren) {
              toggleLecture(lecture.id);
            }
          }}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          className={`flex items-center gap-2 py-2 pr-3 cursor-pointer transition group ${
            isSelected
              ? 'bg-orange-600 text-white shadow-sm'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {hasChildren ? (
            <span className="flex-shrink-0 transition-transform" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
              <ChevronDown size={14} className={isSelected ? "text-white" : "text-gray-500"} />
            </span>
          ) : (
            <span className="w-3.5"></span>
          )}
          
          <span className="flex-shrink-0">
            {getIcon()}
          </span>
          
          <span className="flex-1 truncate text-sm font-medium">
            {lecture.title}
          </span>

          {/* Unsaved indicator (orange dot) */}
          {isUnsaved && (
            <span className="flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-yellow-300' : 'bg-orange-500'} animate-pulse`} title="Unsaved changes"></div>
            </span>
          )}

          {/* Content indicator (green dot) */}
          {lecture.content && !isUnsaved && (
            <span className="flex-shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} title="Has content"></div>
            </span>
          )}
        </div>

        {/* Render children */}
        {isExpanded && hasChildren && (
          <div className="border-l border-gray-200 ml-6">
            {children.map(child => (
              <SidebarLectureItem key={child.id} lecture={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render hierarchical lecture item - NetAcad Style
  const LectureItem = ({ lecture }) => {
    const children = getChildren(lecture.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedLectures[lecture.id];
    const isSearchMatch = searchQuery.trim() && filteredLectures.some(l => l.id === lecture.id);

    // Get appropriate styling based on level
    const getLevelStyles = () => {
      if (lecture.level === 0) {
        return {
          bg: 'bg-white',
          border: 'border-blue-200',
          hoverBorder: 'hover:border-blue-400',
          icon: <Layers size={20} className="text-blue-600" />,
          badge: 'bg-blue-100 text-blue-700',
          label: 'Module'
        };
      } else if (lecture.level === 1) {
        return {
          bg: 'bg-white',
          border: 'border-green-200',
          hoverBorder: 'hover:border-green-400',
          icon: <BookOpen size={18} className="text-green-600" />,
          badge: 'bg-green-100 text-green-700',
          label: 'Chapter'
        };
      } else {
        return {
          bg: 'bg-white',
          border: 'border-purple-200',
          hoverBorder: 'hover:border-purple-400',
          icon: <FileText size={16} className="text-purple-600" />,
          badge: 'bg-purple-100 text-purple-700',
          label: 'Topic'
        };
      }
    };

    const styles = getLevelStyles();

    return (
      <div className={`${
        lecture.level === 1 ? 'ml-6' :
        lecture.level === 2 ? 'ml-12' :
        lecture.level > 2 ? 'ml-18' : ''
      }`}>
        <div className={`${styles.bg} rounded-lg border-2 ${styles.border} ${styles.hoverBorder} transition-all duration-200 mb-3 overflow-hidden shadow-sm ${
          isSearchMatch ? 'ring-2 ring-orange-400 shadow-md' : ''
        }`}>
          {/* Header */}
          <div
            onClick={() => toggleLecture(lecture.id)}
            className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition ${
              lecture.level === 0 ? 'bg-gradient-to-r from-gray-50 to-white' : ''
            }`}
          >
            {/* Drag Handle (for future drag-and-drop) */}
            {isTeacher && (
              <div className="flex-shrink-0 text-gray-300 hover:text-gray-600 cursor-move">
                <GripVertical size={18} />
              </div>
            )}

            {/* Expand/Collapse Icon */}
            <div className="flex-shrink-0">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown size={20} className="text-gray-600" />
                ) : (
                  <ChevronRight size={20} className="text-gray-400" />
                )
              ) : (
                <div className="w-5"></div>
              )}
            </div>

            {/* Icon */}
            <div className="flex-shrink-0">
              {styles.icon}
            </div>

            {/* Title and Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${styles.badge}`}>
                  {styles.label}
                </span>
                {lecture.content && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Content
                  </span>
                )}
              </div>
              <h4 className={`font-semibold text-gray-900 truncate ${
                lecture.level === 0 ? 'text-lg' :
                lecture.level === 1 ? 'text-base' : 'text-sm'
              }`}>
                {lecture.title}
              </h4>
              {hasChildren && (
                <p className="text-xs text-gray-500 mt-1">
                  {children.length} {children.length === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>

            {/* Actions */}
            {isTeacher && (
              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddSubModal(lecture.id);
                  }}
                  className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                  title={`Add ${lecture.level === 0 ? 'Chapter' : lecture.level === 1 ? 'Topic' : 'Item'}`}
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editLecture(lecture);
                  }}
                  className="p-2 hover:bg-orange-100 rounded-lg text-orange-600 transition"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(lecture.id);
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Content Preview - Always show when available */}
          {lecture.content && isExpanded && (
            <div className="border-t border-gray-200 px-6 py-5 bg-gray-50">
              <style>{`
                .lecture-content h1 { font-size: 2.25rem; font-weight: bold; margin: 1.5rem 0 0.75rem 0; color: #ea580c; line-height: 1.2; }
                .lecture-content h2 { font-size: 1.875rem; font-weight: bold; margin: 1.25rem 0 0.75rem 0; color: #c2410c; line-height: 1.3; }
                .lecture-content h3 { font-size: 1.5rem; font-weight: bold; margin: 1rem 0 0.5rem 0; color: #9a3412; line-height: 1.4; }
                .lecture-content h4 { font-size: 1.25rem; font-weight: bold; margin: 0.875rem 0 0.5rem 0; color: #9a3412; line-height: 1.4; }
                .lecture-content h5 { font-size: 1.125rem; font-weight: bold; margin: 0.875rem 0 0.5rem 0; color: #9a3412; line-height: 1.4; }
                .lecture-content h6 { font-size: 1rem; font-weight: bold; margin: 0.875rem 0 0.5rem 0; color: #9a3412; line-height: 1.4; }
                .lecture-content p { margin: 0.75rem 0; line-height: 1.8; color: #374151; }
                .lecture-content ul { list-style-type: disc; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                .lecture-content ol { list-style-type: decimal; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                .lecture-content li { margin: 0.5rem 0; color: #4b5563; }
                .lecture-content ul[data-type="taskList"] { list-style: none; padding-left: 0; margin-left: 0; }
                .lecture-content ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
                .lecture-content ul[data-type="taskList"] input[type="checkbox"] { margin-top: 0.25rem; width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: #f97316; }
                .lecture-content blockquote { border-left: 4px solid #f97316; padding-left: 1.5rem; margin: 1rem 0; color: #4b5563; font-style: italic; background: linear-gradient(90deg, #fef3c7 0%, rgba(249, 115, 22, 0.1) 10%, transparent 20%); padding: 1rem; border-radius: 0.5rem; }
                .lecture-content code { background-color: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: 'Courier New', monospace; color: #ea580c; font-size: 0.9em; }
                .lecture-content pre { background-color: #1f2937; border-radius: 0.75rem; padding: 1.5rem; overflow-x: auto; margin: 1rem 0; }
                .lecture-content pre code { background: none; padding: 0; color: #e5e7eb; font-size: 0.875rem; line-height: 1.6; }
                .lecture-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                .lecture-content video { max-width: 640px; width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                .lecture-content table { border-collapse: collapse; width: 100%; margin: 1rem 0; background: #ffffff; border: 2px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; }
                .lecture-content table th { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); font-weight: bold; color: white; padding: 1rem; text-align: left; }
                .lecture-content table td { border: 1px solid #e5e7eb; padding: 1rem; color: #374151; background: #f9fafb; }
                .lecture-content iframe { max-width: 640px; width: 100%; border-radius: 0.75rem; margin: 1rem 0; aspect-ratio: 16 / 9; border: 2px solid #e5e7eb; }
                .lecture-content a { color: #3b82f6; text-decoration: underline; }
                .lecture-content a:hover { color: #2563eb; }
                .lecture-content mark { background-color: #fef08a; color: #000; padding: 0.1rem 0.2rem; border-radius: 0.125rem; }
                .lecture-content sub { vertical-align: sub; font-size: 0.75em; }
                .lecture-content sup { vertical-align: super; font-size: 0.75em; }
                .lecture-content hr { border: none; border-top: 2px solid #e5e7eb; margin: 2rem 0; }
              `}</style>
              <div 
                className="lecture-content prose max-w-none text-gray-700 bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
                dangerouslySetInnerHTML={{ __html: lecture.content }}
              />
            </div>
          )}

          {/* Children */}
          {hasChildren && isExpanded && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50">
              <div className="space-y-3">
                {children.map(child => (
                  <LectureItem key={child.id} lecture={child} />
                ))}
              </div>
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
              <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between gap-3">
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

                    <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-1 truncate">
                      Edit: {editingLecture?.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">Lecture content editor</p>
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
              <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200 max-h-[60vh] lg:max-h-[500px]">
                <div className="flex-1 p-6 overflow-y-auto">
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
                  <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
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
              <div className="bg-gray-50 border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap gap-3 justify-between">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingLectureId(null);
                    setCurrentContent('');
                  }}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm"
                >
                  <X size={18} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={async () => {
                    // Save content to local state first
                    const updatedLectures = lectures.map(l =>
                      l.id === editingLectureId
                        ? { ...l, content: currentContent }
                        : l
                    );
                    setLectures(updatedLectures);
                    
                    // Save to database with updated lectures
                    const result = await saveLecturesContext(courseId, updatedLectures, pendingFilesMap);
                    
                    if (result.success) {
                      setLectures(result.lectures);
                      setOriginalLectures(JSON.parse(JSON.stringify(result.lectures)));
                      setUnsavedLectures([]);
                      setPendingFilesMap({});
                      setToast({ message: 'Content saved successfully!', type: 'success' });
                      
                      // Close editor after successful save
                      setIsEditing(false);
                      setEditingLectureId(null);
                      setCurrentContent('');
                      
                      if (onSave) {
                        onSave(result.lectures);
                      }
                    } else {
                      const errorMsg = result.error || 'Failed to save content';
                      setToast({ message: `Error: ${errorMsg}`, type: 'error' });
                    }
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Save size={18} />
                  <span>{isSaving ? 'Saving...' : 'Save & Close'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-full md:h-screen bg-gray-100">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl min-w-[300px]">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <span className="text-gray-900 font-semibold mb-1">Uploading file...</span>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-orange-600 h-2 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span className="text-gray-600 text-sm">{uploadProgress}%</span>
            <button
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
              onClick={cancelUpload}
            >
              Cancel Upload
            </button>
          </div>
        </div>
      )}

      {/* Left Sidebar - Content Tree Navigation */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:w-72
        fixed lg:relative left-0 top-0 w-72 z-40
        transition-all duration-300 border-r border-gray-300 bg-white shadow-lg lg:shadow-sm 
        h-[calc(100vh-4rem)] lg:h-full
        max-h-[calc(100vh-4rem)] lg:max-h-full
        flex flex-col
      `}>
        {/* Sidebar Header - TRULY FIXED */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={20} className="text-orange-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Content Structure</h3>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions - TRULY FIXED */}
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex gap-2 flex-shrink-0">
          <button
            onClick={expandAllLectures}
            className="flex-1 px-2 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition flex items-center justify-center gap-1"
            title="Expand All"
          >
            <ChevronDown size={12} />
            Expand
          </button>
          <button
            onClick={collapseAllLectures}
            className="flex-1 px-2 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition flex items-center justify-center gap-1"
            title="Collapse All"
          >
            <ChevronRight size={12} />
            Collapse
          </button>
        </div>

        {/* Navigation Tree - Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {getRootLectures().length === 0 ? (
            <div className="p-6 text-center">
              <BookOpen size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No modules yet</p>
              {isTeacher && (
                <p className="text-xs text-gray-400 mt-1">Add your first module to get started</p>
              )}
            </div>
          ) : (
            <div className="py-2">
              {getRootLectures().map(lecture => (
                <SidebarLectureItem key={lecture.id} lecture={lecture} level={0} />
              ))}
            </div>
          )}
        </div>

        {/* Save All Button (Footer - Always Visible) */}
        {isTeacher && hasUnsavedChanges() && (
          <div className="p-3 border-t border-gray-200 bg-green-50 flex-shrink-0">
            <button
              onClick={saveAllLectures}
              disabled={isSaving}
              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-sm"
            >
              <Save size={18} />
              <span className="hidden sm:inline">{isSaving ? 'Saving Changes...' : 'Save All Changes'}</span>
              <span className="sm:hidden">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-full md:h-screen">
        {/* Top Toolbar - Fixed Header */}
        <div className="px-3 sm:px-6 py-3 border-b border-gray-300 bg-white flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900 flex items-center gap-2 truncate">
              {selectedLectureId ? (
                <>
                  <FileText size={16} className="text-orange-600 flex-shrink-0" />
                  <span className="truncate">{lectures.find(l => l.id === selectedLectureId)?.title}</span>
                </>
              ) : (
                <>
                  <Layers size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 hidden sm:inline">Course Content Editor</span>
                  <span className="text-gray-500 sm:hidden">Content</span>
                </>
              )}
            </h2>
          </div>
          
          {isTeacher && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedLectureId(null);
                  setTimeout(() => document.querySelector('input[placeholder*="Module"]')?.focus(), 100);
                }}
                className="px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2 font-medium text-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Module</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Display Area - Scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white md:bg-gray-50">
          {/* Show selected lecture content OR the tree structure */}
          {selectedLectureId ? (
            // Display selected lecture content
            (() => {
              const selectedLecture = lectures.find(l => l.id === selectedLectureId);
              if (!selectedLecture) return null;
                
                return (
                  <div className="h-full flex flex-col bg-white overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {selectedLecture.level === 0 && <FolderOpen size={18} className="text-blue-600 flex-shrink-0" />}
                        {selectedLecture.level === 1 && <BookOpen size={18} className="text-green-600 flex-shrink-0" />}
                        {selectedLecture.level >= 2 && <FileText size={18} className="text-purple-600 flex-shrink-0" />}
                        <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{selectedLecture.title}</h1>
                      </div>
                      {isTeacher && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {selectedLecture.level === 0 ? (
                            // Module - Show delete button only
                            <button
                              onClick={() => setShowDeleteConfirm(selectedLecture.id)}
                              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              <span className="hidden sm:inline">Delete Module</span>
                            </button>
                          ) : (
                            // Chapter/Topic - Show edit and delete buttons
                            <>
                              <button
                                onClick={() => setShowDeleteConfirm(selectedLecture.id)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                              <button
                                onClick={() => editLecture(selectedLecture)}
                                className="px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
                              >
                                <Edit size={16} />
                                <span className="hidden sm:inline">Edit Content</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                      {selectedLecture.level === 0 ? (
                        // Module (level 0) - Show children instead of content
                        <div className="max-w-4xl mx-auto">
                          <div className="mb-4 sm:mb-6 flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Module Overview</h2>
                              <p className="text-sm sm:text-base text-gray-600">This module contains the following chapters and topics:</p>
                            </div>
                            {isTeacher && (
                              <button
                                onClick={() => setShowAddSubModal(selectedLecture.id)}
                                className="flex-shrink-0 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2 text-sm font-medium"
                              >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Add Chapter</span>
                                <span className="sm:hidden">Add</span>
                              </button>
                            )}
                          </div>
                          
                          {getChildren(selectedLecture.id).length > 0 ? (
                            <div className="space-y-3">
                              {getChildren(selectedLecture.id).map((child, index) => (
                                <div
                                  key={child.id}
                                  onClick={() => setSelectedLectureId(child.id)}
                                  className="bg-white border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:border-orange-500 hover:shadow-md transition cursor-pointer active:scale-98"
                                >
                                  <div className="flex items-center gap-3">
                                    {child.level === 1 && <BookOpen size={18} className="text-green-600" />}
                                    {child.level >= 2 && <FileText size={18} className="text-purple-600" />}
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{index + 1}. {child.title}</h3>
                                      {child.content && (
                                        <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          Has content
                                        </span>
                                      )}
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <BookOpen size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
                              <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No chapters in this module yet</p>
                              {isTeacher && (
                                <button
                                  onClick={() => setShowAddSubModal(selectedLecture.id)}
                                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                                >
                                  Add Chapter
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : selectedLecture.content ? (
                        <div className="max-w-4xl mx-auto">
                          <style>{`
                            .lecture-content h1 { font-size: 2.25rem; font-weight: bold; margin: 1.5rem 0 0.75rem 0; color: #ea580c; line-height: 1.2; }
                            .lecture-content h2 { font-size: 1.875rem; font-weight: bold; margin: 1.25rem 0 0.75rem 0; color: #c2410c; line-height: 1.3; }
                            .lecture-content h3 { font-size: 1.5rem; font-weight: bold; margin: 1rem 0 0.5rem 0; color: #9a3412; line-height: 1.4; }
                            .lecture-content h4 { font-size: 1.25rem; font-weight: bold; margin: 0.875rem 0 0.5rem 0; color: #9a3412; line-height: 1.4; }
                            .lecture-content h5 { font-size: 1.125rem; font-weight: bold; margin: 0.875rem 0 0.5rem 0; color: #9a3412; line-height: 1.4; }
                            .lecture-content h6 { font-size: 1rem; font-weight: bold; margin: 0.875rem 0 0.5rem 0; color: #9a3412; line-height: 1.4; }
                            .lecture-content p { margin: 0.75rem 0; line-height: 1.8; color: #374151; }
                            .lecture-content ul { list-style-type: disc; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                            .lecture-content ol { list-style-type: decimal; margin-left: 2rem; margin: 0.75rem 0 0.75rem 2rem; }
                            .lecture-content li { margin: 0.5rem 0; color: #4b5563; }
                            .lecture-content ul[data-type="taskList"] { list-style: none; padding-left: 0; margin-left: 0; }
                            .lecture-content ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
                            .lecture-content ul[data-type="taskList"] input[type="checkbox"] { margin-top: 0.25rem; width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: #f97316; }
                            .lecture-content blockquote { border-left: 4px solid #f97316; padding-left: 1.5rem; margin: 1rem 0; color: #4b5563; font-style: italic; background: linear-gradient(90deg, #fef3c7 0%, rgba(249, 115, 22, 0.1) 10%, transparent 20%); padding: 1rem; border-radius: 0.5rem; }
                            .lecture-content code { background-color: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: 'Courier New', monospace; color: #ea580c; font-size: 0.9em; }
                            .lecture-content pre { background-color: #1f2937; border-radius: 0.75rem; padding: 1.5rem; overflow-x: auto; margin: 1rem 0; }
                            .lecture-content pre code { background: none; padding: 0; color: #e5e7eb; font-size: 0.875rem; line-height: 1.6; }
                            .lecture-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                            .lecture-content video { max-width: 640px; width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                            .lecture-content table { border-collapse: collapse; width: 100%; margin: 1rem 0; background: #ffffff; border: 2px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; }
                            .lecture-content table th { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); font-weight: bold; color: white; padding: 1rem; text-align: left; }
                            .lecture-content table td { border: 1px solid #e5e7eb; padding: 1rem; color: #374151; background: #f9fafb; }
                            .lecture-content iframe { max-width: 640px; width: 100%; border-radius: 0.75rem; margin: 1rem 0; aspect-ratio: 16 / 9; border: 2px solid #e5e7eb; }
                            .lecture-content a { color: #3b82f6; text-decoration: underline; }
                            .lecture-content a:hover { color: #2563eb; }
                            .lecture-content mark { background-color: #fef08a; color: #000; padding: 0.1rem 0.2rem; border-radius: 0.125rem; }
                            .lecture-content sub { vertical-align: sub; font-size: 0.75em; }
                            .lecture-content sup { vertical-align: super; font-size: 0.75em; }
                            .lecture-content hr { border: none; border-top: 2px solid #e5e7eb; margin: 2rem 0; }
                          `}</style>
                          <div 
                            className="lecture-content"
                            dangerouslySetInnerHTML={{ __html: selectedLecture.content }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No content yet</p>
                            {isTeacher && (
                              <button
                                onClick={() => editLecture(selectedLecture)}
                                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                              >
                                Add Content
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              // Show tree structure when no lecture is selected
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Add New Module Card - Static */}
                {isTeacher && (
                  <div className="flex-shrink-0 p-3 sm:p-6 pb-0">
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-orange-400 transition">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Plus size={20} className="text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Add New Module</h3>
                        <p className="text-xs text-gray-500 mb-3 hidden sm:block">Create a top-level module to organize your course content</p>
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <input
                            type="text"
                            value={newLectureTitle}
                            onChange={(e) => setNewLectureTitle(e.target.value)}
                            placeholder="Module 1: Introduction"
                            className="flex-1 px-3 sm:px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white"
                            onKeyPress={(e) => e.key === 'Enter' && newLectureTitle.trim() && addLecture()}
                          />
                          <button
                            onClick={addLecture}
                            disabled={!newLectureTitle.trim()}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Plus size={16} />
                            <span>Add Module</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                )}

                {/* Content Modules List - Scrollable */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="space-y-4">
                  {getRootLectures().length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                      <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Yet</h3>
                      <p className="text-gray-500 mb-1">
                        {isTeacher
                          ? 'Start building your course by adding modules'
                          : 'No course materials have been added yet'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {isTeacher && 'Modules can contain chapters, and chapters can contain topics'}
                      </p>
                    </div>
                  ) : (
                    getRootLectures().map(lecture => (
                      <LectureItem key={lecture.id} lecture={lecture} />
                    ))
                  )}
                </div>
                
                {/* Save Button - Fixed at Bottom of Main Content */}
                {isTeacher && hasUnsavedChanges() && (
                  <div className="p-3 sm:p-4 border-t border-gray-200 bg-green-50 flex-shrink-0">
                    <button
                      onClick={saveAllLectures}
                      disabled={isSaving}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                    >
                      <Save size={20} />
                      <span>{isSaving ? 'Saving Changes...' : 'Save All Changes'}</span>
                    </button>
                  </div>
                )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (() => {
        const itemToDelete = lectures.find(l => l.id === showDeleteConfirm);
        const childCount = itemToDelete ? getChildren(itemToDelete.id).length : 0;
        const itemType = itemToDelete?.level === 0 ? 'Module' : itemToDelete?.level === 1 ? 'Chapter' : 'Topic';
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="modal-panel modal-panel--md bg-white rounded-lg p-4 sm:p-6 w-full mx-4 border border-gray-300 shadow-xl max-w-md"
            >
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 size={20} className="sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Delete {itemType}?
                  </h3>
                  <p className="text-gray-600 mb-2">
                    You are about to delete: <strong className="text-gray-900">{itemToDelete?.title}</strong>
                  </p>
                  {childCount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ This {itemType.toLowerCase()} contains <strong>{childCount}</strong> {childCount === 1 ? 'item' : 'items'} that will also be deleted.
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-red-600 mt-3">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteLecture(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

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
