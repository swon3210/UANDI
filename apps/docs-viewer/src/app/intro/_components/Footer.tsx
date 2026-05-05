import { Logo } from '@uandi/ui';

export function Footer() {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white"
      style={{ padding: '24px clamp(20px,5vw,80px)' }}
    >
      <Logo variant="full" height={28} />
      <p className="text-[12px] text-stone-400">© 2026 UANDI. 둘이서 만드는 우리만의 일상.</p>
    </footer>
  );
}
