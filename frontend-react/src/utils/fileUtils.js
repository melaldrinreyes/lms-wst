// File type utilities for displaying file information

/**
 * Get file extension from a file path
 * @param {string} filePath - The file path
 * @returns {string} - The file extension in lowercase
 */
export const getFileExtension = (filePath) => {
  if (!filePath) return '';
  const parts = filePath.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Get file type information including category and icon color
 * @param {string} filePath - The file path
 * @returns {object} - Object containing type, category, color, and icon info
 */
export const getFileTypeInfo = (filePath) => {
  const extension = getFileExtension(filePath);
  
  const fileTypes = {
    // Cisco Packet Tracer
    'pkt': { category: 'Packet Tracer File', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', icon: '🖧' },
    // Documents
    'pdf': { category: 'PDF Document', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', icon: '📄' },
    'doc': { category: 'Word Document', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', icon: '📝' },
    'docx': { category: 'Word Document', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', icon: '📝' },
    'txt': { category: 'Text File', color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/20', icon: '📃' },
    
    // Presentations
    'ppt': { category: 'PowerPoint', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', icon: '📊' },
    'pptx': { category: 'PowerPoint', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', icon: '📊' },
    
    // Spreadsheets
    'xls': { category: 'Excel Spreadsheet', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', icon: '📈' },
    'xlsx': { category: 'Excel Spreadsheet', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', icon: '📈' },
    
    // Videos
    'mp4': { category: 'MP4 Video', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: '🎥' },
    'mov': { category: 'MOV Video', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: '🎥' },
    'avi': { category: 'AVI Video', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: '🎥' },
    'mkv': { category: 'MKV Video', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: '🎥' },
    'webm': { category: 'WebM Video', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: '🎥' },
    'flv': { category: 'FLV Video', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: '🎥' },
    'wmv': { category: 'WMV Video', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: '🎥' },
    
    // Images
    'jpg': { category: 'JPEG Image', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20', icon: '🖼️' },
    'jpeg': { category: 'JPEG Image', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20', icon: '🖼️' },
    'png': { category: 'PNG Image', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20', icon: '🖼️' },
    'gif': { category: 'GIF Image', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20', icon: '🖼️' },
    'svg': { category: 'SVG Image', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20', icon: '🖼️' },
    
    // Archives
    'zip': { category: 'ZIP Archive', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', icon: '📦' },
    'rar': { category: 'RAR Archive', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', icon: '📦' },
    '7z': { category: '7Z Archive', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', icon: '📦' },
  };
  
  return fileTypes[extension] || { 
    category: extension ? `${extension.toUpperCase()} File` : 'Unknown File', 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-500/10', 
    borderColor: 'border-gray-500/20',
    icon: '📎' 
  };
};

/**
 * Get human-readable file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file name from path
 * @param {string} filePath - The file path
 * @returns {string} - Just the filename
 */
export const getFileName = (filePath) => {
  if (!filePath) return '';
  return filePath.split('/').pop();
};

/**
 * Check if file is a video
 * @param {string} filePath - The file path
 * @returns {boolean} - True if file is a video
 */
export const isVideo = (filePath) => {
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
  return videoExtensions.includes(getFileExtension(filePath));
};

/**
 * Check if file is an image
 * @param {string} filePath - The file path
 * @returns {boolean} - True if file is an image
 */
export const isImage = (filePath) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
  return imageExtensions.includes(getFileExtension(filePath));
};

/**
 * Check if file is a document
 * @param {string} filePath - The file path
 * @returns {boolean} - True if file is a document
 */
export const isDocument = (filePath) => {
  const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'];
  return docExtensions.includes(getFileExtension(filePath));
};
