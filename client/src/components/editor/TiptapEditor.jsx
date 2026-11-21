import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import apiClient from '../../api/client';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Check,
  X,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

// Reusable toolbar button with mousedown prevention to preserve editor selection
const ToolbarButton = ({ onClick, isActive, icon: Icon, title, disabled = false, spin = false }) => (
  <button
    type="button"
    onClick={onClick}
    onMouseDown={(e) => {
      // Critical: Prevent focus transfer away from the contenteditable editor
      e.preventDefault();
    }}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg text-sm transition-colors cursor-pointer select-none ${
      disabled
        ? 'opacity-35 cursor-not-allowed text-slate-400'
        : isActive
        ? 'bg-indigo-100 text-indigo-700 font-bold shadow-xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon className={`w-4 h-4${spin ? ' animate-spin' : ''}`} />
  </button>
);

export default function TiptapEditor({ content, onChange }) {
  // Popover state for hyperlink insertion/editing (replaces window.prompt)
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [savedSelection, setSavedSelection] = useState(null);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const urlInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Disable StarterKit's built-in Link and Underline to avoid duplicate extension registrations
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'text-indigo-600 underline hover:text-indigo-800 transition-colors',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your article body here. Share lessons, insights, and campus perspectives...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 shadow-sm',
        },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-slate max-w-none focus:outline-none min-h-[320px] px-4 py-3 text-slate-800 leading-relaxed text-base',
      },
    },
  });

  // Sync content if modified externally (e.g. loading an existing draft from database)
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Focus the URL input when the popover opens
  useEffect(() => {
    if (isLinkPopoverOpen && urlInputRef.current) {
      urlInputRef.current.focus();
      urlInputRef.current.select();
    }
  }, [isLinkPopoverOpen]);

  if (!editor) {
    return <div className="p-4 text-slate-400 text-sm">Loading rich-text editor...</div>;
  }

  // Open the custom link modal/popover without using browser alerts or prompts
  const handleOpenLinkPopover = () => {
    if (isLinkPopoverOpen) {
      setIsLinkPopoverOpen(false);
      return;
    }

    const isCurrentLink = editor.isActive('link');
    const existingHref = editor.getAttributes('link').href || '';
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty ? '' : editor.state.doc.textBetween(from, to, ' ');

    setSavedSelection({ from, to, empty });
    setLinkError('');

    if (isCurrentLink) {
      setIsEditingLink(true);
      setLinkUrl(existingHref);
      setLinkText(selectedText || '');
      setShowTextInput(false);
    } else {
      setIsEditingLink(false);
      setLinkUrl('');
      if (empty) {
        setShowTextInput(true);
        setLinkText('');
      } else {
        setShowTextInput(false);
        setLinkText(selectedText);
      }
    }

    setIsLinkPopoverOpen(true);
  };

  const handleCloseLinkPopover = () => {
    setIsLinkPopoverOpen(false);
    setLinkUrl('');
    setLinkText('');
    setLinkError('');
    setSavedSelection(null);
    editor.chain().focus().run();
  };

  // Validate and apply the hyperlink
  const handleApplyLink = () => {
    const rawUrl = linkUrl.trim();

    if (!rawUrl) {
      setLinkError('Please enter a destination URL.');
      return;
    }

    // Security check: disallow javascript:, vbscript:, data: pseudo-protocols
    const lower = rawUrl.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('data:')
    ) {
      setLinkError('Dangerous or unsupported URL protocol.');
      return;
    }

    // Auto-prefix https:// if protocol is omitted
    let formattedUrl = rawUrl;
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (isEditingLink) {
      // Update existing link attributes
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: formattedUrl })
        .run();
    } else if (savedSelection && !savedSelection.empty) {
      // Apply link mark to existing selected text
      editor
        .chain()
        .focus()
        .setTextSelection({ from: savedSelection.from, to: savedSelection.to })
        .extendMarkRange('link')
        .setLink({ href: formattedUrl })
        .run();
    } else {
      // Insert new linked text if no selection existed
      const displayText = linkText.trim() || formattedUrl;
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: displayText,
          marks: [{ type: 'link', attrs: { href: formattedUrl } }],
        })
        .run();
    }

    handleCloseLinkPopover();
  };

  // Remove existing hyperlink
  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    handleCloseLinkPopover();
  };

  // Upload image file to Cloudinary via backend then insert into editor
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = response.data?.url;
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all relative">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/90 border-b border-slate-200 text-xs">
        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          isActive={false}
          icon={Undo}
          title="Undo (Ctrl+Z)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          isActive={false}
          icon={Redo}
          title="Redo (Ctrl+Y)"
        />

        <div className="w-[1px] h-5 bg-slate-200 mx-1" />

        {/* Text Styles */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={UnderlineIcon}
          title="Underline (Ctrl+U)"
        />

        <div className="w-[1px] h-5 bg-slate-200 mx-1" />

        {/* Headings: H1, H2, H3 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          title="Main Heading (H1)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          title="Section Heading (H2)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          title="Subsection (H3)"
        />

        <div className="w-[1px] h-5 bg-slate-200 mx-1" />

        {/* Lists & Blockquote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          title="Numbered List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          title="Blockquote"
        />

        <div className="w-[1px] h-5 bg-slate-200 mx-1" />

        {/* Hyperlink */}
        <ToolbarButton
          onClick={handleOpenLinkPopover}
          isActive={editor.isActive('link') || isLinkPopoverOpen}
          icon={LinkIcon}
          title={editor.isActive('link') ? 'Edit or Remove Hyperlink' : 'Insert Hyperlink'}
        />

        {/* Code Block */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          icon={Code}
          title="Code Block"
        />

        <div className="w-[1px] h-5 bg-slate-200 mx-1" />

        {/* Image Upload */}
        <input
          type="file"
          ref={imageInputRef}
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleImageFileChange}
        />
        <ToolbarButton
          onClick={() => !isUploadingImage && imageInputRef.current?.click()}
          isActive={false}
          disabled={isUploadingImage}
          icon={isUploadingImage ? Loader2 : ImageIcon}
          title="Upload Image"
          spin={isUploadingImage}
        />
      </div>

      {/* Modern Floating/Docked Link Popover */}
      {isLinkPopoverOpen && (
        <div className="bg-slate-50/95 border-b border-indigo-200/80 p-3 sm:px-4 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-indigo-700">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{isEditingLink ? 'Edit Link' : 'Insert Hyperlink'}</span>
              </span>
              <button
                type="button"
                onClick={handleCloseLinkPopover}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {showTextInput && (
                <div className="w-full sm:w-1/3">
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Display text (e.g. Student Portal)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex-1">
                <input
                  ref={urlInputRef}
                  type="text"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    if (linkError) setLinkError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyLink();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCloseLinkPopover();
                    }
                  }}
                  placeholder="Paste URL (e.g. https://... or domain.com)"
                  className={`w-full px-3 py-1.5 bg-white border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    linkError
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-indigo-500'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleApplyLink}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditingLink ? 'Update' : 'Apply'}</span>
                </button>

                {isEditingLink && (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    title="Remove hyperlink mark"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Unlink</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCloseLinkPopover}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            {linkError && (
              <p className="text-[11px] text-rose-600 font-semibold animate-in fade-in duration-100">
                {linkError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
