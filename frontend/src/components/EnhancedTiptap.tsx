import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentContent } from '@/types/firebase'

const FONT_SIZE_OPTIONS = ['12px', '14px', '16px', '18px', '24px', '32px'] as const

const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
})

interface EnhancedTiptapProps {
  content: DocumentContent
  onChange: (json: DocumentContent) => void
  onTextChange?: (text: string) => void
  className?: string
  placeholder?: string
  onSave?: (content: Record<string, unknown>) => Promise<void>
  isSaving?: boolean
  onAIAction?: (action: string) => void
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'rounded-sm border border-transparent p-2 text-muted-foreground transition-colors hover:bg-panel-hover/10 hover:text-foreground',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive && 'border-primary/50 bg-primary/15 text-foreground'
      )}
    >
      {children}
    </button>
  )
}

export default function EnhancedTiptap({
  content,
  onChange,
  onTextChange,
  className,
  placeholder = 'Start typing...',
  onSave,
  isSaving = false,
  onAIAction,
}: EnhancedTiptapProps) {
  const [showAIMenu, setShowAIMenu] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      FontSize,
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
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as unknown as DocumentContent)
      onTextChange?.(editor.getText())
    },
  })

  const debouncedSave = useCallback(
    debounce(async (json: Record<string, unknown>) => {
      await onSave?.(json)
    }, 2000),
    [onSave]
  )

  useEffect(() => {
    if (editor && onSave) {
      const handleUpdate = ({ editor }: { editor: Editor }) => {
        debouncedSave(editor.getJSON())
      }
      editor.on('update', handleUpdate)
      return () => {
        editor.off('update', handleUpdate)
      }
    }
  }, [editor, debouncedSave, onSave])

  useEffect(() => {
    if (!editor) {
      return
    }

    const current = JSON.stringify(editor.getJSON())
    const incoming = JSON.stringify(content)
    if (current !== incoming) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [editor, content])

  if (!editor) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-editor-border bg-editor-page shadow-panel">
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    )
  }

  const activeFontSize = (editor.getAttributes('textStyle').fontSize as string | null) ?? '16px'

  return (
    <div className={cn('h-full flex flex-col', className)}>
      <div className="sticky top-0 z-20 border-b border-panel-border bg-panel-bg px-2 py-1.5 text-text-main">
        {isSaving && (
          <div className="absolute right-3 top-2 rounded-sm border border-panel-border bg-panel-surface px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-text-secondary">
            Syncing
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5 pr-20">
          <div className="flex items-center gap-1 border-r border-panel-border pr-1.5">
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

          <div className="flex items-center gap-1 border-r border-panel-border pr-1.5">
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

          <div className="flex items-center gap-1 border-r border-panel-border pr-1.5">
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

          <div className="flex items-center border-r border-panel-border px-2">
            <select
              aria-label="Font size"
              value={activeFontSize}
              onChange={event => {
                const size = event.target.value
                editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
              }}
              className="h-8 rounded-sm border border-panel-border bg-panel-surface px-2 text-xs text-text-main outline-none focus:border-primary"
              title="Text size"
            >
              {FONT_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>
                  {size.replace('px', '')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 border-r border-panel-border pr-1.5">
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

          <div className="flex items-center gap-1 border-r border-panel-border pr-1.5">
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

          {onAIAction && (
            <div className="flex items-center">
              <div className="relative">
                <ToolbarButton
                  onClick={() => setShowAIMenu(!showAIMenu)}
                  title="AI Features"
                >
                  <Sparkles size={16} className="text-primary" />
                </ToolbarButton>
                {showAIMenu && (
                  <div className="absolute left-0 top-full z-30 mt-1.5 min-w-[180px] rounded-md border border-panel-border bg-panel-surface p-1 shadow-panel">
                    <button
                      className="w-full rounded-sm border-b border-panel-border px-3 py-2 text-left text-xs hover:bg-panel-hover/50"
                      onClick={() => {
                        onAIAction('summarize')
                        setShowAIMenu(false)
                      }}
                    >
                      Summarize
                    </button>
                    <button
                      className="w-full rounded-sm border-b border-panel-border px-3 py-2 text-left text-xs hover:bg-panel-hover/50"
                      onClick={() => {
                        onAIAction('improve')
                        setShowAIMenu(false)
                      }}
                    >
                      Improve Writing
                    </button>
                    <button
                      className="w-full rounded-sm border-b border-panel-border px-3 py-2 text-left text-xs hover:bg-panel-hover/50"
                      onClick={() => {
                        onAIAction('expand')
                        setShowAIMenu(false)
                      }}
                    >
                      Expand
                    </button>
                    <button
                      className="w-full rounded-sm px-3 py-2 text-left text-xs hover:bg-panel-hover/50"
                      onClick={() => {
                        onAIAction('shorten')
                        setShowAIMenu(false)
                      }}
                    >
                      Shorten
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-auto bg-editor-bg px-8 py-8">
        <div className="mx-auto w-full max-w-[860px] min-h-[calc(100vh-220px)] rounded-sm border border-editor-border/70 bg-editor-page px-14 py-14 shadow-panel">
        <EditorContent editor={editor} className="h-full min-h-full" />
        </div>
      </div>
    </div>
  )
}

function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
