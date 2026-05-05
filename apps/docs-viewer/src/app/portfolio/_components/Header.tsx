import { Logo } from '@uandi/ui';
import { Github, ExternalLink } from 'lucide-react';

const REPO_URL = 'https://github.com/swon3210/UANDI';
const DEMO_URL = '/intro';

export function Header() {
  return (
    <header className="mb-15 flex items-center justify-between border-b border-stone-200 py-6">
      <Logo variant="full" height={34} />
      <div className="flex gap-2.5">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-[7px] text-[13px] font-medium text-stone-700 transition-colors duration-150 hover:bg-stone-100"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
        <a
          href={DEMO_URL}
          className="inline-flex items-center gap-1.5 rounded-lg bg-coral-400 px-3.5 py-[7px] text-[13px] font-medium text-white transition-colors duration-150 hover:bg-coral-500"
        >
          Live Demo
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </header>
  );
}
