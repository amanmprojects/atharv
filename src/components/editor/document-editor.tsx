'use client';

import { useState, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  CheckSquare,
  Sparkles,
  Users,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document, UserPresence } from '@/types';
import { assignCursorColor } from '@/types/user';

interface DocumentEditorProps {
  document: Document | null;
  content: Record<string, unknown> | null;
  onSave: (content: Record<string, unknown>) => Promise<void>;
  presences?: UserPresence[];
  isSaving?: boolean;
  onAIAction?: (action: string) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 hover:bg-[var(--surface)] transition-colors border-r border-[var(--border)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive && 'bg-[var(--surface)]'
      )}
    >
      {children}
    </button>
  );
}

export function DocumentEditor({
  document,
  content,
  onSave,
  presences = [],
  isSaving = false,
  onAIAction,
}: DocumentEditorProps) {
  const [showAIMenu, setShowAIMenu] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
    ],
    content: content || undefined,
    editorProps: {
      attributes: {
        class: 'Tiptap focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      debouncedSave(json);
    },
  });

  const debouncedSave = useCallback(
    debounce(async (json: Record<string, unknown>) => {
      await onSave(json);
    }, 2000),
    [onSave]
  );

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="brutalist-border p-4 bg-[var(--surface)]">
          <p className="font-mono text-sm">Loading editor...</p>
        </div>
      </div>
    );
  }

  const activeUsers = presences.filter((p) => p.userId !== document?.ownerId);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      <div className="border-b-2 border-[var(--primary)] bg-[var(--background)] sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={document?.title || 'Untitled'}
              className="font-mono text-lg font-bold bg-transparent border-none outline-none"
              readOnly
            />
            {isSaving && (
              <span className="text-xs text-[var(--secondary-text)] font-mono flex items-center gap-1">
                <Save size={12} /> Saving...
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[var(--secondary-text)]" />
                <div className="presence-avatar-stack">
                  {activeUsers.slice(0, 5).map((presence, i) => (
                    <div
                      key={presence.userId}
                      className="presence-avatar"
                      style={{ borderColor: presence.color }}
                      title={presence.displayName}
                    >
                      {presence.photoURL ? (
                        <img src={presence.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-mono">{presence.displayName[0]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center flex-wrap">
          <div className="flex items-center border-r-2 border-[var(--border)]">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo size={16} />
            </ToolbarButton>
          </div>

          <div className="flex items-center border-r-2 border-[var(--border)]">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
            >
              <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
            >
              <Italic size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline"
            >
              <UnderlineIcon size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="Code"
            >
              <Code size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title="Highlight"
            >
              <Highlighter size={16} />
            </ToolbarButton>
          </div>

          <div className="flex items-center border-r-2 border-[var(--border)]">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 size={16} />
            </ToolbarButton>
          </div>

          <div className="flex items-center border-r-2 border-[var(--border)]">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight size={16} />
            </ToolbarButton>
          </div>

          <div className="flex items-center border-r-2 border-[var(--border)]">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Ordered List"
            >
              <ListOrdered size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive('taskList')}
              title="Task List"
            >
              <CheckSquare size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote size={16} />
            </ToolbarButton>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <ToolbarButton
                onClick={() => setShowAIMenu(!showAIMenu)}
                title="AI Features"
              >
                <Sparkles size={16} className="text-[var(--ai-accent)]" />
              </ToolbarButton>
              {showAIMenu && (
                <div className="absolute top-full left-0 mt-1 bg-[var(--background)] brutalist-border min-w-[160px] z-30">
                  <button
                    className="w-full px-3 py-2 text-left font-mono text-xs hover:bg-[var(--surface)] border-b border-[var(--border)]"
                    onClick={() => {
                      onAIAction?.('summarize');
                      setShowAIMenu(false);
                    }}
                  >
                    Summarize
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left font-mono text-xs hover:bg-[var(--surface)] border-b border-[var(--border)]"
                    onClick={() => {
                      onAIAction?.('improve');
                      setShowAIMenu(false);
                    }}
                  >
                    Improve Writing
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left font-mono text-xs hover:bg-[var(--surface)] border-b border-[var(--border)]"
                    onClick={() => {
                      onAIAction?.('expand');
                      setShowAIMenu(false);
                    }}
                  >
                    Expand
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left font-mono text-xs hover:bg-[var(--surface)]"
                    onClick={() => {
                      onAIAction?.('shorten');
                      setShowAIMenu(false);
                    }}
                  >
                    Shorten
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default DocumentEditor;
