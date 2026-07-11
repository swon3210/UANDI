import Image from 'next/image';
import { Logo } from '@uandi/ui';

export function Footer() {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white"
      style={{ padding: '24px clamp(20px,5vw,80px)' }}
    >
      <div className="flex items-center gap-2.5">
        <Image
          src="/mascot/face.png"
          alt=""
          width={865}
          height={905}
          className="h-7 w-7 object-contain"
        />
        <Logo variant="full" height={28} />
      </div>
      <p className="text-[12px] text-stone-400">© 2026 말랑 가계부. 둘이서 만드는 우리만의 일상.</p>
    </footer>
  );
}
