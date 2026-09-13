'use client';

import { CATEGORIES, CATEGORY_SLUGS, SERIES } from '@/lib/taxonomy';

export type FormValue = {
  title: string;
  date: string;
  slug: string;
  summary: string;
  category: string;
  tagsText: string;
  cover: string;
  series: string;
  seriesOrder: string;
  featured: boolean;
  draft: boolean;
};

const SERIES_SLUGS = Object.keys(SERIES) as (keyof typeof SERIES)[];

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 ' +
  'placeholder:text-gray-300 focus:border-[var(--color-primary)] focus:outline-none';

const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400';

export function WriteFields({
  value,
  onChange,
}: {
  value: FormValue;
  onChange: (patch: Partial<FormValue>) => void;
}) {
  return (
    <div className="space-y-3 border-b border-gray-100 px-4 py-4">
      <div>
        <label className={labelClass} htmlFor="write-title">
          제목
        </label>
        <input
          id="write-title"
          className={inputClass}
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="한글 제목"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="write-date">
            날짜
          </label>
          <input
            id="write-date"
            type="date"
            className={inputClass}
            value={value.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="write-slug">
            slug (파일명 · URL)
          </label>
          <input
            id="write-slug"
            className={inputClass}
            value={value.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            placeholder="markdown-editor"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="write-summary">
          요약
        </label>
        <textarea
          id="write-summary"
          rows={2}
          className={`${inputClass} resize-none`}
          value={value.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="1~2문장 — 글의 척추가 드러나게"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="write-category">
            카테고리
          </label>
          <select
            id="write-category"
            className={inputClass}
            value={value.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            <option value="">선택하세요</option>
            {CATEGORY_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {CATEGORIES[slug].label} ({slug})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="write-tags">
            태그 (쉼표로 구분 · 2~4개)
          </label>
          <input
            id="write-tags"
            className={inputClass}
            value={value.tagsText}
            onChange={(e) => onChange({ tagsText: e.target.value })}
            placeholder="블로그, 에디터"
          />
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
          선택 항목 (커버 · 시리즈 · 대표글 · 초안)
        </summary>

        <div className="mt-3 space-y-3">
          <div>
            <label className={labelClass} htmlFor="write-cover">
              커버 이미지 경로
            </label>
            <input
              id="write-cover"
              className={inputClass}
              value={value.cover}
              onChange={(e) => onChange({ cover: e.target.value })}
              placeholder="/mascot/splash.png"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="write-series">
                시리즈
              </label>
              <select
                id="write-series"
                className={inputClass}
                value={value.series}
                onChange={(e) => onChange({ series: e.target.value })}
              >
                <option value="">없음</option>
                {SERIES_SLUGS.map((slug) => (
                  <option key={slug} value={slug}>
                    {SERIES[slug].title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="write-series-order">
                시리즈 순서
              </label>
              <input
                id="write-series-order"
                type="number"
                min={1}
                className={inputClass}
                value={value.seriesOrder}
                onChange={(e) => onChange({ seriesOrder: e.target.value })}
                disabled={!value.series}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.featured}
                onChange={(e) => onChange({ featured: e.target.checked })}
              />
              홈 대표글
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.draft}
                onChange={(e) => onChange({ draft: e.target.checked })}
              />
              초안 (draft — 배포본에서 숨김)
            </label>
          </div>
        </div>
      </details>
    </div>
  );
}
