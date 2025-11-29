import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Upload, Download, Trash2 } from 'lucide-react';
import { classMaterialAPI } from '../services/api';
import Modal from './ui/Modal';
import Toast from './ui/Toast';
import Swal from 'sweetalert2';

const ClassMaterialsTab = ({ courseId, courseName }) => {
  const [classMaterials, setClassMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch class materials for this course
  const fetchClassMaterials = useCallback(async () => {
    try {
      const response = await classMaterialAPI.getByCourse(courseId);
      setClassMaterials(response.materials || []);
    } catch (error) {
      console.error('Error fetching class materials:', error);
      setToast({ message: 'Failed to load class materials', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchClassMaterials();
    }
  }, [courseId, fetchClassMaterials]);

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData({ ...formData, files });
    }
  };

  // Remove selected file
  const handleRemoveFile = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    setFormData({ ...formData, files: newFiles });
  };

  // Get file type information for display
  const getFileTypeInfo = (filePath) => {
    if (!filePath) {
      return { icon: '📄', category: 'File', color: 'text-gray-400', bgColor: 'bg-gray-900/20', borderColor: 'border-gray-700' };
    }

    const extension = filePath.split('.').pop().toLowerCase();

    const fileTypes = {
      // Documents
      pdf: { icon: '📄', category: 'PDF Document', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },
      doc: { icon: '📝', category: 'Word Document', color: 'text-blue-400', bgColor: 'bg-blue-900/20', borderColor: 'border-blue-700' },
      docx: { icon: '📝', category: 'Word Document', color: 'text-blue-400', bgColor: 'bg-blue-900/20', borderColor: 'border-blue-700' },
      ppt: { icon: '📊', category: 'PowerPoint', color: 'text-orange-400', bgColor: 'bg-orange-900/20', borderColor: 'border-orange-700' },
      pptx: { icon: '📊', category: 'PowerPoint', color: 'text-orange-400', bgColor: 'bg-orange-900/20', borderColor: 'border-orange-700' },
      xls: { icon: '📈', category: 'Excel Sheet', color: 'text-green-400', bgColor: 'bg-green-900/20', borderColor: 'border-green-700' },
      xlsx: { icon: '📈', category: 'Excel Sheet', color: 'text-green-400', bgColor: 'bg-green-900/20', borderColor: 'border-green-700' },

      // Images
      jpg: { icon: '🖼️', category: 'Image', color: 'text-purple-400', bgColor: 'bg-purple-900/20', borderColor: 'border-purple-700' },
      jpeg: { icon: '🖼️', category: 'Image', color: 'text-purple-400', bgColor: 'bg-purple-900/20', borderColor: 'border-purple-700' },
      png: { icon: '🖼️', category: 'Image', color: 'text-purple-400', bgColor: 'bg-purple-900/20', borderColor: 'border-purple-700' },
      gif: { icon: '🖼️', category: 'Image', color: 'text-purple-400', bgColor: 'bg-purple-900/20', borderColor: 'border-purple-700' },

      // Videos
      mp4: { icon: '🎥', category: 'Video', color: 'text-pink-400', bgColor: 'bg-pink-900/20', borderColor: 'border-pink-700' },
      avi: { icon: '🎥', category: 'Video', color: 'text-pink-400', bgColor: 'bg-pink-900/20', borderColor: 'border-pink-700' },
      mov: { icon: '🎥', category: 'Video', color: 'text-pink-400', bgColor: 'bg-pink-900/20', borderColor: 'border-pink-700' },

      // Archives
      zip: { icon: '📦', category: 'Archive', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      rar: { icon: '📦', category: 'Archive', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },

      // Text files
      txt: { icon: '📄', category: 'Text File', color: 'text-gray-400', bgColor: 'bg-gray-900/20', borderColor: 'border-gray-700' },
    };

    return fileTypes[extension] || { icon: '📄', category: 'File', color: 'text-gray-400', bgColor: 'bg-gray-900/20', borderColor: 'border-gray-700' };
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!formData.title || formData.title.trim() === '') {
        setToast({ message: 'Material title is required', type: 'error' });
        return;
      }

      if (!formData.files || formData.files.length === 0) {
        setToast({ message: 'Please select a file to upload', type: 'error' });
        return;
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description || '');

      // Append file
      const file = formData.files[0];
      console.log('Uploading class material file:', file.name, file.size, file.type);

      // Check file size (500MB = 524288000 bytes)
      if (file.size > 524288000) {
        setToast({ message: 'File size exceeds 500MB limit. Please choose a smaller file.', type: 'error' });
        return;
      }

      submitData.append('file', file);

      // Set uploading state and progress
      setUploading(true);
      setUploadProgress(0);

      // Upload class material with progress tracking
      await classMaterialAPI.create(courseId, submitData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      setToast({ message: 'Class material uploaded successfully!', type: 'success' });

      // Refresh class materials list
      await fetchClassMaterials();

      // Reset form and close modal
      setIsModalOpen(false);
      setFormData({});
      setUploading(false);
      setUploadProgress(0);

    } catch (error) {
      console.error('Error saving:', error);
      let errorMessage = 'Failed to upload material. Please try again.';

      if (error.response) {
        if (error.response.data) {
          const data = error.response.data;
          if (data.errors) {
            const firstError = Object.values(data.errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else if (data.message) {
            errorMessage = data.message;
          }
        }
      }

      setToast({ message: errorMessage, type: 'error' });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle download
  const handleDownloadClassMaterial = async (materialId) => {
    try {
      await classMaterialAPI.download(materialId);
      setToast({ message: 'Material downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error downloading class material:', error);
      setToast({ message: 'Failed to download material', type: 'error' });
    }
  };

  // Handle delete
  const handleDeleteClassMaterial = async (materialId, materialTitle) => {
    const res = await Swal.fire({
      title: 'Delete material',
      text: `Are you sure you want to delete "${materialTitle}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316'
    });
    if (!res.isConfirmed) return;
    try {
      await classMaterialAPI.delete(materialId);
      setToast({ message: 'Material deleted successfully!', type: 'success' });
      await fetchClassMaterials();
      Swal.fire({ title: 'Deleted', text: 'Material deleted', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (error) {
      console.error('Error deleting class material:', error);
      setToast({ message: 'Failed to delete material', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-400 text-sm">Loading class materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Class Materials</h2>
          <p className="text-gray-400 text-sm">Upload and manage course materials for {courseName}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 font-semibold"
        >
          <Plus size={20} />
          Upload Material
        </button>
      </div>

      <div className="space-y-4">
        {classMaterials.length === 0 ? (
          <div className="bg-gray-900 dark:bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No materials uploaded yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Upload course materials like lecture notes, handouts, or reference documents for your students.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-semibold"
            >
              <Plus size={20} />
              Upload First Material
            </button>
          </div>
        ) : (
          classMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-gray-900 dark:bg-gray-950 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition">
                    {material.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {material.description || 'No description provided'}
                  </p>
                  <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${getFileTypeInfo(material.file_path).bgColor} ${getFileTypeInfo(material.file_path).borderColor} mb-4`}>
                    <span className="text-lg">{getFileTypeInfo(material.file_path).icon}</span>
                    <div className="flex flex-col">
                      <span className={`text-xs font-semibold ${getFileTypeInfo(material.file_path).color}`}>
                        {getFileTypeInfo(material.file_path).category}
                      </span>
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {material.original_name || (material.file_path ? material.file_path.split('/').pop() : 'Unknown file')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Upload size={16} className="text-blue-400" />
                      <span className="font-medium">Uploaded:</span> {new Date(material.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <FileText size={16} className="text-green-400" />
                      <span className="font-medium">Size:</span> {(material.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDownloadClassMaterial(material.id)}
                    className="p-2.5 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 border border-transparent hover:border-blue-500/20 rounded-lg transition-all"
                    title="Download material"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClassMaterial(material.id, material.title)}
                    className="p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
                    title="Delete material"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Class Material"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Section */}
          <div>
            <label htmlFor="material-title" className="block text-sm font-semibold text-gray-200 mb-2">
              Material Title <span className="text-red-500">*</span>
            </label>
            <input
              id="material-title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition"
              placeholder="Enter material title (e.g., Lecture Notes - Week 1)"
              required
            />
          </div>

          {/* Description Section */}
          <div>
            <label htmlFor="material-description" className="block text-sm font-semibold text-gray-200 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="material-description"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white resize-none transition"
              placeholder="Brief description of the material..."
            />
          </div>

          {/* File Upload Section */}
          <div>
            <div className="block text-sm font-semibold text-gray-200 mb-2">
              📎 Upload File <span className="text-red-500">*</span>
            </div>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center bg-gray-800/50 hover:border-orange-500/50 transition">
              <Upload className="mx-auto text-gray-500 mb-3" size={32} />
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="material-file-upload"
                required
              />
              <label
                htmlFor="material-file-upload"
                className="cursor-pointer inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Choose File
              </label>
              <p className="mt-2 text-xs text-gray-400">
                PDF, DOC, PPT, images, videos, ZIP, Excel (Max 500MB)
              </p>
            </div>

            {/* Show selected file */}
            {formData.files && formData.files.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-400 font-medium mb-1">Selected File:</div>
                {formData.files.map((file, index) => (
                  <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText size={18} className="text-orange-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="flex-shrink-0 p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Tip */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <span className="font-semibold">💡 Tip:</span> Upload course materials like lecture notes, handouts, reference documents, or supplementary resources that students can download and access anytime.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={() => {
                if (!uploading) {
                  setIsModalOpen(false);
                  setFormData({});
                  setUploadProgress(0);
                }
              }}
              className={`flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition font-medium ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                'Upload Material'
              )}
            </button>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-200">Upload Progress</span>
                <span className="text-sm text-gray-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Please wait while your file is being uploaded. Do not close this window.
              </p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default ClassMaterialsTab;