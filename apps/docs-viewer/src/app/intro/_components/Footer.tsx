import Image from 'next/image';
import { Logo } from '@uandi/ui';

export function Footer() {
  return (
    <footer
      className="border-t border-stone-200 bg-white"
      style={{ padding: '24px clamp(20px,5vw,80px)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
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
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-stone-400">
        iOS 앱은 현재 <span className="text-stone-500">가계부 기능</span>을 우선 제공합니다. 사진첩 · 재테크 ·
        커뮤니티는 순차적으로 열릴 예정이에요. (Android · 웹에서는 모든 기능을 이용할 수 있어요.)
      </p>
    </footer>
  );
}
