import { useState, useEffect, useCallback } from 'react';
import { Download, FileText, Image, Video, Archive, File, AlertCircle, Loader2 } from 'lucide-react';
import { classMaterialAPI } from '../services/api';
import Toast from './ui/Toast';

function StudentClassMaterialsTab({ courseId }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await classMaterialAPI.getByCourse(courseId);
      if (response.success) {
        setMaterials(response.materials || []);
      }
    } catch (error) {
      console.error('Error fetching class materials:', error);
      setToast({ message: 'Failed to load class materials', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const getFileTypeInfo = (filePath) => {
    if (!filePath) {
      return { icon: '📄', category: 'File', color: 'text-[#718096]', bgColor: 'bg-white/20', borderColor: 'border-gray-700' };
    }

    const extension = filePath.split('.').pop().toLowerCase();

    const fileTypes = {
      // Images
      'jpg': { icon: '🖼️', category: 'Image', color: 'text-[#ff9f66]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      'jpeg': { icon: '🖼️', category: 'Image', color: 'text-[#ff9f66]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      'png': { icon: '🖼️', category: 'Image', color: 'text-[#ff9f66]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      'gif': { icon: '🖼️', category: 'Image', color: 'text-[#ff9f66]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      'webp': { icon: '🖼️', category: 'Image', color: 'text-[#ff9f66]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      'svg': { icon: '🖼️', category: 'Image', color: 'text-[#ff9f66]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },

      // Videos
      'mp4': { icon: '🎥', category: 'Video', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },
      'avi': { icon: '🎥', category: 'Video', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },
      'mov': { icon: '🎥', category: 'Video', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },
      'wmv': { icon: '🎥', category: 'Video', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },
      'flv': { icon: '🎥', category: 'Video', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },
      'mkv': { icon: '🎥', category: 'Video', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },
      'webm': { icon: '🎥', category: 'Video', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },

      // Documents
      'pdf': { icon: '📕', category: 'Document', color: 'text-red-500', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' },
      'doc': { icon: '📄', category: 'Document', color: 'text-[#FF4C60]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      'docx': { icon: '📄', category: 'Document', color: 'text-[#FF4C60]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      'txt': { icon: '📄', category: 'Document', color: 'text-[#718096]', bgColor: 'bg-white/20', borderColor: 'border-gray-700' },
      'rtf': { icon: '📄', category: 'Document', color: 'text-[#718096]', bgColor: 'bg-white/20', borderColor: 'border-gray-700' },

      // Spreadsheets
      'xls': { icon: '📊', category: 'Spreadsheet', color: 'text-green-500', bgColor: 'bg-green-900/20', borderColor: 'border-green-700' },
      'xlsx': { icon: '📊', category: 'Spreadsheet', color: 'text-green-500', bgColor: 'bg-green-900/20', borderColor: 'border-green-700' },
      'csv': { icon: '📊', category: 'Spreadsheet', color: 'text-green-500', bgColor: 'bg-green-900/20', borderColor: 'border-green-700' },

      // Presentations
      'ppt': { icon: '📽️', category: 'Presentation', color: 'text-[#FF4C60]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },
      'pptx': { icon: '📽️', category: 'Presentation', color: 'text-[#FF4C60]', bgColor: 'bg-[#FF4C60] 900/20', borderColor: 'border-[#ff5252]' },

      // Archives
      'zip': { icon: '📦', category: 'Archive', color: 'text-yellow-500', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'rar': { icon: '📦', category: 'Archive', color: 'text-yellow-500', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      '7z': { icon: '📦', category: 'Archive', color: 'text-yellow-500', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'tar': { icon: '📦', category: 'Archive', color: 'text-yellow-500', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'gz': { icon: '📦', category: 'Archive', color: 'text-yellow-500', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },

      // Code files
      'js': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'jsx': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'ts': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'tsx': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'html': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'css': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'php': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'py': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'java': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'cpp': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'c': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'json': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
      'xml': { icon: '💻', category: 'Code', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' },
    };

    return fileTypes[extension] || { icon: '📄', category: 'File', color: 'text-[#718096]', bgColor: 'bg-white/20', borderColor: 'border-gray-700' };
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (material) => {
    try {
      await classMaterialAPI.download(material.id);
      setToast({ message: 'File downloaded successfully', type: 'success' });
    } catch (error) {
      console.error('Error downloading file:', error);
      setToast({ message: 'Failed to download file', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF4C60] mx-auto mb-4" />
          <p className="text-[#718096]">Loading class materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
        <div className="w-10 h-10 bg-[#FF4C60]/100/20 rounded-xl flex items-center justify-center">
          <FileText size={20} className="text-[#ff9f66]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1d2026]">Class Materials</h3>
          <p className="text-sm text-[#718096]">Download course materials uploaded by your instructor</p>
        </div>
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="bg-white dark:bg-white border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-10 w-10 text-[#718096]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Materials Yet</h3>
          <p className="text-[#718096]">
            Your instructor hasn't uploaded any class materials for this course yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {materials.map((material) => {
            const fileInfo = getFileTypeInfo(material.file_path);
            return (
              <div
                key={material.id}
                className="bg-white dark:bg-white border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* File Icon */}
                      <div className={`w-12 h-12 ${fileInfo.bgColor} border ${fileInfo.borderColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <span className="text-2xl">{fileInfo.icon}</span>
                      </div>

                      {/* File Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {material.original_name || (material.file_path ? material.file_path.split('/').pop() : 'Unknown file')}
                        </h4>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#718096] mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${fileInfo.bgColor} ${fileInfo.color} border ${fileInfo.borderColor}`}>
                            {fileInfo.category}
                          </span>
                          {material.file_size && (
                            <span className="flex items-center gap-1">
                              <FileText size={12} />
                              {formatFileSize(material.file_size)}
                            </span>
                          )}
                          {material.created_at && (
                            <span className="flex items-center gap-1">
                              <span>Uploaded {formatDate(material.created_at)}</span>
                            </span>
                          )}
                        </div>

                        {material.description && (
                          <p className="text-sm text-[#4a5568] leading-relaxed">
                            {material.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleDownload(material)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF4C60] hover:bg-[#ff3451] text-gray-900 rounded-xl transition font-medium"
                        title="Download file"
                      >
                        <Download size={16} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default StudentClassMaterialsTab;