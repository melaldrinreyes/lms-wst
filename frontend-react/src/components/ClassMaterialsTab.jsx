import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Upload, Download, Trash2 } from 'lucide-react';
import { classMaterialAPI } from '../services/api';
import Modal from './ui/Modal';
import Toast from './ui/Toast';
import Swal from 'sweetalert2';
import Skeleton from './ui/Skeleton';

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
      return { icon: '📄', category: 'File', color: 'text-[#718096]', bgColor: 'bg-white/20', borderColor: 'border-gray-700' };
    }

    const extension = filePath.split('.').pop().toLowerCase();

    const fileTypes = {
      // Documents
      pdf: { icon: '📄', category: 'PDF Document', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },
      doc: { icon: '📝', category: 'Word Document', color: 'text-[#ff9f66]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      docx: { icon: '📝', category: 'Word Document', color: 'text-[#ff9f66]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      ppt: { icon: '📊', category: 'PowerPoint', color: 'text-[#FF4C60]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      pptx: { icon: '📊', category: 'PowerPoint', color: 'text-[#FF4C60]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
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
      txt: { icon: '📄', category: 'Text File', color: 'text-[#718096]', bgColor: 'bg-white/20', borderColor: 'border-gray-700' },
    };

    return fileTypes[extension] || { icon: '📄', category: 'File', color: 'text-[#718096]', bgColor: 'bg-white/20', borderColor: 'border-gray-700' };
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-white rounded-xl border border-gray-800 p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Class Materials</h2>
          <p className="text-[#718096] text-sm">Upload and manage course materials for {courseName}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 rounded-xl hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all shadow-lg shadow-[#FF4C60]/30 font-semibold"
        >
          <Plus size={20} />
          Upload Material
        </button>
      </div>

      <div className="space-y-4">
        {classMaterials.length === 0 ? (
          <div className="bg-white dark:bg-white border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-[#718096]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No materials uploaded yet</h3>
            <p className="text-[#718096] mb-6 max-w-md mx-auto">
              Upload course materials like lecture notes, handouts, or reference documents for your students.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF4C60] hover:bg-[#ff3451] text-gray-900 rounded-xl transition font-semibold"
            >
              <Plus size={20} />
              Upload First Material
            </button>
          </div>
        ) : (
          classMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-white dark:bg-white border border-gray-800 rounded-xl p-6 hover:border-[#ff6b6b]/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#FF4C60] transition">
                    {material.title}
                  </h3>
                  <p className="text-sm text-[#718096] mb-4">
                    {material.description || 'No description provided'}
                  </p>
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${getFileTypeInfo(material.file_path).bgColor} ${getFileTypeInfo(material.file_path).borderColor} mb-4`}>
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
                    <div className="flex items-center gap-2 text-[#4a5568]">
                      <Upload size={16} className="text-[#ff9f66]" />
                      <span className="font-medium">Uploaded:</span> {new Date(material.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-[#4a5568]">
                      <FileText size={16} className="text-green-400" />
                      <span className="font-medium">Size:</span> {(material.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDownloadClassMaterial(material.id)}
                    className="p-2.5 text-[#ff9f66] hover:bg-[#FF4C60] 900/30 hover:text-[#FF4C60] 300 border border-transparent hover:border-[#FF4C60]/20 rounded-xl transition-all"
                    title="Download material"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClassMaterial(material.id, material.title)}
                    className="p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
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
            <label htmlFor="material-title" className="block text-sm font-semibold text-[#2c3e50] mb-2">
              Material Title <span className="text-red-500">*</span>
            </label>
            <input
              id="material-title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-white rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] text-gray-900 transition"
              placeholder="Enter material title (e.g., Lecture Notes - Week 1)"
              required
            />
          </div>

          {/* Description Section */}
          <div>
            <label htmlFor="material-description" className="block text-sm font-semibold text-[#2c3e50] mb-2">
              Description (Optional)
            </label>
            <textarea
              id="material-description"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-white rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] text-gray-900 resize-none transition"
              placeholder="Brief description of the material..."
            />
          </div>

          {/* File Upload Section */}
          <div>
            <div className="block text-sm font-semibold text-[#2c3e50] mb-2">
              📎 Upload File <span className="text-red-500">*</span>
            </div>
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center bg-white/50 hover:border-[#ff6b6b]/50 transition">
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
                className="cursor-pointer inline-block px-4 py-2 bg-white hover:bg-white text-gray-900 rounded-xl transition"
              >
                Choose File
              </label>
              <p className="mt-2 text-xs text-[#718096]">
                PDF, DOC, PPT, images, videos, ZIP, Excel (Max 500MB)
              </p>
            </div>

            {/* Show selected file */}
            {formData.files && formData.files.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-[#718096] font-medium mb-1">Selected File:</div>
                {formData.files.map((file, index) => (
                  <div key={index} className="bg-white border border-gray-700 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText size={18} className="text-[#FF4C60] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-[#718096]">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="flex-shrink-0 p-2 text-red-400 hover:bg-red-900/20 rounded-xl transition"
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
          <div className="bg-[#FF4C60] 900/20 border border-[#FF4C60] 800 rounded-xl p-4">
            <p className="text-sm text-[#FF4C60] 300">
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
              className={`flex-1 px-6 py-3 border border-gray-700 text-[#4a5568] rounded-xl hover:bg-white transition font-medium ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#ff5252] text-gray-900 rounded-xl hover:bg-[#ff4444] transition font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <span className="text-sm font-medium text-[#2c3e50]">Upload Progress</span>
                <span className="text-sm text-[#718096]">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-3">
                <div
                  className="bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#718096] mt-2">
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