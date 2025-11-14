import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Edit, X, Eye, Loader } from 'lucide-react';
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
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Edit Course Content</h2>
            <RichTextEditor value={content} onChange={setContent} />
            
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-800 transition"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
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
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                <Edit size={18} />
                Edit Content
              </button>
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
    </div>
  );
}
