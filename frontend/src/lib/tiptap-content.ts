import type { DocumentContent } from '@/types/firebase'

type TiptapNode = {
  type?: string
  text?: string
  content?: TiptapNode[]
  [key: string]: unknown
}

const BLOCK_BREAK_NODES = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'listItem',
  'taskItem',
  'codeBlock',
])

export const EMPTY_TIPTAP_DOCUMENT: DocumentContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [] }],
}

export function isDocumentContent(value: unknown): value is DocumentContent {
  if (!value || typeof value !== 'object') {
    return false
  }

  const content = value as { type?: unknown; content?: unknown }
  return content.type === 'doc' && Array.isArray(content.content)
}

export function ensureDocumentContent(value: unknown): DocumentContent {
  if (isDocumentContent(value)) {
    return value
  }

  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  }
}

function nodeToText(node: TiptapNode): string {
  if (node.type === 'text') {
    return typeof node.text === 'string' ? node.text : ''
  }

  if (node.type === 'hardBreak') {
    return '\n'
  }

  const childText = Array.isArray(node.content)
    ? node.content.map(nodeToText).join('')
    : ''

  if (!childText) {
    return ''
  }

  if (node.type && BLOCK_BREAK_NODES.has(node.type)) {
    return `${childText}\n\n`
  }

  return childText
}

export function extractPlainTextFromDocument(content: unknown): string {
  const doc = ensureDocumentContent(content) as unknown as TiptapNode
  const text = Array.isArray(doc.content)
    ? doc.content.map(nodeToText).join('')
    : ''

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

export function plainTextToDocument(text: string): DocumentContent {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    }
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => {
      const lines = paragraph.split('\n')
      const content: TiptapNode[] = []

      lines.forEach((line, index) => {
        if (line.length > 0) {
          content.push({ type: 'text', text: line })
        }
        if (index < lines.length - 1) {
          content.push({ type: 'hardBreak' })
        }
      })

      return {
        type: 'paragraph',
        content,
      }
    })

  return {
    type: 'doc',
    content: paragraphs.length > 0 ? (paragraphs as DocumentContent['content']) : EMPTY_TIPTAP_DOCUMENT.content,
  }
}

function replaceFirstInNode(
  node: TiptapNode,
  originalText: string,
  modifiedText: string,
  state: { replaced: boolean }
): TiptapNode {
  if (state.replaced) {
    return node
  }

  if (node.type === 'text' && typeof node.text === 'string') {
    const matchIndex = node.text.indexOf(originalText)
    if (matchIndex >= 0) {
      state.replaced = true
      return {
        ...node,
        text:
          node.text.slice(0, matchIndex) +
          modifiedText +
          node.text.slice(matchIndex + originalText.length),
      }
    }
    return node
  }

  if (!Array.isArray(node.content) || node.content.length === 0) {
    return node
  }

  let changed = false
  const nextChildren = node.content.map(child => {
    const nextChild = replaceFirstInNode(child, originalText, modifiedText, state)
    if (nextChild !== child) {
      changed = true
    }
    return nextChild
  })

  if (!changed) {
    return node
  }

  return {
    ...node,
    content: nextChildren,
  }
}

export function replaceFirstTextOccurrence(
  content: DocumentContent,
  originalText: string,
  modifiedText: string
): { content: DocumentContent; replaced: boolean } {
  if (!originalText) {
    return { content, replaced: false }
  }

  const state = { replaced: false }
  const nextContent = content.content.map(node =>
    replaceFirstInNode(node as unknown as TiptapNode, originalText, modifiedText, state)
  )

  if (!state.replaced) {
    return { content, replaced: false }
  }

  return {
    content: {
      ...content,
      content: nextContent as DocumentContent['content'],
    },
    replaced: true,
  }
}
