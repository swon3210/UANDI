'use client';

import { Logo } from '@uandi/ui';
import { Github, ExternalLink } from 'lucide-react';
import { useReveal } from './useReveal';

const REPO_URL = 'https://github.com/swon3210/UANDI';
const DEMO_URL = '/intro';

export function Footer() {
  const ref = useReveal();
  return (
    <footer
      ref={ref}
      className="landing-fade-up flex flex-wrap items-center justify-between gap-5 border-t border-stone-200 pt-10 pb-15"
    >
      <div>
        <Logo variant="full" height={34} />
        <p className="mt-2 text-[12.5px] text-stone-400">
          신혼부부를 위한 프라이빗 라이프 매니지먼트
        </p>
      </div>
      <div className="flex gap-2.5">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-[9px] text-[13px] font-medium text-stone-700 transition-colors duration-150 hover:bg-stone-100"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
        <a
          href={DEMO_URL}
          className="inline-flex items-center gap-1.5 rounded-lg bg-coral-400 px-4 py-[9px] text-[13px] font-medium text-white transition-colors duration-150 hover:bg-coral-500"
        >
          Live Demo
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </footer>
  );
}
