'use client';

import { useCallback, useEffect, useState } from 'react';

// 개인 TODO(secret gist)를 실시간으로 읽어 렌더링한다.
// 데이터 원본은 songwon repo의 career/schedule.md → todo.md → gist 순으로 흘러온다.
const GIST_ID = '57204f765cef9b3c283cb5e0379ec06b';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; updatedAt: string; lines: string[] };

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// todo.md의 인라인 마크다운(굵게·취소선·코드·링크)만 최소 변환한다.
// escapeHtml을 먼저 통과시키므로 dangerouslySetInnerHTML에 안전하다.
function inlineHtml(s: string): string {
  return escapeHtml(s)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-gray-100 px-1 py-0.5 text-[12px]">$1</code>',
    );
}

export function TodoView() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(String(res.status));
      const gist = (await res.json()) as {
        updated_at: string;
        files: Record<string, { content?: string }>;
      };
      const content = gist.files['todo.md']?.content;
      if (!content) throw new Error('no content');
      setState({
        status: 'ready',
        updatedAt: gist.updated_at,
        lines: content.split('\n'),
      });
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <article>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
        Private
      </p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">지금 할 일</h1>
      {state.status === 'ready' ? (
        <p className="mt-2 text-xs text-gray-400">
          마지막 동기화{' '}
          {new Date(state.updatedAt).toLocaleString('ko-KR', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      ) : null}

      {state.status === 'loading' ? (
        <p className="mt-10 text-sm text-gray-400">불러오는 중…</p>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-10">
          <p className="text-sm text-gray-500">목록을 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {state.status === 'ready' ? (
        <div className="mt-6 space-y-1.5">
          {state.lines.map((line, i) => {
            if (line.startsWith('## ')) {
              return (
                <h2
                  key={i}
                  className="pt-6 pb-1 text-sm font-semibold text-gray-900"
                >
                  {line.slice(3)}
                </h2>
              );
            }
            const checkbox = line.match(/^- \[( |x)\] (.*)$/);
            if (checkbox) {
              const checked = checkbox[1] === 'x';
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                      checked
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span
                    className={`min-w-0 text-sm leading-relaxed ${checked ? 'text-gray-400' : 'text-gray-700'}`}
                    dangerouslySetInnerHTML={{ __html: inlineHtml(checkbox[2]) }}
                  />
                </div>
              );
            }
            if (line.startsWith('- ')) {
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-0.5 w-4 shrink-0 text-center text-gray-300">
                    ·
                  </span>
                  <span
                    className="min-w-0 text-sm leading-relaxed text-gray-500"
                    dangerouslySetInnerHTML={{ __html: inlineHtml(line.slice(2)) }}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      ) : null}
    </article>
  );
}
