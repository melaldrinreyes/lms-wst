import { useState, useEffect, useRef } from 'react';
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
        setToast({ message: 'Lecture saved successfully!', type: 'success' });
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
        setToast({ message: 'All lectures saved successfully!', type: 'success' });
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
      
      // Find all child lectures that need to be deleted
      const childrenToDelete = lectures.filter(l => l.parent_lecture_id === lectureId);
      
      // Delete children first
      for (const child of childrenToDelete) {
        await api.delete(`/courses/${courseId}/lectures/${child.id}`);
      }
      
      // Delete the parent lecture
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
                .lecture-content video { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #4b5563; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
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
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-6 py-4">
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
                  <RichTextEditor
                    ref={editorRef}
                    value={currentContent}
                    onChange={setCurrentContent}
                    pendingFiles={pendingFilesMap[editingLectureId] || []}
                    onPendingFilesChange={files => setPendingFilesMap(prev => ({ ...prev, [editingLectureId]: files }))}
                  />
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

          {/* Show Save All if any unsaved lectures (modules or sub-lectures) exist */}
          {lectures.some(l => !Number.isInteger(l.id) || l.id > 2147483647 || l.id < 1) && (
            <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-400">
                  ✓ Unsaved changes detected
                </p>
                <p className="text-xs text-gray-400 mt-1">
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
