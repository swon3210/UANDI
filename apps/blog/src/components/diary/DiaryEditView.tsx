'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DiaryOwnerGate } from './DiaryOwnerGate';
import { DiaryEntryForm } from './DiaryEntryForm';
import { getDiaryEntry, type DiaryEntry } from '@/lib/diary';

type State = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; entry: DiaryEntry };

export function DiaryEditView({ entryId }: { entryId: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    getDiaryEntry(entryId)
      .then((entry) => {
        if (!alive) return;
        setState(entry ? { status: 'ready', entry } : { status: 'missing' });
      })
      .catch(() => {
        if (alive) setState({ status: 'missing' });
      });
    return () => {
      alive = false;
    };
  }, [entryId]);

  return (
    <DiaryOwnerGate>
      {(ownerUid) => {
        if (state.status === 'loading') {
          return (
            <div className="flex min-h-screen items-center justify-center bg-white">
              <p className="text-sm text-gray-400">불러오는 중…</p>
            </div>
          );
        }
        if (state.status === 'missing') {
          return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
              <p className="font-serif text-lg text-gray-900">없는 글입니다.</p>
              <Link href="/diary" className="mt-4 text-sm text-gray-400 hover:text-gray-700">
                목록으로
              </Link>
            </div>
          );
        }
        return <DiaryEntryForm ownerUid={ownerUid} entry={state.entry} />;
      }}
    </DiaryOwnerGate>
  );
}
