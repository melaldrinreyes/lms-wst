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
import * as pdfjsLib from 'pdfjs-dist';
import { useState, useRef, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
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
  FileText,
} from 'lucide-react';
import './RichTextEditor.css';
import { toast } from 'react-toastify';

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
          // Handle PDFs
          if (item.type === 'application/pdf') {
            event.preventDefault();
            const file = item.getAsFile();
            handlePdfFile(file);
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
          } else if (file.type === 'application/pdf') {
            handlePdfFile(file);
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

  // Move hooks to the top of the component
  const [localPendingFiles, setLocalPendingFiles] = useState(pendingFiles || []);

  // Sync localPendingFiles with prop
  useEffect(() => {
    setLocalPendingFiles(pendingFiles);
  }, [pendingFiles]);

  // Helper to update both local and parent
  const updatePendingFiles = useCallback((files) => {
    setLocalPendingFiles(files);
    if (onPendingFilesChange) onPendingFilesChange(files);
  }, [onPendingFilesChange]);

  const retryLastUpload = async () => {
    if (!lastUploadFile) return;
    setUploadError(null);
    const ok = await handleVideoFile(lastUploadFile);
    if (ok) setShowVideoDropzone(false);
  };

  // Generate a poster image from a File object using a canvas capture
  const generatePosterFromFile = async (file, seekTime = 0.5) => {
    if (!file) return null;
    const blobUrl = URL.createObjectURL(file);
    try {
      return await generatePosterFromUrl(blobUrl, seekTime, true);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };

  // Generate a poster image from a URL by drawing the first frame to canvas
  const generatePosterFromUrl = async (videoUrl, seekTime = 0.5, isBlobUrl = false) => {
    let shouldSetCrossOrigin = false;
    if (!isBlobUrl) {
      try {
        const videoOrigin = new URL(videoUrl, window.location.href).origin;
        const isSameOrigin = videoOrigin === window.location.origin;
        if (!isSameOrigin) {
          try {
            const head = await fetch(videoUrl, { method: 'HEAD' });
            if (head && head.ok) {
              const acao = head.headers.get('access-control-allow-origin');
              shouldSetCrossOrigin = !!acao;
            }
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }
    return new Promise((resolve) => {
      const video = document.createElement('video');
      if (shouldSetCrossOrigin) video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.muted = true;
      video.src = videoUrl;
      let done = false;
      const cleanup = () => {
        try { video.pause(); } catch { /* ignore */ }
        video.src = '';
        video.remove();
      };

      const attemptCapture = () => {
        try {
          const w = video.videoWidth || 640;
          const h = video.videoHeight || 360;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          done = true;
          cleanup();
          resolve(dataUrl);
        } catch (err) {
          console.warn('Failed to capture poster frame', err);
          cleanup();
          resolve(null);
        }
      };

      video.addEventListener('loadedmetadata', () => {
        try {
          if (video.duration && video.duration > seekTime) {
            video.currentTime = Math.min(seekTime, video.duration / 2);
          }
        } catch { /* ignore */ }
      });
      video.addEventListener('seeked', () => {
        if (!done) attemptCapture();
      });
      // fallback: if seeked not fired within 3s, try capture
      setTimeout(() => { if (!done) attemptCapture(); }, 3000);
      video.addEventListener('error', () => {
        cleanup();
        resolve(null);
      });
    });
  };

  // Utility: insert a video by URL and try to detect its aspect ratio before inserting
  const insertVideoByUrl = async (videoUrl, videoType = 'video/mp4', poster = null) => {
    const insertVideoNode = (width, height) => {
      const aspectRatio = (width && height) ? `${width}/${height}` : null;
      editor.chain().focus().insertContent({
        type: 'video',
        attrs: {
          src: videoUrl,
          type: videoType,
          controls: true,
          preload: 'metadata',
          playsinline: true,
          videoWidth: width || null,
          videoHeight: height || null,
          aspectRatio: aspectRatio,
          poster: poster || null,
        }
      }).run();
    };

    try {
      const tempVideo = document.createElement('video');
      // Only set crossOrigin if the resource appears to allow it; otherwise avoid CORS errors
      try {
        const videoOrigin = new URL(videoUrl, window.location.href).origin;
        const isSameOrigin = videoOrigin === window.location.origin;
        // If it's same-origin, quickly check availability with a HEAD request
        if (isSameOrigin) {
          try {
            const headCheck = await fetch(videoUrl, { method: 'HEAD' });
            if (headCheck && !headCheck.ok) {
              console.warn('Video is not available (HEAD status):', headCheck.status);
              insertVideoNode(16, 9);
              return;
            }
          } catch { /* ignore — allow metadata flow to attempt */ }
        }
        let canUseCrossOrigin = false;
        if (!isSameOrigin) {
          try {
            const head = await fetch(videoUrl, { method: 'HEAD' });
            if (head && head.ok) {
              const acao = head.headers.get('access-control-allow-origin');
              canUseCrossOrigin = !!acao;
            }
          } catch {
            // HEAD failed — treat as non-CORS-friendly
            canUseCrossOrigin = false;
          }
        }
        if (!isSameOrigin && canUseCrossOrigin) {
          tempVideo.crossOrigin = 'anonymous';
        }
      } catch { /* noop - we can attempt without crossOrigin if we can't determine headers */ }
      tempVideo.preload = 'metadata';
      tempVideo.src = videoUrl;
      let metadataLoaded = false;
      const cleanupTemp = () => {
        tempVideo.src = '';
        tempVideo.remove();
      };
      const fallbackInsert = () => {
        if (!metadataLoaded) {
          insertVideoNode(16, 9);
          cleanupTemp();
        }
      };
      tempVideo.addEventListener('loadedmetadata', () => {
        metadataLoaded = true;
        const w = tempVideo.videoWidth || 16;
        const h = tempVideo.videoHeight || 9;
        insertVideoNode(w, h);
        cleanupTemp();
      });
      tempVideo.addEventListener('error', (err) => {
        console.warn('Failed to load metadata for video at:', videoUrl, err);
        fallbackInsert();
      });
      // Safety timeout if metadata doesn't arrive
      setTimeout(() => fallbackInsert(), 4000);
    } catch (error) {
      console.error('Error detecting video dimensions:', error);
      insertVideoNode(16, 9);
    }
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
  }), [localPendingFiles, editor, isUploading, uploadProgress, updatePendingFiles]);

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
      // No poster upload for images

      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes for very large images
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      backendUrl = res.data.url;
      
      // poster_url returned for images isn't used here
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
    let posterUrl = null;
    // Generate a poster from the local file before upload, if possible
    let posterData = null;
    try {
      posterData = await generatePosterFromFile(file);
    } catch (err) {
      console.warn('Failed to generate poster from file', err);
      posterData = null;
    }

    try {
      // Attach poster blob (if we generated one) to the upload form to persist on the backend
      if (posterData) {
        try {
          const blob = await (await fetch(posterData)).blob();
          formData.append('poster', blob, 'poster.jpg');
        } catch (err) {
          console.warn('Failed to convert poster data URL to blob. Poster will not be uploaded.', err);
        }
      }
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes for large video uploads
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      backendUrl = res.data.url;
      posterUrl = res.data.poster_url || null;
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
    // Insert video using the Video extension node, but compute natural aspect ratio first
    console.log('Inserting video node with src:', backendUrl);
    // Helper insertion now handled by `insertVideoByUrl` to avoid duplicate logic

    // Insert video using aspect ratio detection helper and include poster if available
    await insertVideoByUrl(backendUrl, file.type, posterUrl || posterData);
    
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
        try { video.load(); } catch { /* ignore */ }
        
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
          console.log('Video loaded successfully:', video.src);
        });
        
        video.addEventListener('canplay', () => {
          console.log('Video can play:', video.src);
        });
        
        video.addEventListener('loadstart', () => {
          console.log('Video load started');
        });
        
        video.addEventListener('progress', () => {
          console.log('Video loading progress');
        });
      });
    }, 100);
  };

    // Watch for any video elements inside the editor and attach listeners and log their state
    useEffect(() => {
      const el = document.querySelector('.editor-content');
      if (!el) return;

      const attachToVideo = (video) => {
        if (video.__debugAttached) return;
        video.__debugAttached = true;

        const logState = (label) => {
          try {
            const comp = window.getComputedStyle(video);
            console.log(`[Video Debug] ${label}:`, {
              src: video.src,
              currentSrc: video.currentSrc,
              readyState: video.readyState,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              controls: video.controls,
              muted: video.muted,
              crossOrigin: video.crossOrigin,
              display: comp.display,
              width: comp.width,
              height: comp.height,
              transform: comp.transform,
              visibility: comp.visibility,
              opacity: comp.opacity,
              zIndex: comp.zIndex
            });
          } catch (err) {
            console.error('Failed to compute video state', err);
          }
        };

        ['loadedmetadata', 'loadeddata', 'canplay', 'play', 'error'].forEach(evt => {
          video.addEventListener(evt, (e) => {
            console.log(`[Video Debug] event ${evt}`, e);
            logState(`event ${evt}`);
          });
        });

        // Also try to force a repaint and ensure size
        setTimeout(() => {
          logState('initial');
          // Ensure wrapper has min-height to show visual area and not be zero
          const wrapper = video.closest('.video-wrapper');
          if (wrapper) {
            wrapper.style.minHeight = wrapper.style.minHeight || '200px';
            wrapper.style.zIndex = wrapper.style.zIndex || '1';
          }
          video.style.minHeight = video.style.minHeight || '200px';
          video.style.zIndex = video.style.zIndex || '2';
          // Force inline styles to avoid other CSS interfering
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = video.style.objectFit || 'cover';
          // Try to paint the first frame if available
          try { video.load(); } catch (err) { void err; }
        }, 50);
      };

      // Attach to existing videos
      const videos = el.querySelectorAll('video');
      videos.forEach(attachToVideo);

      // Observe for new video nodes being added
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.matches && node.matches('video')) attachToVideo(node);
            const vids = node.querySelectorAll && node.querySelectorAll('video');
            if (vids && vids.length) vids.forEach(attachToVideo);
          }
        }
      });
      observer.observe(el, { childList: true, subtree: true });

      return () => {
        observer.disconnect();
        // remove debug flag so we can reattach later if needed
        const allVids = el.querySelectorAll('video');
        allVids.forEach(v => { if (v.__debugAttached) delete v.__debugAttached; });
      };
    }, [editor]);

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
      toast.error('Failed to import Word document. Please try copying and pasting the content instead.');
    }
  };

  const handlePdfFile = async (file) => {
    if (!file || file.type !== 'application/pdf') return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Read the PDF file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      setUploadProgress(30);

      // Set up PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setUploadProgress(50);

      let fullText = '';
      const numPages = pdf.numPages;

      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
        setUploadProgress(50 + Math.round((pageNum / numPages) * 40)); // Progress from 50% to 90%
      }

      setUploadProgress(90);
      const htmlContent = convertTextToHtml(fullText);

      setUploadProgress(90);

      // Insert the HTML content into the editor
      if (htmlContent && htmlContent.trim()) {
        console.log('Inserting HTML content:', htmlContent);
        editor.chain().focus().insertContent(htmlContent).run();
        console.log('Editor content after insertion:', editor.getHTML());
        toast.success(`PDF content imported successfully! (${numPages} pages)`);
      } else {
        toast.warning('PDF appears to be empty or contains no extractable text.');
      }

      setUploadProgress(100);
      setIsUploading(false);

    } catch (error) {
      console.error('Error converting PDF:', error);
      toast.error('Failed to convert PDF. The file may be corrupted or password-protected.');

      // Fallback: offer to upload as file link instead
      const result = await Swal.fire({
        title: 'PDF Conversion Failed',
        text: 'Would you like to upload the PDF as a downloadable file instead?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#f97316',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Upload as File',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        // Upload as regular file
        await uploadPdfAsFile(file);
      }

      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to convert plain text to basic HTML
  const convertTextToHtml = (text) => {
    if (!text || !text.trim()) return '';

    // Split into lines and process each line
    const lines = text.split('\n').filter(line => line.trim());

    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1]?.trim() || '';

      // Check if this looks like a heading (short line followed by longer content)
      if (line.length < 50 && nextLine.length > line.length * 2 && !line.match(/^\d+\./) && !line.match(/^[•\-*]/)) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h2>${escapeHtml(line)}</h2>`;
        continue;
      }

      // Check for numbered lists
      if (line.match(/^\d+\./)) {
        if (!inList || html.endsWith('</ul>')) {
          if (inList) html += '</ul>';
          html += '<ol>';
          inList = true;
        }
        const content = line.replace(/^\d+\.\s*/, '');
        html += `<li>${escapeHtml(content)}</li>`;
        continue;
      }

      // Check for bullet lists
      if (line.match(/^[•\-*]/)) {
        if (!inList || html.endsWith('</ol>')) {
          if (inList) html += '</ol>';
          html += '<ul>';
          inList = true;
        }
        const content = line.replace(/^[•\-*]\s*/, '');
        html += `<li>${escapeHtml(content)}</li>`;
        continue;
      }

      // Regular paragraph
      if (line.length > 0) {
        if (inList) {
          html += '</ul></ol>';
          inList = false;
        }
        html += `<p>${escapeHtml(line)}</p>`;
      }
    }

    // Close any open lists
    if (inList) {
      html += '</ul></ol>';
    }

    return html;
  };

  // Helper function to escape HTML characters
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Fallback function to upload PDF as a file link
  const uploadPdfAsFile = async (file) => {
    setUploadError(null);
    setLastUploadFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    let backendUrl = '';

    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes for very large uploads
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      backendUrl = res.data.url;
      console.log('PDF uploaded successfully. URL:', backendUrl);

      // Insert a file card with thumbnail (poster) and link if available, otherwise insert a plain link
      const displayText = `📄 ${file.name}`;
      if (res.data?.poster_url) {
        const html = `<div class="file-card"><a href="${backendUrl}" target="_blank" rel="noopener noreferrer"><img src="${res.data.poster_url}" class="file-card-thumb" alt="${file.name}" /><div class="file-card-meta"><div class="file-card-title">${file.name}</div></div></a></div>`;
        editor.chain().focus().insertContent(html).run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: displayText,
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: backendUrl,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    },
                  },
                ],
              },
            ],
          })
          .run();
      }

      toast.success('PDF uploaded as downloadable file');
    } catch (e) {
      console.error('PDF upload error:', e);
      const msg = e.response?.data?.message || e.message || 'PDF upload failed';
      setUploadError(msg);
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(null);
      setLastUploadFile(null);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
      } else if (file.type.startsWith('video/')) {
        handleVideoFile(file);
      } else if (file.type === 'application/pdf') {
        handlePdfFile(file);
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
      } else if (file.type === 'application/pdf') {
        handlePdfFile(file);
      } else if (file.name.endsWith('.docx')) {
        handleWordFile(file);
      }
    });
  };

  const addLink = () => {
    (async () => {
      const { value: url } = await Swal.fire({
        title: 'Enter URL',
        input: 'url',
        inputPlaceholder: 'https://example.com',
        showCancelButton: true,
        confirmButtonColor: '#f97316',
        inputValidator: (value) => {
          if (!value) return 'Please enter a URL';
          return null;
        }
      });
      if (url && url.trim()) {
        let finalUrl = url.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = 'https://' + finalUrl;
        }

        if (!editor.state.selection.empty) {
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: finalUrl })
            .run();
        } else {
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
    })();
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const addImageFromUrl = () => {
    (async () => {
      const { value: url } = await Swal.fire({
        title: 'Enter image URL',
        input: 'url',
        inputPlaceholder: 'https://example.com/image.jpg',
        showCancelButton: true,
        confirmButtonColor: '#f97316',
        inputValidator: (value) => {
          if (!value) return 'Please enter an image URL';
          return null;
        }
      });
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    })();
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
        toast.error('Invalid YouTube URL');
      }
    }
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
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf';
              input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) handlePdfFile(file);
              };
              input.click();
            }}
            className="toolbar-btn"
            title="Upload PDF (convert to editable text)"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={() => setShowVideoDropzone(true)}
            className="toolbar-btn"
            title="Upload Video (drag & drop)"
          >
            <Film size={18} />
          </button>
                {/* Video Drag-and-Drop Modal */}
                {showVideoDropzone && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
                    <div className="modal-panel modal-panel--md bg-gray-900 rounded-lg p-6 w-full mx-4 border border-gray-700">
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
          <div className="modal-panel modal-panel--md bg-gray-900 rounded-lg p-6 w-full mx-4 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Add YouTube Video</h3>
            <input
              type="text"
              placeholder="Paste YouTube URL (e.g., https://youtu.be/dQw4w9WgXcQ)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
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
              <p className="text-sm text-gray-400">Images, Videos (MP4/WebM), PDFs, Word (.docx)</p>
            </div>
          </div>
        )}
        <EditorContent editor={editor} className="editor-content" />
      </div>
    </div>
  );
});
export default RichTextEditor;
