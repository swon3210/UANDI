'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { DiaryTopBar } from './DiaryTopBar';
import { ConfirmDialog } from './ConfirmDialog';
import { useDiaryAuth } from '@/hooks/useDiaryAuth';
import { deleteDiaryEntry, getDiaryEntry, type DiaryEntry } from '@/lib/diary';

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; entry: DiaryEntry };

export function DiaryEntryView({ entryId }: { entryId: string }) {
  const router = useRouter();
  const { auth } = useDiaryAuth();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [askDelete, setAskDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    getDiaryEntry(entryId)
      .then((entry) => {
        if (!alive) return;
        setState(entry ? { status: 'ready', entry } : { status: 'not-found' });
      })
      .catch(() => {
        if (alive) setState({ status: 'error' });
      });
    return () => {
      alive = false;
    };
  }, [entryId]);

  const isOwner = auth.status === 'owner';

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteDiaryEntry(entryId);
      router.replace('/diary');
    } catch {
      setDeleting(false);
      setAskDelete(false);
    }
  };

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-white">
        <DiaryTopBar />
        <div className="mx-auto max-w-[720px] animate-pulse px-5 pt-16">
          <div className="h-8 w-2/3 rounded bg-gray-100" />
          <div className="mt-6 h-4 w-1/4 rounded bg-gray-100" />
          <div className="mt-10 space-y-3">
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-11/12 rounded bg-gray-100" />
            <div className="h-4 w-4/5 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (state.status !== 'ready') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <p className="font-serif text-lg text-gray-900">
          {state.status === 'not-found' ? '없는 글입니다.' : '글을 불러오지 못했습니다.'}
        </p>
        <Link href="/" className="mt-4 text-sm text-gray-400 hover:text-gray-700">
          Doggae Log 홈으로
        </Link>
      </div>
    );
  }

  const { entry } = state;
  const edited = entry.updatedAt && entry.createdAt && entry.updatedAt !== entry.createdAt;

  return (
    <div className="min-h-screen bg-white">
      <DiaryTopBar backHref={isOwner ? '/diary' : undefined}>
        {isOwner ? (
          <>
            <Link
              href={`/diary/${entry.id}/edit`}
              className="rounded-full px-3 py-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={() => setAskDelete(true)}
              className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-red-500"
            >
              삭제
            </button>
          </>
        ) : null}
      </DiaryTopBar>

      <article className="mx-auto max-w-[720px] px-5 pb-24 pt-12">
        {entry.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.coverImageUrl}
            alt=""
            className="mb-10 max-h-[440px] w-full rounded-sm object-cover"
          />
        ) : null}

        <h1 className="font-serif text-[30px] font-bold leading-snug tracking-tight text-gray-900 sm:text-[34px]">
          {entry.title}
        </h1>

        <p className="mt-5 text-[13px] text-gray-400">
          {entry.createdAt ? dayjs(entry.createdAt).format('YYYY년 M월 D일') : '방금'}
          {edited ? ' · 수정됨' : ''}
        </p>

        <div className="mb-10 mt-5 h-px w-10 bg-gray-900" />

        <div className="diary-prose" dangerouslySetInnerHTML={{ __html: entry.contentHtml }} />
      </article>

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
