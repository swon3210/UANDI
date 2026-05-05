import type { ReactNode } from 'react';

type TagColor = 'coral' | 'sage' | 'coral-light';

const COLOR_MAP: Record<TagColor, { text: string; bg: string; border: string }> = {
  coral: {
    text: 'text-coral-400',
    bg: 'bg-coral-50',
    border: 'border-coral-100',
  },
  'coral-light': {
    text: 'text-coral-300',
    bg: 'bg-coral-50',
    border: 'border-coral-100',
  },
  sage: {
    text: 'text-sage-400',
    bg: 'bg-sage-50',
    border: 'border-sage-100',
  },
};

export function Tag({ children, color = 'coral' }: { children: ReactNode; color?: TagColor }) {
  const c = COLOR_MAP[color];
  return (
    <span
      className={`mb-4 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold ${c.text} ${c.bg} ${c.border}`}
    >
      {children}
    </span>
  );
}
