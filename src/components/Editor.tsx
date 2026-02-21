'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { updateDocument, DocumentData } from '@/actions/documentActions';
import { useState, useEffect, useCallback } from 'react';
import {
    Bold,
    Italic,
    Strikethrough,
    Underline as UnderlineIcon,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Save,
    CheckCircle2,
    Loader2
} from 'lucide-react';

export default function Editor({ initialDocument }: { initialDocument: DocumentData }) {
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
    const [debouncedContent, setDebouncedContent] = useState(initialDocument.content);

    const saveContent = useCallback(async (content: string) => {
        setSaveStatus('saving');
        try {
            await updateDocument(initialDocument.id, content);
            setSaveStatus('saved');
        } catch (error) {
            console.error('Failed to save document:', error);
            setSaveStatus('error');
        }
    }, [initialDocument.id]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder: 'Start typing here...',
            }),
        ],
        content: initialDocument.content,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px]',
            },
        },
        onUpdate: ({ editor }) => {
            setSaveStatus('unsaved');
            setDebouncedContent(editor.getHTML());
        },
    });

    useEffect(() => {
        if (saveStatus !== 'unsaved') return;

        const timeoutId = setTimeout(() => {
            saveContent(debouncedContent);
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [debouncedContent, saveContent, saveStatus]);

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({
        onClick,
        isActive = false,
        children
    }: {
        onClick: () => void,
        isActive?: boolean,
        children: React.ReactNode
    }) => (
        <button
            onClick={onClick}
            className={`p-2 border-2 border-bd hover:bg-bc transition-colors ${isActive ? 'bg-bd text-white hover:bg-bd hover:text-gray-200 shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white text-bd shadow-[2px_2px_0px_0px_var(--color-bd)]'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white border-3 border-bd p-4 shadow-brutal flex-wrap gap-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex gap-2">
                        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
                            <Bold size={20} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
                            <Italic size={20} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
                            <UnderlineIcon size={20} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
                            <Strikethrough size={20} />
                        </ToolbarButton>
                    </div>

                    <div className="w-1 h-8 bg-bc border-x-2 border-bd mx-1 hidden md:block" />

                    <div className="flex gap-2">
                        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
                            <Heading1 size={20} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
                            <Heading2 size={20} />
                        </ToolbarButton>
                    </div>

                    <div className="w-1 h-8 bg-bc border-x-2 border-bd mx-1 hidden md:block" />

                    <div className="flex gap-2">
                        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
                            <List size={20} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
                            <ListOrdered size={20} />
                        </ToolbarButton>
                    </div>
                </div>

                <div className="flex items-center gap-2 font-bold px-4 py-2 bg-bc border-2 border-bd shadow-[2px_2px_0px_0px_var(--color-bd)]">
                    {saveStatus === 'saved' && <><CheckCircle2 size={18} className="text-green-600" /> Saved</>}
                    {saveStatus === 'saving' && <><Loader2 size={18} className="animate-spin text-blue-600" /> Saving</>}
                    {saveStatus === 'unsaved' && <><Save size={18} className="text-gray-500" /> Unsaved</>}
                    {saveStatus === 'error' && <span className="text-red-600">Error!</span>}
                </div>
            </div>

            <div className="w-full">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
