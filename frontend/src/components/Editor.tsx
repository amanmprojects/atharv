'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useCallback } from 'react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  highlights?: Array<{
    start: number;
    end: number;
    type: 'entity' | 'warning' | 'suggestion';
    id: string;
  }>;
}

export default function Editor({ content, onChange, highlights = [] }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none min-h-[500px] p-4 text-gray-900',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const applyHighlights = useCallback(() => {
    if (!editor) return;

    editor.chain().focus().clearNodes().run();

  }, [editor, highlights]);

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 min-h-[500px] bg-gray-50 animate-pulse text-gray-500">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="border-b bg-gray-50 px-4 py-2 flex gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('bold') ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('italic') ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('underline') ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Underline
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('highlight') ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Highlight
        </button>
        <div className="border-l mx-2 border-gray-300"></div>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('bulletList') ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('blockquote') ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Quote
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
