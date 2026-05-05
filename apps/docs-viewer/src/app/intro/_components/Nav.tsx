'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@uandi/ui';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-[100] flex h-[60px] items-center justify-between"
      style={{
        padding: '0 clamp(20px, 5vw, 80px)',
        background: scrolled ? 'rgba(250,250,248,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid hsl(30 15% 90%)' : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
      }}
    >
      <Logo variant="full" height={36} />
      <a
        href="#cta"
        className="rounded-[10px] bg-coral-400 px-[22px] py-[9px] text-[14px] font-medium text-white transition-colors duration-150 hover:bg-coral-500 active:bg-coral-600"
      >
        시작하기
      </a>
    </nav>
  );
}
