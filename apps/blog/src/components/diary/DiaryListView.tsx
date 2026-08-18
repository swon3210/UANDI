'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { DiaryTopBar } from './DiaryTopBar';
import { useDiaryAuth } from '@/hooks/useDiaryAuth';
import { listDiaryEntries, type DiaryCursor, type DiaryEntry } from '@/lib/diary';

export function DiaryListView() {
  const { auth, signIn, signOut } = useDiaryAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [cursor, setCursor] = useState<DiaryCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = auth.status === 'owner';

  // 첫 페이지 로드 — 목록은 보안 규칙상 주인만 읽을 수 있다.
  useEffect(() => {
    if (!isOwner) return;

    let alive = true;
    setLoading(true);
    listDiaryEntries()
      .then((page) => {
        if (!alive) return;
        setEntries(page.entries);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      })
      .catch(() => {
        if (alive) setError('목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isOwner]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const page = await listDiaryEntries(cursor);
      setEntries((prev) => [...prev, ...page.entries]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      setError('목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (auth.status === 'unconfigured') {
    return (
      <Centered>
        <p className="font-serif text-lg text-gray-900">일기 기능이 아직 연결되지 않았습니다.</p>
        <p className="mt-3 text-sm text-gray-500">
          블로그 앱에 <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_FIREBASE_*</code>{' '}
          환경변수를 설정해주세요.
        </p>
      </Centered>
    );
  }

  if (auth.status === 'loading') {
    return (
      <Centered>
        <p className="text-sm text-gray-400">확인 중…</p>
      </Centered>
    );
  }

  if (auth.status !== 'owner') {
    return (
      <Centered>
        <p className="font-serif text-xl font-bold tracking-tight text-gray-900">일기</p>
        <p className="mt-3 text-sm text-gray-500">
          {auth.status === 'stranger'
            ? '이 페이지를 볼 수 있는 계정이 아닙니다.'
            : '비공개 기록입니다. 주인만 볼 수 있어요.'}
        </p>
        {auth.status === 'stranger' ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            다른 계정으로 로그인
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void signIn()}
            className="mt-6 rounded-full bg-gray-900 px-5 py-2 text-sm text-white transition-colors hover:bg-black"
          >
            Google로 로그인
          </button>
        )}
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <DiaryTopBar>
        <Link
          href="/diary/write"
          className="rounded-full bg-gray-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-black"
        >
          새 일기
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="ml-1 px-2 py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          로그아웃
        </button>
      </DiaryTopBar>

      <div className="mx-auto max-w-[720px] px-5 pb-24 pt-12">
        <h1 className="font-serif text-[26px] font-bold tracking-tight text-gray-900">일기</h1>
        <p className="mt-2 text-sm text-gray-400">
          블로그 어디에도 링크하지 않은 기록. 글 링크를 받은 사람만 그 글을 읽을 수 있습니다.
        </p>

        {error ? <p className="mt-10 text-sm text-red-500">{error}</p> : null}

        {!error && entries.length === 0 && !loading ? (
          <p className="mt-16 text-center text-sm text-gray-400">
            아직 쓴 일기가 없습니다. 오늘 하루를 적어보세요.
          </p>
        ) : null}

        <ul className="mt-10">
          {entries.map((entry) => (
            <li key={entry.id} className="border-t border-gray-100 first:border-t-0">
              <Link href={`/diary/${entry.id}`} className="group flex gap-5 py-7">
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-[19px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-[var(--color-primary)]">
                    {entry.title}
                  </h2>
                  {entry.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-gray-500">
                      {entry.excerpt}
                    </p>
                  ) : null}
                  <p className="mt-3 text-[13px] text-gray-400">
                    {entry.createdAt ? dayjs(entry.createdAt).format('YYYY. M. D.') : '방금'}
                  </p>
                </div>
                {entry.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.coverImageUrl}
                    alt=""
                    className="h-[92px] w-[92px] shrink-0 rounded-sm object-cover"
                  />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>

        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="mt-6 w-full rounded-lg border border-gray-200 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? '불러오는 중…' : '더 보기'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      {children}
    </div>
  );
}
