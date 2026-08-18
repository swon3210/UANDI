'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DiaryEditor } from './DiaryEditor';
import { ConfirmDialog } from './ConfirmDialog';
import {
  createDiaryEntry,
  deleteDiaryEntry,
  updateDiaryEntry,
  uploadDiaryImage,
  type DiaryEntry,
} from '@/lib/diary';

type Props = {
  ownerUid: string;
  /** 수정 모드일 때만 전달 */
  entry?: DiaryEntry;
};

export function DiaryEntryForm({ ownerUid, entry }: Props) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(entry?.title ?? '');
  const [contentHtml, setContentHtml] = useState(entry?.contentHtml ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(entry?.coverImageUrl ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // 작성 중 실수로 창을 닫는 것을 막는다 (브라우저 기본 확인창).
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const resizeTitle = (element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    try {
      setCoverImageUrl(await uploadDiaryImage(file, ownerUid));
      setDirty(true);
    } catch {
      setError('커버 이미지 업로드에 실패했습니다.');
    } finally {
      setCoverUploading(false);
    }
  };

  const save = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const input = { title: trimmedTitle, contentHtml, coverImageUrl };
      if (entry) {
        await updateDiaryEntry(entry.id, input);
      }
      const id = entry?.id ?? (await createDiaryEntry(input, ownerUid));
      setDirty(false);
      router.push(`/diary/${id}`);
    } catch {
      setError('저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!entry) return;
    setDeleting(true);
    try {
      await deleteDiaryEntry(entry.id);
      setDirty(false);
      router.replace('/diary');
    } catch {
      setError('삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setDeleting(false);
      setAskDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[720px] items-center justify-between px-5">
          <Link
            href={entry ? `/diary/${entry.id}` : '/diary'}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            나가기
          </Link>
          <div className="flex items-center gap-2">
            {entry ? (
              <button
                type="button"
                onClick={() => setAskDelete(true)}
                className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-red-500"
              >
                삭제
              </button>
            ) : null}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-gray-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              {saving ? '저장 중…' : entry ? '수정 완료' : '발행'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-5 pb-32 pt-10">
        {coverImageUrl ? (
          <div className="relative mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt=""
              className="max-h-[420px] w-full rounded-sm object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setCoverImageUrl(null);
                setDirty(true);
              }}
              className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white"
            >
              커버 삭제
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            className="mb-6 text-sm text-gray-400 transition-colors hover:text-gray-700 disabled:opacity-50"
          >
            {coverUploading ? '커버 이미지 올리는 중…' : '+ 커버 이미지'}
          </button>
        )}

        <textarea
          ref={resizeTitle}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setDirty(true);
            resizeTitle(event.currentTarget);
          }}
          placeholder="제목을 입력하세요"
          rows={1}
          className="w-full resize-none border-none bg-transparent font-serif text-[30px] font-bold leading-snug tracking-tight text-gray-900 placeholder:text-gray-300 focus:outline-none sm:text-[34px]"
        />

        <div className="mb-8 mt-5 h-px w-10 bg-gray-900" />

        <DiaryEditor
          initialContent={entry?.contentHtml ?? ''}
          onChange={(html) => {
            setContentHtml(html);
            setDirty(true);
          }}
          onUploadImage={(file) => uploadDiaryImage(file, ownerUid)}
        />

        {error ? <p className="mt-6 text-sm text-red-500">{error}</p> : null}
      </div>

      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void uploadCover(file);
        }}
      />

      {askDelete ? (
        <ConfirmDialog
          title="이 일기를 삭제할까요?"
          description="삭제하면 되돌릴 수 없습니다."
          confirmLabel="삭제"
          pending={deleting}
          onConfirm={() => void remove()}
          onCancel={() => setAskDelete(false)}
        />
      ) : null}
    </div>
  );
}
