// components/RichTextEditor.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Professional rich text editor using TipTap
// Features: Bold, Italic, Underline, Strikethrough, Headings, Lists,
//           Text Alignment, Links, Inline Image Upload, Code Block, Blockquote
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

// ─── Toolbar Button ───────────────────────────────────────────────────────────
const TBtn = ({ onClick, active, title, children, color = '#374151' }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      width: 30, height: 30, display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', borderRadius: 6, border: 'none',
      background: active ? '#dbeafe' : 'transparent',
      color: active ? '#2563eb' : color,
      cursor: 'pointer', fontSize: 14, fontWeight: 600,
      transition: 'all 0.12s',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f3f4f6' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
  >
    {children}
  </button>
)

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider = () => (
  <span style={{ width: 1, height: 20, background: '#e5e7eb', flexShrink: 0 }} />
)

// ─── Toolbar SVG Icons ────────────────────────────────────────────────────────
const Icn = ({ d, viewBox = '0 0 24 24' }) => (
  <svg viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    {d}
  </svg>
)

const icons = {
  bold:      <Icn d={<><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></>} />,
  italic:    <Icn d={<path d="M10 4l4 16M14 4l-4 16"/>} />,
  underline: <Icn d={<path d="M6 3v4a6 6 0 0012 0V3M4 21h16"/>} />,
  strike:    <Icn d={<path d="M6 12h12M8 4v4a4 4 0 008 0V4M10 20h4"/>} />,
  h1:        <span style={{fontSize:15,fontWeight:700,lineHeight:1}}>H1</span>,
  h2:        <span style={{fontSize:13,fontWeight:700,lineHeight:1}}>H2</span>,
  h3:        <span style={{fontSize:12,fontWeight:700,lineHeight:1}}>H3</span>,
  bullList:  <Icn d={<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>} />,
  ordList:   <Icn d={<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>} />,
  quote:     <Icn d={<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>} />,
  code:      <Icn d={<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>} />,
  link:      <Icn d={<><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>} />,
  left:      <Icn d={<path d="M17 10H3M21 6H3M21 14H3M17 18H3"/>} />,
  center:    <Icn d={<path d="M17 10H7M21 6H3M21 14H3M17 18H7"/>} />,
  right:     <Icn d={<path d="M7 10h14M3 6h18M3 14h18M7 18h14"/>} />,
  image:     <Icn d={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></>} />,
  undo:      <Icn d={<path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>} />,
  redo:      <Icn d={<path d="M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>} />,
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MENU BAR
// ═══════════════════════════════════════════════════════════════════════════════
const MenuBar = ({ editor, token }) => {
  const fileInputRef = useRef(null)

  const addImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target?.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, and GIF images are allowed')
      return
    }

    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await axios.post(`${backendUrl}/api/upload/editor-image`, fd, {
        headers: { token },
      })
      if (data.success) {
        editor.chain().focus().setImage({ src: data.url }).run()
        toast.success('Image inserted')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image')
    }
  }, [editor, token])

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px',
        borderBottom: '1px solid #e5e7eb', background: '#fafafa',
        borderRadius: '10px 10px 0 0',
        alignItems: 'center',
      }}>
        <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          {icons.bold}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          {icons.italic}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          {icons.underline}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          {icons.strike}
        </TBtn>

        <Divider />

        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          {icons.h1}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          {icons.h2}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          {icons.h3}
        </TBtn>

        <Divider />

        <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          {icons.bullList}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
          {icons.ordList}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          {icons.quote}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          {icons.code}
        </TBtn>

        <Divider />

        <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          {icons.left}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          {icons.center}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          {icons.right}
        </TBtn>

        <Divider />

        <TBtn onClick={addImage} active={false} title="Insert Image" color="#6b7280">
          {icons.image}
        </TBtn>
        <TBtn onClick={setLink} active={editor.isActive('link')} title="Insert Link">
          {icons.link}
        </TBtn>

        <Divider />

        <TBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo" color="#6b7280">
          {icons.undo}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo" color="#6b7280">
          {icons.redo}
        </TBtn>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RICH TEXT EDITOR
// ═══════════════════════════════════════════════════════════════════════════════
const RichTextEditor = ({ content, onChange, placeholder = 'Write your content here...', token }) => {
  // Ensure content is a non-null string — empty string → default paragraph
  const safeContent = content && typeof content === 'string' && content.trim()
    ? content
    : '<p></p>'

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: safeContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Only call onChange if there's actual content (not empty paragraph)
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
      },
    },
  })

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      overflow: 'hidden',
      background: '#fff',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      <MenuBar editor={editor} token={token} />
      <div style={{
        padding: '16px 18px',
        minHeight: 240,
        maxHeight: 480,
        overflowY: 'auto',
        lineHeight: 1.7,
        fontSize: 15,
        color: '#111827',
        cursor: 'text',
      }}
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .ProseMirror { outline: none; min-height: 180px; }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { margin: 16px 0 8px; font-weight: 700; }
        .ProseMirror h1 { font-size: 22px; }
        .ProseMirror h2 { font-size: 18px; }
        .ProseMirror h3 { font-size: 16px; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 8px 0; }
        .ProseMirror li { margin: 4px 0; }
        .ProseMirror blockquote {
          border-left: 3px solid #2563eb; padding: 8px 16px; margin: 12px 0;
          background: #f9fafb; border-radius: 0 8px 8px 0; color: #374151;
        }
        .ProseMirror pre {
          background: #1e293b; color: #e2e8f0; padding: 14px 18px;
          border-radius: 8px; font-size: 13px; overflow-x: auto; margin: 12px 0;
        }
        .ProseMirror code {
          background: #f1f5f9; color: #1d4ed8; padding: 2px 6px; border-radius: 4px;
          font-size: 0.9em;
        }
        .ProseMirror pre code { background: none; color: inherit; padding: 0; }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder); float: left; color: #adb5bd;
          pointer-events: none; height: 0; font-style: normal;
        }
        .ProseMirror p:first-child { margin-top: 0; }
      `}</style>
    </div>
  )
}

export default RichTextEditor
