import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Youtube from '@tiptap/extension-youtube';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useState, useImperativeHandle, forwardRef, useCallback, useRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Quote, Minus, Undo, Redo, Link as LinkIcon, ImageIcon, Film, Table as TableIcon,
  Palette, FileUp, Trash2, CheckSquare, Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  Highlighter, X
} from 'lucide-react';
import './EnhancedWYSIWYG.css';

const lowlight = createLowlight(common);

const EnhancedWYSIWYG = forwardRef(({ initialValue = '', onChange, onFilesPending }, ref) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        codeBlock: false
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Subscript,
      Superscript,
      Highlight.configure({
        multicolor: true
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-800 rounded-lg p-4 text-sm font-mono my-4'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-700'
        }
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 w-full my-4'
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 border border-gray-300'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-3 py-2'
        }
      }),
      TextStyle,
      Color,
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'mx-auto rounded-lg my-4'
        }
      })
    ],
    content: initialValue,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none min-h-[500px] focus:outline-none px-6 py-4'
      }
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    }
  });

  useImperativeHandle(ref, () => ({
    setContent: (content) => {
      if (editor) {
        editor.commands.setContent(content);
      }
    },
    getContent: () => {
      return editor ? editor.getHTML() : '';
    },
    getPendingFiles: () => {
      return [];
    },
    clearPendingFiles: () => {
      // For compatibility
    }
  }));

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  }, [editor, imageUrl]);

  const addVideo = useCallback(() => {
    if (videoUrl && editor) {
      editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run();
      setVideoUrl('');
      setShowVideoInput(false);
    }
  }, [editor, videoUrl]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) {
        editor.chain().focus().setImage({ src: url }).run();
        if (onFilesPending) {
          onFilesPending([file]);
        }
      }
    }
  }, [editor, onFilesPending]);

  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6',
    '#DC2626', '#EA580C', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
  ];

  if (!editor) {
    return <div className="flex items-center justify-center h-64 bg-gray-50 text-gray-400">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar - NetAcad Style */}
      <div className="bg-white border-b border-gray-200 p-2 flex flex-wrap gap-1 items-center">
        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('underline') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('strike') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded hover:bg-gray-100 transition-colors text-sm font-semibold ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded hover:bg-gray-100 transition-colors text-sm font-semibold ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded hover:bg-gray-100 transition-colors text-sm font-semibold ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('taskList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Task List"
          >
            <CheckSquare size={16} />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
        </div>

        {/* Special Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('highlight') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Highlight"
          >
            <Highlighter size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('code') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Inline Code"
          >
            <Code size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('blockquote') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            }`}
            title="Quote"
          >
            <Quote size={16} />
          </button>
        </div>

        {/* Media */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowLinkInput(!showLinkInput)}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                editor.isActive('link') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
              }`}
              title="Add Link"
            >
              <LinkIcon size={16} />
            </button>
            {showLinkInput && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-50 w-72">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Insert Link</span>
                  <button onClick={() => setShowLinkInput(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLink()}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={addLink}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                >
                  Insert Link
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowImageInput(!showImageInput)}
              className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
              title="Add Image"
            >
              <ImageIcon size={16} />
            </button>
            {showImageInput && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-50 w-72">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Insert Image</span>
                  <button onClick={() => setShowImageInput(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addImage()}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addImage}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition mb-2"
                >
                  Insert Image
                </button>
                <div className="border-t border-gray-200 pt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <FileUp size={16} />
                    Upload from Computer
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowVideoInput(!showVideoInput)}
              className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
              title="Add Video"
            >
              <Film size={16} />
            </button>
            {showVideoInput && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-50 w-72">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Insert YouTube Video</span>
                  <button onClick={() => setShowVideoInput(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addVideo()}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addVideo}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                >
                  Insert Video
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="Insert Table"
          >
            <TableIcon size={16} />
          </button>
        </div>

        {/* Color */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
              title="Text Color"
            >
              <Palette size={16} />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-50">
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-7 h-7 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>

        {/* Clear */}
        <button
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-2 rounded hover:bg-red-50 transition-colors text-red-600"
          title="Clear Formatting"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

EnhancedWYSIWYG.displayName = 'EnhancedWYSIWYG';

export default EnhancedWYSIWYG;
