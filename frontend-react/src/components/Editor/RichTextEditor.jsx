import { useEditor, EditorContent } from '@tiptap/react';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Youtube from '@tiptap/extension-youtube';
import { Video } from './VideoExtension';
import mammoth from 'mammoth';
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  Link as LinkIcon,
  Quote,
  Code,
  ImageIcon,
  Table as TableIcon,
  Film,
  Palette,
  Upload,
} from 'lucide-react';
import './RichTextEditor.css';

function VideoDropzone({ onVideoDrop }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/*': [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onVideoDrop(acceptedFiles[0]);
      }
    },
  });
  return (
    <div {...getRootProps()} style={{
      border: '2px dashed #888', padding: 20, textAlign: 'center', borderRadius: 8, background: '#222', color: '#fff', marginBottom: 16
    }}>
      <input {...getInputProps()} />
      {isDragActive
        ? <p>Drop the video here ...</p>
        : <p>Drag & drop a video here, or click to select</p>
      }
    </div>
  );
}

const RichTextEditor = forwardRef(function RichTextEditor({ value = '', onChange, pendingFiles = [], onPendingFilesChange }, ref) {
  const [videoUrl, setVideoUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showVideoDropzone, setShowVideoDropzone] = useState(false);
  const [textColor, setTextColor] = useState('#ffffff');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [lastUploadFile, setLastUploadFile] = useState(null);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false, // Disable built-in link to avoid duplicate
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'link-class',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        allowBase64: true,
        inline: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Video,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onPaste: (view, event) => {
      const items = event.clipboardData?.items;
      // Handle HTML content (from Word, etc.)
      const htmlData = event.clipboardData?.getData('text/html');
      if (htmlData && htmlData.trim()) {
        // Let TipTap handle HTML paste naturally
        return false;
      }
      // Handle pasted files (images, videos)
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          // Handle images
          if (item.type.indexOf('image') !== -1) {
            event.preventDefault();
            const file = item.getAsFile();
            handleImageFile(file);
            return true;
          }
          // Handle videos
          if (item.type.indexOf('video') !== -1) {
            event.preventDefault();
            const file = item.getAsFile();
            handleVideoFile(file);
            return true;
          }
        }
      }
      return false;
    },
    onDrop: (view, event, slice, moved) => {
      // Handle dropped files
      if (!moved && event.dataTransfer?.files?.length) {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        files.forEach(file => {
          if (file.type.startsWith('image/')) {
            handleImageFile(file);
          } else if (file.type.startsWith('video/')) {
            handleVideoFile(file);
          } else if (file.name.endsWith('.docx')) {
            handleWordFile(file);
          }
        });
        return true;
      }
      return false;
    },
  });

  // Update editor content if value prop changes (after save)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  // Store local files for later upload, sync with prop
  const [localPendingFiles, setLocalPendingFiles] = useState(pendingFiles);

  // Sync localPendingFiles with prop
  useEffect(() => {
    setLocalPendingFiles(pendingFiles);
  }, [pendingFiles]);

  // Helper to update both local and parent
  const updatePendingFiles = (files) => {
    setLocalPendingFiles(files);
    if (onPendingFilesChange) onPendingFilesChange(files);
  };

  const retryLastUpload = async () => {
    if (!lastUploadFile) return;
    setUploadError(null);
    const ok = await handleVideoFile(lastUploadFile);
    if (ok) setShowVideoDropzone(false);
  };

  // Expose pendingFiles and a clear function to parent via ref
  useImperativeHandle(ref, () => ({
    getPendingFiles: () => localPendingFiles,
    clearPendingFiles: () => updatePendingFiles([]),
    setContent: (html) => {
      if (editor) {
        editor.commands.setContent(html || '', false);
      }
    },
    isUploading,
    uploadProgress,
  }), [localPendingFiles, editor, isUploading, uploadProgress]);

  const handleImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      return;
    }
    setUploadError(null);
    setLastUploadFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    let backendUrl = '';
    try {
      const res = await api.post('/modules/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes for very large images
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      backendUrl = res.data.url;
    } catch (e) {
      console.error('Image upload error:', e);
      const msg = e.response?.data?.message || e.message || 'Image upload failed';
      setUploadError(msg);
      setIsUploading(false);
      setUploadProgress(0);
      return false;
    }
    if (!backendUrl) {
      const msg = 'Image upload failed. No URL returned.';
      setUploadError(msg);
      setIsUploading(false);
      setUploadProgress(0);
      return false;
    }
    editor.chain().focus().setImage({ src: backendUrl }).run();
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setLastUploadFile(null);
    return true;
  };

  const handleVideoFile = async (file) => {
    if (!file || !file.type.startsWith('video/')) {
      return;
    }
    setUploadError(null);
    setLastUploadFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    let backendUrl = '';
    try {
      const res = await api.post('/modules/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes for large video uploads
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      backendUrl = res.data.url;
      console.log('Video uploaded successfully. URL:', backendUrl);
      console.log('Video file type:', file.type);
      console.log('Video file size:', file.size);
      console.log('Backend response:', res.data);
    } catch (e) {
      console.error('Video upload error:', e);
      const msg = e.response?.data?.message || e.message || 'Video upload failed';
      setUploadError(msg);
      setIsUploading(false);
      setUploadProgress(0);
      return false;
    }
    if (!backendUrl) {
      const msg = 'Video upload failed. No URL returned.';
      setUploadError(msg);
      setIsUploading(false);
      setUploadProgress(0);
      return false;
    }
    // Insert video using the Video extension node
    console.log('Inserting video node with src:', backendUrl);
    editor.chain().focus().insertContent({
      type: 'video',
      attrs: {
        src: backendUrl,
        type: file.type || 'video/mp4',
        controls: true,
        preload: 'metadata',
        playsinline: true,
        style: 'width: 100%; max-width: 100%; height: auto; min-height: 200px; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 4px 24px rgba(0,0,0,0.25); display: block; background: #000; border: 2px solid #4b5563;'
      }
    }).run();
    
    // Also log the current editor content
    setTimeout(() => {
      console.log('Editor HTML after insertion:', editor.getHTML());
      
      // Check if video element exists in DOM
      setTimeout(() => {
        const editorElement = document.querySelector('.editor-content');
        if (editorElement) {
          const videos = editorElement.querySelectorAll('video');
          console.log('Video elements found in DOM:', videos.length);
          videos.forEach((video, index) => {
            console.log(`Video ${index}:`, {
              src: video.src,
              controls: video.controls,
              style: video.style.cssText,
              error: video.error
            });
          });
        }
      }, 200);
    }, 100);
    
    // Also log the current editor content
    setTimeout(() => {
      console.log('Editor HTML after insertion:', editor.getHTML());
      
      // Check if video element exists in DOM
      setTimeout(() => {
        const editorElement = document.querySelector('.editor-content');
        if (editorElement) {
          const videos = editorElement.querySelectorAll('video');
          console.log('Video elements found in DOM:', videos.length);
          videos.forEach((video, index) => {
            console.log(`Video ${index}:`, {
              src: video.src,
              controls: video.controls,
              style: video.style.cssText
            });
          });
        }
      }, 200);
    }, 100);
    
    // Add a small delay to ensure the video element is rendered, then check for errors
    setTimeout(() => {
      const videoElements = document.querySelectorAll('.editor-content video');
      console.log('Video elements found after insertion:', videoElements.length);
      
      videoElements.forEach((video, index) => {
        console.log(`Video ${index} details:`, {
          src: video.src,
          currentSrc: video.currentSrc,
          readyState: video.readyState,
          networkState: video.networkState,
          error: video.error
        });

        // Try to load the video manually
        video.load();
        
        video.addEventListener('error', (e) => {
          console.error('Video playback error:', e);
          console.error('Video src:', video.src);
          console.error('Video error code:', video.error?.code);
          console.error('Video error message:', video.error?.message);
          
          // Try to fetch the video URL to see if it's accessible
          fetch(video.src, { method: 'HEAD' })
            .then(response => {
              console.log('Video URL response:', {
                status: response.status,
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
              });
            })
            .catch(err => {
              console.error('Failed to fetch video URL:', err);
            });
        });
        
        video.addEventListener('loadeddata', () => {
          console.log('Video loaded successfully:', backendUrl);
        });
        
        video.addEventListener('canplay', () => {
          console.log('Video can play:', backendUrl);
        });
        
        video.addEventListener('loadstart', () => {
          console.log('Video load started');
        });
        
        video.addEventListener('progress', () => {
          console.log('Video loading progress');
        });
      });
    }, 100);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setLastUploadFile(null);
    return true;
  };

  const handleWordFile = async (file) => {
    if (!file || !file.name.endsWith('.docx')) {
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      
      if (html && html.trim()) {
        editor.chain().focus().insertContent(html).run();
      }
    } catch (error) {
      console.error('Error converting Word document:', error);
      alert('Failed to import Word document. Please try copying and pasting the content instead.');
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
      } else if (file.type.startsWith('video/')) {
        handleVideoFile(file);
      } else if (file.name.endsWith('.docx')) {
        handleWordFile(file);
      }
    });
    // Reset input
    event.target.value = '';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
      } else if (file.type.startsWith('video/')) {
        handleVideoFile(file);
      } else if (file.name.endsWith('.docx')) {
        handleWordFile(file);
      }
    });
  };

  const addLink = () => {
    const url = prompt('Enter URL (e.g., https://example.com)');
    if (url && url.trim()) {
      // Ensure URL has protocol
      let finalUrl = url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      
      // If text is selected, apply link to selection
      if (!editor.state.selection.empty) {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: finalUrl })
          .run();
      } else {
        // If no text selected, insert URL as text
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: url,
            marks: [
              {
                type: 'link',
                attrs: {
                  href: finalUrl,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                },
              },
            ],
          })
          .run();
      }
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const addImageFromUrl = () => {
    const url = prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const addYoutubeVideo = () => {
    if (videoUrl) {
      // Extract video ID from various YouTube URL formats
      let videoId = videoUrl;
      
      // Format: https://youtu.be/dQw4w9WgXcQ
      if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
      }
      // Format: https://www.youtube.com/watch?v=dQw4w9WgXcQ
      else if (videoUrl.includes('youtube.com')) {
        videoId = new URL(videoUrl).searchParams.get('v');
      }

      if (videoId) {
        editor.chain().focus().setYoutubeVideo({ src: `https://www.youtube.com/embed/${videoId}` }).run();
        setVideoUrl('');
        setShowVideoModal(false);
      } else {
        alert('Invalid YouTube URL');
      }
    }
  };

  const addTestVideo = () => {
    // Insert a test video from a public URL to check if video elements work
    console.log('Adding test video using Video node');
    editor.chain().focus().insertContent({
      type: 'video',
      attrs: {
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        type: 'video/mp4',
        controls: true,
        preload: 'metadata',
        playsinline: true,
        style: 'width: 100%; max-width: 100%; height: auto; min-height: 200px; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 4px 24px rgba(0,0,0,0.25); display: block; background: #000; border: 2px solid #4b5563;'
      }
    }).run();
  };

  const setColor = (color) => {
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className="rich-text-editor" style={{ position: 'relative' }}>
      {isUploading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: '#222', color: '#fff', padding: 8, textAlign: 'center' }}>
          <span>Uploading... {uploadProgress}%</span>
          <div style={{ height: 6, background: '#444', borderRadius: 3, marginTop: 4 }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#f90', borderRadius: 3, transition: 'width 0.2s' }} />
          </div>
        </div>
      )}
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
            title="Code Block"
          >
            <Code size={18} />
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
            title="Ordered List"
          >
            <ListOrdered size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
            title="Blockquote"
          >
            <Quote size={18} />
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            onClick={addLink}
            className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
            title="Add Link"
          >
            <LinkIcon size={18} />
          </button>
          <button
            onClick={addImage}
            className="toolbar-btn"
            title="Upload Image (or drag & drop)"
          >
            <Upload size={18} />
          </button>
          <button
            onClick={addImageFromUrl}
            className="toolbar-btn"
            title="Add Image from URL"
          >
            <ImageIcon size={18} />
          </button>
          <button
            onClick={() => setShowVideoDropzone(true)}
            className="toolbar-btn"
            title="Upload Video (drag & drop)"
          >
            <Film size={18} />
          </button>
          <button
            onClick={addTestVideo}
            className="toolbar-btn"
            title="Add Test Video"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            🎥
          </button>
                {/* Video Drag-and-Drop Modal */}
                {showVideoDropzone && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
                      <h3 className="text-lg font-bold text-white mb-4">Upload Video</h3>
                      <VideoDropzone onVideoDrop={async (file) => {
                        setUploadError(null);
                        setLastUploadFile(file);
                        const ok = await handleVideoFile(file);
                        if (ok) setShowVideoDropzone(false);
                      }} />
                      {uploadError && (
                        <div className="mt-4 text-sm text-red-400">
                          <div>Upload failed: {String(uploadError)}</div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={retryLastUpload}
                              className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                            >
                              Retry
                            </button>
                            <button
                              onClick={() => { setShowVideoDropzone(false); setUploadError(null); setLastUploadFile(null); }}
                              className="px-3 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {!uploadError && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowVideoDropzone(false)}
                            className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
          <button
            onClick={addTable}
            className="toolbar-btn"
            title="Add Table"
          >
            <TableIcon size={18} />
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-gray-400" />
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                setColor(e.target.value);
              }}
              className="h-8 w-12 cursor-pointer rounded"
              title="Text Color"
            />
          </div>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="toolbar-btn"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="toolbar-btn"
            title="Redo"
          >
            <Redo size={18} />
          </button>
        </div>
      </div>

      {/* YouTube Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Add YouTube Video</h3>
            <input
              type="text"
              placeholder="Paste YouTube URL (e.g., https://youtu.be/dQw4w9WgXcQ)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && addYoutubeVideo()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowVideoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={addYoutubeVideo}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Add Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Editor Container with Drag & Drop */}
      <div
        className={`editor-container ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="drag-overlay">
            <div className="drag-overlay-content">
              <Upload size={48} className="mb-2" />
              <p className="text-lg font-semibold">Drop files here</p>
              <p className="text-sm text-gray-400">Images, Videos (MP4/WebM), Word (.docx)</p>
            </div>
          </div>
        )}
        <EditorContent editor={editor} className="editor-content" />
      </div>
    </div>
  );
});
export default RichTextEditor;
