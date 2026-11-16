'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AppleLogo, GooglePlayLogo } from '@phosphor-icons/react';
import { Mail } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import mascotSplash from '@uandi/ui/assets/mascot-splash.png';

export type AppInstallLandingProps = {
  playStoreUrl: string;
  appStoreUrl: string;
  /** 초대 링크(/invite/{code})로 들어온 경우 — 설치 후 링크를 다시 누르라고 안내한다 */
  fromInvite?: boolean;
  className?: string;
};

/**
 * 앱 설치 안내 — 일반 브라우저로 들어온 사람에게 보여준다(docs/pages/08-get-app.md).
 * 로그인 버튼은 두지 않는다. 브라우저에서는 로그인 자체를 받지 않는다.
 */
export function AppInstallLanding({
  playStoreUrl,
  appStoreUrl,
  fromInvite = false,
  className,
}: AppInstallLandingProps) {
  return (
    <div
      data-testid="app-install-landing"
      className={cn('flex w-full max-w-sm flex-col items-center', className)}
    >
      {fromInvite ? (
        <div
          data-testid="app-install-invite-hint"
          className="mb-6 flex w-full items-start gap-3 rounded-2xl border border-coral-200 bg-coral-50 p-4 text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
            <Mail size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">초대 링크로 들어왔어요</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              앱을 설치한 뒤 받은 초대 링크를 다시 누르면 짝꿍과 연결돼요
            </p>
          </div>
        </div>
      ) : null}

      <Image
        src={mascotSplash}
        alt="둘이 함께 가계부를 쓰는 말랑 마스코트"
        priority
        sizes="200px"
        draggable={false}
        className="h-auto w-[180px] select-none sm:w-[200px]"
      />

      <h1 className="mt-5 text-center text-2xl font-bold leading-tight text-foreground">
        말랑 가계부는
        <br />
        앱에서 만나요
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
        둘의 가계부를 안전하게 지키기 위해
        <br />웹 브라우저에서는 로그인할 수 없어요
      </p>

      <div className="mt-8 flex w-full flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <a
            data-testid="play-store-link"
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GooglePlayLogo weight="fill" aria-hidden />
            Google Play에서 받기
          </a>
        </Button>
        <Button asChild size="lg" className="w-full bg-black text-white hover:bg-black/90">
          <a
            data-testid="app-store-link"
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppleLogo weight="fill" aria-hidden />
            App Store에서 받기
          </a>
        </Button>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          개인정보처리방침
        </Link>
        {' · '}
        <Link href="/support" className="underline underline-offset-2 hover:text-foreground">
          고객 지원
        </Link>
      </p>
    </div>
  );
}
