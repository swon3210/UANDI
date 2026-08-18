'use client';

import { useRef, useState, type MouseEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';

type Props = {
  initialContent: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
};

/** 메뉴 버튼을 눌러도 에디터가 포커스·선택을 잃지 않게 한다. 놓치면 방금 고른 서식이
    빈 블록으로 남고 이어 친 글자가 다음 블록에 들어간다. */
const keepEditorFocus = (event: MouseEvent) => event.preventDefault();

const menuButton =
  'rounded px-2 py-1 text-[13px] text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40';
const activeMenuButton = 'bg-gray-900 text-white hover:bg-gray-900 hover:text-white';

export function DiaryEditor({ initialContent, onChange, onUploadImage }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    // Next.js SSR 경고 방지 — 에디터는 마운트 후에만 렌더링한다.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } },
      }),
      Image.configure({ HTMLAttributes: { class: 'diary-image' } }),
      Placeholder.configure({
        placeholder: '오늘 있었던 일을 적어보세요.',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'diary-prose min-h-[48vh] focus:outline-none',
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  const insertImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch {
      window.alert('이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  const toggleLink = () => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('연결할 주소를 입력하세요', 'https://');
    if (!url || url === 'https://') return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return <div className="min-h-[48vh]" aria-hidden="true" />;
  }

  return (
    <div className="relative">
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-lg"
      >
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${menuButton} ${editor.isActive('heading', { level: 2 }) ? activeMenuButton : ''}`}
        >
          제목
        </button>
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${menuButton} ${editor.isActive('heading', { level: 3 }) ? activeMenuButton : ''}`}
        >
          소제목
        </button>
        <span className="mx-0.5 h-4 w-px bg-gray-200" />
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${menuButton} font-bold ${editor.isActive('bold') ? activeMenuButton : ''}`}
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${menuButton} italic ${editor.isActive('italic') ? activeMenuButton : ''}`}
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${menuButton} underline ${editor.isActive('underline') ? activeMenuButton : ''}`}
        >
          U
        </button>
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${menuButton} line-through ${editor.isActive('strike') ? activeMenuButton : ''}`}
        >
          S
        </button>
        <span className="mx-0.5 h-4 w-px bg-gray-200" />
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${menuButton} ${editor.isActive('blockquote') ? activeMenuButton : ''}`}
        >
          인용
        </button>
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={toggleLink}
          className={`${menuButton} ${editor.isActive('link') ? activeMenuButton : ''}`}
        >
          링크
        </button>
      </BubbleMenu>

      {/* 빈 줄에 커서를 두면 브런치처럼 삽입 메뉴가 붙는다 */}
      <FloatingMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-sm"
      >
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={menuButton}
        >
          {uploading ? '올리는 중…' : '사진'}
        </button>
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={menuButton}
        >
          목록
        </button>
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={menuButton}
        >
          인용
        </button>
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={menuButton}
        >
          구분선
        </button>
      </FloatingMenu>

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void insertImage(file);
        }}
      />
    </div>
  );
}
