'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface TiptapProps {
    content: string
    onChange: (html: string) => void
    className?: string
    placeholder?: string
}

const Tiptap = ({ content, onChange, className }: TiptapProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
        ],
        content,
        autofocus: true,
        editable: true,
        injectCSS: false,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    if (!editor) return null

    return (
        <div className={className}>
            <EditorContent editor={editor} className="h-full outline-none" />
        </div>
    )
}

export default Tiptap