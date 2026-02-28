'use client';

import { useEffect, useRef } from 'react';

export function DocContent({ html }: { html: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // 모든 코드 블록에 복사 버튼 추가
    const codeBlocks = ref.current.querySelectorAll('pre');
    codeBlocks.forEach((pre) => {
      if (pre.querySelector('[data-copy-btn]')) return;

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const button = document.createElement('button');
      button.dataset.copyBtn = 'true';
      button.textContent = '복사';
      button.className =
        'absolute top-2 right-2 text-xs px-2 py-1 rounded ' +
        'bg-white/10 hover:bg-white/20 text-white/70 transition-colors ' +
        'font-mono leading-none';

      button.addEventListener('click', () => {
        const code = pre.querySelector('code');
        if (!code) return;
        navigator.clipboard.writeText(code.textContent ?? '').then(() => {
          button.textContent = '복사됨 ✓';
          setTimeout(() => {
            button.textContent = '복사';
          }, 2000);
        });
      });

      wrapper.appendChild(button);
    });
  }, [html]);

  return (
    <article
      ref={ref}
      className={[
        'prose prose-neutral max-w-none',
        'prose-headings:font-semibold prose-headings:text-[#1C1917]',
        'prose-a:text-[#E8837A] prose-a:no-underline hover:prose-a:underline',
        'prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:p-0 prose-pre:bg-transparent prose-pre:rounded-xl prose-pre:overflow-hidden',
        'prose-table:text-sm',
        'px-8 py-10',
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
