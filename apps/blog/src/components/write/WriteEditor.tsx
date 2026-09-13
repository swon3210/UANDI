'use client';

import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { WriteFields, type FormValue } from './WriteFields';
import { WritePreview } from './WritePreview';

export type PostSummary = {
  fileName: string;
  slug: string;
  title: string;
  date: string;
  draft: boolean;
};

type Status = { kind: 'idle' | 'busy' | 'ok' | 'error'; text: string };

const IDLE: Status = { kind: 'idle', text: '' };

function emptyForm(): FormValue {
  return {
    title: '',
    date: dayjs().format('YYYY-MM-DD'),
    slug: '',
    summary: '',
    category: '',
    tagsText: '',
    cover: '',
    series: '',
    seriesOrder: '1',
    featured: false,
    draft: true,
  };
}

const STATUS_COLOR: Record<Status['kind'], string> = {
  idle: 'text-gray-400',
  busy: 'text-gray-400',
  ok: 'text-emerald-600',
  error: 'text-red-600',
};

export function WriteEditor({ initialPosts }: { initialPosts: PostSummary[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [form, setForm] = useState<FormValue>(emptyForm);
  const [body, setBody] = useState('');
  const [html, setHtml] = useState('');
  const [previewPending, setPreviewPending] = useState(false);
  const [openedFileName, setOpenedFileName] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);

  // 본문의 최신값은 ref가 들고 있는다. 이미지 업로드처럼 비동기로 끝나는 편집도
  // 항상 최신 본문 위에서 치환할 수 있어야 하기 때문이다.
  const bodyRef = useRef('');
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previewSeq = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => clearTimeout(previewTimer.current);
  }, []);

  // 저장 안 한 글을 실수로 날리지 않게 — 브라우저 기본 경고를 띄운다.
  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function runPreview(markdown: string) {
    const seq = ++previewSeq.current;

    if (!markdown.trim()) {
      setHtml('');
      setPreviewPending(false);
      return;
    }

    setPreviewPending(true);
    try {
      const res = await fetch('/api/write/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });
      const data = (await res.json()) as { html?: string; error?: string };
      // 늦게 도착한 응답이 최신 프리뷰를 덮어쓰지 않게 한다.
      if (seq !== previewSeq.current) return;
      if (res.ok) setHtml(data.html ?? '');
    } catch {
      if (seq === previewSeq.current) setStatus({ kind: 'error', text: '프리뷰 렌더링 실패' });
    } finally {
      if (seq === previewSeq.current) setPreviewPending(false);
    }
  }

  // 입력할 때마다 요청을 보내지 않도록 핸들러 안에서 직접 debounce 한다.
  function schedulePreview() {
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => void runPreview(bodyRef.current), 400);
  }

  function mutateBody(update: (prev: string) => string) {
    const next = update(bodyRef.current);
    bodyRef.current = next;
    setBody(next);
    setDirty(true);
    schedulePreview();
  }

  function updateForm(patch: Partial<FormValue>) {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }

  function confirmDiscard(): boolean {
    if (!dirty) return true;
    return window.confirm('저장하지 않은 변경이 있습니다. 그대로 두고 이동할까요?');
  }

  async function refreshPosts() {
    const res = await fetch('/api/write/posts');
    if (!res.ok) return;
    const data = (await res.json()) as { posts: PostSummary[] };
    setPosts(data.posts);
  }

  async function openPost(fileName: string) {
    if (!fileName || !confirmDiscard()) return;

    const res = await fetch(`/api/write/posts?file=${encodeURIComponent(fileName)}`);
    const data = await res.json();
    if (!res.ok) {
      setStatus({ kind: 'error', text: data.error ?? '글을 불러오지 못했습니다.' });
      return;
    }

    const meta = data.meta as {
      title: string;
      date: string;
      summary: string;
      category: string;
      tags: string[];
      cover?: string;
      series?: string;
      seriesOrder?: number;
      featured?: boolean;
      draft?: boolean;
    };

    setForm({
      title: meta.title,
      date: meta.date,
      slug: data.slug as string,
      summary: meta.summary,
      category: meta.category,
      tagsText: meta.tags.join(', '),
      cover: meta.cover ?? '',
      series: meta.series ?? '',
      seriesOrder: String(meta.seriesOrder ?? 1),
      featured: meta.featured ?? false,
      draft: meta.draft ?? false,
    });

    bodyRef.current = data.body as string;
    setBody(data.body as string);
    setOpenedFileName(data.fileName as string);
    setDirty(false);
    setStatus(IDLE);
    void runPreview(data.body as string);
  }

  function startNewPost() {
    if (!confirmDiscard()) return;

    setForm(emptyForm());
    bodyRef.current = '';
    setBody('');
    setHtml('');
    setOpenedFileName(null);
    setDirty(false);
    setStatus(IDLE);
  }

  async function save() {
    const tags = form.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    setStatus({ kind: 'busy', text: '저장 중…' });

    const res = await fetch('/api/write/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: form.slug.trim(),
        body: bodyRef.current,
        originalFileName: openedFileName ?? undefined,
        meta: {
          title: form.title.trim(),
          date: form.date,
          summary: form.summary.trim(),
          category: form.category,
          tags,
          cover: form.cover.trim() || undefined,
          series: form.series || undefined,
          seriesOrder: form.series ? Number(form.seriesOrder) || 1 : undefined,
          featured: form.featured,
          draft: form.draft,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus({ kind: 'error', text: data.error ?? '저장에 실패했습니다.' });
      return;
    }

    setOpenedFileName(data.fileName as string);
    setDirty(false);
    setStatus({ kind: 'ok', text: `저장됨 — content/posts/${data.fileName}` });
    await refreshPosts();
  }

  async function insertImage(file: File) {
    const token = `![업로드 중…](uploading-${Math.random().toString(36).slice(2, 8)})`;
    const caret = textareaRef.current?.selectionStart ?? bodyRef.current.length;

    // 이미지는 문단 안에 끼지 않고 제 줄에 서야 한다 — 앞뒤 빈 줄을 필요한 만큼만 채운다.
    mutateBody((prev) => {
      const before = prev.slice(0, caret);
      const after = prev.slice(caret);
      const lead =
        before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
      const trail = after.startsWith('\n') || after === '' ? '\n' : '\n\n';
      return `${before}${lead}${token}${trail}${after}`;
    });
    setStatus({ kind: 'busy', text: '이미지 업로드 중…' });

    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('slug', form.slug.trim());

      const res = await fetch('/api/write/images', { method: 'POST', body: payload });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '이미지 저장에 실패했습니다.');

      mutateBody((prev) => prev.replace(token, `![](${data.url})`));
      setStatus({ kind: 'ok', text: `이미지 저장됨 — apps/blog/public${data.url}` });
    } catch (error) {
      mutateBody((prev) => prev.replace(token, ''));
      setStatus({
        kind: 'error',
        text: error instanceof Error ? error.message : '이미지 저장에 실패했습니다.',
      });
    }
  }

  function imagesFrom(list: FileList | null | undefined): File[] {
    return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'));
  }

  const targetFileName =
    form.date && form.slug.trim() ? `${form.date}-${form.slug.trim()}.md` : '(날짜·slug 입력 전)';

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-14 flex flex-col bg-white"
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          void save();
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-2">
        <select
          className="max-w-[260px] rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700"
          value={openedFileName ?? ''}
          onChange={(event) => void openPost(event.target.value)}
        >
          <option value="">새 글</option>
          {posts.map((post) => (
            <option key={post.fileName} value={post.fileName}>
              {post.draft ? '[초안] ' : ''}
              {post.date} · {post.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          onClick={startNewPost}
        >
          새 글
        </button>

        <span className="font-mono text-[11px] text-gray-400">content/posts/{targetFileName}</span>

        <div className="ml-auto flex items-center gap-3">
          <span className={`text-xs ${STATUS_COLOR[status.kind]}`}>
            {status.text || (dirty ? '저장 안 됨' : '')}
          </span>
          <button
            type="button"
            className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
            onClick={() => void save()}
            disabled={status.kind === 'busy'}
          >
            저장 (⌘S)
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col overflow-y-auto border-r border-gray-100">
          <WriteFields value={form} onChange={updateForm} />

          <textarea
            ref={textareaRef}
            className="min-h-[400px] flex-1 resize-none px-4 py-4 font-mono text-sm leading-relaxed text-gray-900 focus:outline-none"
            value={body}
            onChange={(event) => {
              const { value } = event.target;
              mutateBody(() => value);
            }}
            onPaste={(event) => {
              const images = imagesFrom(event.clipboardData.files);
              if (images.length === 0) return;
              event.preventDefault();
              images.forEach((file) => void insertImage(file));
            }}
            onDrop={(event) => {
              const images = imagesFrom(event.dataTransfer.files);
              if (images.length === 0) return;
              event.preventDefault();
              images.forEach((file) => void insertImage(file));
            }}
            placeholder="여기에 마크다운을 씁니다. 이미지는 복사해서 붙여넣기(⌘V)하거나 끌어다 놓으면 자동으로 저장됩니다."
            spellCheck={false}
          />

          <p className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400">
            붙여넣은 이미지는{' '}
            <code>apps/blog/public/images/posts/{form.slug.trim() || '_inbox'}/</code>에 저장됩니다.
            slug를 먼저 정하면 글별 폴더로 들어갑니다.
          </p>
        </div>

        <WritePreview html={html} pending={previewPending} />
      </div>
    </div>
  );
}
