'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Index as LunrIndex } from 'lunr';

type SearchRecord = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  category: string;
  categoryLabel: string;
  date: string;
};

type SearchData = {
  index: object;
  records: SearchRecord[];
};

type SearchHit = {
  record: SearchRecord;
  score: number;
};

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; index: LunrIndex; records: SearchRecord[] }
  | { status: 'error'; message: string };

const MAX_RESULTS = 8;

let cachedDataPromise: Promise<{ index: LunrIndex; records: SearchRecord[] }> | null = null;

async function loadSearchData() {
  if (!cachedDataPromise) {
    cachedDataPromise = (async () => {
      const [{ default: lunr }, response] = await Promise.all([
        import('lunr'),
        fetch('/search-index.json', { cache: 'force-cache' }),
      ]);
      if (!response.ok) {
        throw new Error(`search-index.json fetch failed: ${response.status}`);
      }
      const data = (await response.json()) as SearchData;
      const index = lunr.Index.load(data.index as Parameters<typeof lunr.Index.load>[0]);
      return { index, records: data.records };
    })().catch((err) => {
      cachedDataPromise = null;
      throw err;
    });
  }
  return cachedDataPromise;
}

function searchRecords(
  query: string,
  index: LunrIndex,
  records: SearchRecord[],
): SearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const scores = new Map<string, number>();

  // 1) lunr 검색 (영문/숫자 토큰은 lunr이 처리)
  try {
    const lunrQuery = trimmed
      .split(/\s+/)
      .flatMap((token) => {
        const escaped = token.replace(/[:~^*+\-]/g, ' ').trim();
        if (!escaped) return [];
        return [escaped, `${escaped}*`];
      })
      .join(' ');
    if (lunrQuery) {
      index.search(lunrQuery).forEach((r) => {
        scores.set(r.ref, (scores.get(r.ref) ?? 0) + r.score);
      });
    }
  } catch {
    // lunr query parse error는 무시 (substring fallback이 처리)
  }

  // 2) substring fallback (한국어/부분 매칭)
  const needle = trimmed.toLowerCase();
  for (const record of records) {
    let bonus = 0;
    if (record.title.toLowerCase().includes(needle)) bonus += 6;
    if (record.tags.some((t) => t.toLowerCase().includes(needle))) bonus += 4;
    if (record.categoryLabel.toLowerCase().includes(needle)) bonus += 3;
    if (record.summary.toLowerCase().includes(needle)) bonus += 1;
    if (bonus > 0) {
      scores.set(record.slug, (scores.get(record.slug) ?? 0) + bonus);
    }
  }

  const recordBySlug = new Map(records.map((r) => [r.slug, r]));
  const hits: SearchHit[] = [];
  scores.forEach((score, slug) => {
    const record = recordBySlug.get(slug);
    if (record) hits.push({ record, score });
  });

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, MAX_RESULTS);
}

function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  const idx = lowerText.indexOf(lowerQ);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--color-primary)]/20 text-gray-900 rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loadState, setLoadState] = useState<LoadState>({ status: 'idle' });
  const [activeIndex, setActiveIndex] = useState(0);

  // 다이얼로그 오픈 → 인덱스 로드 + 입력 포커스 + body scroll lock
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (loadState.status === 'idle' || loadState.status === 'error') {
      setLoadState({ status: 'loading' });
      loadSearchData()
        .then(({ index, records }) => {
          setLoadState({ status: 'ready', index, records });
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : '인덱스 로드 실패';
          setLoadState({ status: 'error', message });
        });
    }

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      clearTimeout(focusTimer);
    };
    // loadState 의존성을 일부러 제외 — 오픈 시점에만 트리거
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // 닫힐 때 검색어 초기화
  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebounced('');
      setActiveIndex(0);
    }
  }, [open]);

  // query → debounced (100ms)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 100);
    return () => clearTimeout(t);
  }, [query]);

  const hits = useMemo(() => {
    if (loadState.status !== 'ready') return [];
    return searchRecords(debounced, loadState.index, loadState.records);
  }, [debounced, loadState]);

  // hits 변경 시 활성 인덱스 보정
  useEffect(() => {
    setActiveIndex(0);
  }, [debounced]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (hits.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % hits.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + hits.length) % hits.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const hit = hits[activeIndex];
        if (hit) {
          onClose();
          window.location.href = `/posts/${hit.record.slug}`;
        }
      }
    },
    [hits, activeIndex, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[10vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="블로그 검색"
      >
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-gray-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="제목·요약·태그·카테고리에서 검색"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              hits.length > 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
          />
          <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:inline">
            ESC
          </kbd>
        </div>

        <SearchResults
          listboxId={listboxId}
          loadState={loadState}
          query={debounced}
          hits={hits}
          activeIndex={activeIndex}
          onSelect={onClose}
        />
      </div>
    </div>
  );
}

function SearchResults({
  listboxId,
  loadState,
  query,
  hits,
  activeIndex,
  onSelect,
}: {
  listboxId: string;
  loadState: LoadState;
  query: string;
  hits: SearchHit[];
  activeIndex: number;
  onSelect: () => void;
}) {
  if (loadState.status === 'loading') {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500">
        검색 인덱스를 불러오는 중…
      </div>
    );
  }

  if (loadState.status === 'error') {
    return (
      <div className="px-4 py-8 text-center text-sm text-red-500">
        검색 인덱스 로드에 실패했습니다. ({loadState.message})
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-400">
        검색어를 입력해 주세요.
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500">
        {`'${query}'에 대한 검색 결과가 없습니다.`}
      </div>
    );
  }

  return (
    <ul id={listboxId} role="listbox" className="max-h-[60vh] overflow-y-auto py-2">
      {hits.map((hit, i) => {
        const active = i === activeIndex;
        return (
          <li
            key={hit.record.slug}
            id={`${listboxId}-option-${i}`}
            role="option"
            aria-selected={active}
          >
            <Link
              href={`/posts/${hit.record.slug}`}
              onClick={onSelect}
              className={`block px-4 py-3 transition-colors ${
                active ? 'bg-[var(--color-primary)]/10' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-2 py-0.5 text-[var(--color-primary)]">
                  {hit.record.categoryLabel}
                </span>
                <time>{hit.record.date}</time>
              </div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {highlight(hit.record.title, query)}
              </div>
              {hit.record.summary && (
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                  {highlight(hit.record.summary, query)}
                </p>
              )}
              {hit.record.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-gray-500">
                  {hit.record.tags.slice(0, 4).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
