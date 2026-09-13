const PROSE_CLASS = [
  'prose prose-neutral max-w-none',
  'prose-headings:font-semibold prose-headings:text-gray-900',
  'prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline',
  'prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:rounded-xl prose-pre:overflow-hidden',
  'prose-table:text-sm',
].join(' ');

export function WritePreview({ html, pending }: { html: string; pending: boolean }) {
  return (
    <div className="relative h-full overflow-y-auto bg-white px-6 py-6">
      {pending ? (
        <span className="absolute right-4 top-3 text-[11px] text-gray-300">렌더링 중…</span>
      ) : null}

      {html ? (
        <article className={PROSE_CLASS} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="text-sm text-gray-300">
          왼쪽에 마크다운을 쓰면, 실제 글 페이지와 같은 파이프라인으로 렌더링해 여기에 보여줍니다.
        </p>
      )}
    </div>
  );
}
