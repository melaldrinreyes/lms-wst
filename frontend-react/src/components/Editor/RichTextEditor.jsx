import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell } from '@tiptap/extension-table';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Youtube from '@tiptap/extension-youtube';
import { useState } from 'react';
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
} from 'lucide-react';
import './RichTextEditor.css';

export default function RichTextEditor({ value = '', onChange }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [textColor, setTextColor] = useState('#ffffff');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          openOnClick: false,
        },
      }),
      Image.configure({
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TextStyle,
      Color,
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = prompt('Enter URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
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
        editor.chain().focus().setYoutube({ src: `https://www.youtube.com/embed/${videoId}` }).run();
        setVideoUrl('');
        setShowVideoModal(false);
      } else {
        alert('Invalid YouTube URL');
      }
    }
  };

  const setColor = (color) => {
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className="rich-text-editor">
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
            title="Add Image"
          >
            <ImageIcon size={18} />
          </button>
          <button
            onClick={() => setShowVideoModal(true)}
            className="toolbar-btn"
            title="Add YouTube Video"
          >
            <Film size={18} />
          </button>
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

      {/* Editor */}
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
