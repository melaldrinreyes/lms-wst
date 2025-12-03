import { createContext, useState, useCallback, useRef } from 'react';
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

const SaveContext = createContext(null);

function SaveProvider({ children }) {
  // Global save state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingChanges, setPendingChanges] = useState({});
  const uploadAbortController = useRef(null);

  // Track pending files globally
  const [pendingFilesMap, setPendingFilesMap] = useState({});

  /**
   * Register pending changes for a specific entity
   * @param {string} entityType - Type of entity (e.g., 'lecture', 'assignment', 'announcement')
   * @param {string|number} entityId - ID of the entity
   * @param {object} changes - The changed data
   */
  const registerChange = useCallback((entityType, entityId, changes) => {
    setPendingChanges(prev => ({
      ...prev,
      [`${entityType}_${entityId}`]: {
        type: entityType,
        id: entityId,
        data: changes,
        timestamp: Date.now(),
      }
    }));
  }, []);

  /**
   * Clear changes for a specific entity
   */
  const clearChange = useCallback((entityType, entityId) => {
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[`${entityType}_${entityId}`];
      return newChanges;
    });
  }, []);

  /**
   * Check if there are any pending changes
   */
  const hasChanges = useCallback(() => {
    return Object.keys(pendingChanges).length > 0;
  }, [pendingChanges]);

  /**
   * Upload a single file with progress tracking
   */
  const uploadFile = useCallback(async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/modules/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress, progressEvent.loaded, progressEvent.total);
        }
      },
      signal: uploadAbortController.current?.signal,
    });

    return response.data?.url;
  }, []);

  /**
   * Upload multiple files with aggregated progress
   */
  const uploadFiles = useCallback(async (files) => {
    setIsUploading(true);
    const totalSize = files.reduce((sum, f) => sum + (f.file?.size || 0), 0);
    let loadedSoFar = 0;

    const urlMap = {};

    for (const fileObj of files) {
      try {
        const url = await uploadFile(fileObj.file, (progress, loaded) => {
          const currentLoaded = loadedSoFar + loaded;
          setUploadProgress(Math.round((currentLoaded * 100) / totalSize));
        });

        loadedSoFar += fileObj.file?.size || 0;
        if (url) {
          urlMap[fileObj.objectUrl] = url;
        }
      } catch (error) {
        console.error('Failed to upload file:', fileObj.file?.name, error);
        throw error;
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    return urlMap;
  }, [uploadFile]);

  /**
   * Replace blob URLs in HTML content with real URLs
   */
  const replaceBlobUrls = useCallback((html, urlMap) => {
    let updatedHtml = html;
    Object.entries(urlMap).forEach(([objectUrl, realUrl]) => {
      const regex = new RegExp(objectUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      updatedHtml = updatedHtml.replace(regex, realUrl);
    });
    return updatedHtml;
  }, []);

  /**
   * Centralized save function for lectures
   */
  const saveLectures = useCallback(async (courseId, lectures, pendingFiles = {}) => {
    try {
      setIsSaving(true);
      setIsUploading(true);

      // Sort lectures by level (parents before children)
      const sortedLectures = [...lectures].sort((a, b) => {
        const levelA = typeof a.level !== 'undefined' ? a.level : 0;
        const levelB = typeof b.level !== 'undefined' ? b.level : 0;
        return levelA - levelB;
      });

      // Collect all pending files
      const allPendingFiles = [];
      Object.values(pendingFiles).forEach(arr => {
        if (Array.isArray(arr)) allPendingFiles.push(...arr);
      });

      // Upload all files and get URL mappings
      const urlMap = allPendingFiles.length > 0 
        ? await uploadFiles(allPendingFiles)
        : {};

      // Process lectures and replace blob URLs
      const updatedLectures = sortedLectures.map(lecture => {
        let html = lecture.content || '';
        const lectureFiles = pendingFiles[lecture.id] || [];

        if (lectureFiles.length > 0) {
          html = replaceBlobUrls(html, urlMap);
        }

        return {
          ...lecture,
          content: html,
          parent_lecture_id: lecture.parent_lecture_id || null,
          level: typeof lecture.level !== 'undefined' ? lecture.level : 0,
        };
      });

      // Save to backend
      const response = await api.post(`/courses/${courseId}/lectures`, {
        lectures: updatedLectures,
      });

      if (response.data.success) {
        // Clear pending changes
        lectures.forEach(lecture => {
          clearChange('lecture', lecture.id);
        });

        return {
          success: true,
          lectures: response.data.lectures || updatedLectures,
        };
      }

      throw new Error(response.data.message || 'Failed to save lectures');
    } catch (error) {
      console.error('Save error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to save',
        details: error.response?.data?.errors,
      };
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadFiles, replaceBlobUrls, clearChange]);

  /**
   * Cancel ongoing upload
   */
  const cancelUpload = useCallback(() => {
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
      uploadAbortController.current = null;
    }
    setIsUploading(false);
    setIsSaving(false);
    setUploadProgress(0);
  }, []);

  /**
   * Clear all pending changes
   */
  const clearAllChanges = useCallback(() => {
    setPendingChanges({});
    setPendingFilesMap({});
  }, []);

  const value = {
    // State
    isSaving,
    isUploading,
    uploadProgress,
    pendingChanges,
    pendingFilesMap,

    // Actions
    registerChange,
    clearChange,
    hasChanges,
    saveLectures,
    uploadFile,
    uploadFiles,
    cancelUpload,
    clearAllChanges,
    
    // File management
    setPendingFilesMap,
  };

  return <SaveContext.Provider value={value}>{children}</SaveContext.Provider>;
}

export { SaveContext };
export default SaveProvider;
