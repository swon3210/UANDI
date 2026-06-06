'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Share, Plus, Download, Smartphone } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Badge,
  Logo,
  Separator,
} from '@uandi/ui';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

// 'standalone'은 iOS Safari 전용 navigator 확장 — 표준 타입에는 없음
type NavigatorWithStandalone = Navigator & { standalone?: boolean };

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown';
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone = (window.navigator as NavigatorWithStandalone).standalone === true;
  return mq || iosStandalone;
}

type InstallPwaBannerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InstallPwaBanner({ open, onOpenChange }: InstallPwaBannerProps) {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [standalone, setStandalone] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setStandalone(isStandalone());

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    const installed = () => {
      setStandalone(true);
      deferredPromptRef.current = null;
      setCanPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleAndroidInstall = useCallback(async () => {
    const evt = deferredPromptRef.current;
    if (!evt) return;
    setInstalling(true);
    try {
      await evt.prompt();
      const result = await evt.userChoice;
      if (result.outcome === 'accepted') {
        deferredPromptRef.current = null;
        setCanPrompt(false);
        onOpenChange(false);
      }
    } finally {
      setInstalling(false);
    }
  }, [onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] max-h-[90vh] overflow-y-auto"
        data-testid="install-pwa-sheet"
      >
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3">
            <Logo variant="app-icon" className="h-12 w-12 shrink-0" />
            <div>
              <SheetTitle>홈 화면에 추가</SheetTitle>
              <SheetDescription>
                앱처럼 실행되고, 백그라운드 푸시 알림을 받을 수 있어요.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {standalone ? (
          <section className="mt-6 rounded-lg bg-secondary p-4" data-testid="install-already-state">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">설치됨</Badge>
              <span className="text-sm font-medium">이미 홈 화면에 추가되어 있어요</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              백그라운드 푸시 알림이 정상적으로 전달됩니다.
            </p>
          </section>
        ) : (
          <div className="mt-6 space-y-6">
            {platform === 'ios' && <IosGuide />}
            {platform === 'android' && (
              <AndroidGuide
                canPrompt={canPrompt}
                installing={installing}
                onInstall={handleAndroidInstall}
              />
            )}
            {platform === 'desktop' && (
              <DesktopGuide
                canPrompt={canPrompt}
                installing={installing}
                onInstall={handleAndroidInstall}
              />
            )}
            {platform === 'unknown' && <UnknownGuide />}

            <Separator />

            <p className="text-xs text-muted-foreground">
              모바일 브라우저에서는 홈 화면에 설치된 상태여야만 백그라운드(브라우저가 꺼진 상태)
              푸시 알림이 도달합니다.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {n}
    </div>
  );
}

function IosGuide() {
  return (
    <section data-testid="install-ios-guide" className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge>iOS Safari</Badge>
        <span className="text-sm text-muted-foreground">iOS 16.4 이상</span>
      </div>
      <ol className="space-y-3">
        <li className="flex items-start gap-3">
          <StepNumber n={1} />
          <div className="flex-1 text-sm">
            Safari 하단의{' '}
            <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-medium">
              <Share size={14} />
              공유
            </span>{' '}
            버튼을 누르세요
          </div>
        </li>
        <li className="flex items-start gap-3">
          <StepNumber n={2} />
          <div className="flex-1 text-sm">
            메뉴를 아래로 스크롤해{' '}
            <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-medium">
              <Plus size={14} />홈 화면에 추가
            </span>{' '}
            를 선택하세요
          </div>
        </li>
        <li className="flex items-start gap-3">
          <StepNumber n={3} />
          <div className="flex-1 text-sm">
            오른쪽 상단의 <strong>추가</strong>를 누르면 홈 화면에 MOA 아이콘이 생겨요
          </div>
        </li>
        <li className="flex items-start gap-3">
          <StepNumber n={4} />
          <div className="flex-1 text-sm">
            홈 화면의 MOA 아이콘으로 앱을 실행하고, 알림 설정에서 <strong>알림 켜기</strong>를
            눌러주세요
          </div>
        </li>
      </ol>
    </section>
  );
}

type AndroidGuideProps = {
  canPrompt: boolean;
  installing: boolean;
  onInstall: () => void;
};

function AndroidGuide({ canPrompt, installing, onInstall }: AndroidGuideProps) {
  return (
    <section data-testid="install-android-guide" className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge>Android Chrome</Badge>
      </div>

      {canPrompt ? (
        <>
          <p className="text-sm text-muted-foreground">
            아래 버튼을 누르면 홈 화면 추가 다이얼로그가 열려요.
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={onInstall}
            disabled={installing}
            data-testid="install-pwa-prompt-button"
          >
            <Download size={16} className="mr-2" />
            {installing ? '설치 중…' : '홈 화면에 추가'}
          </Button>
        </>
      ) : (
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <StepNumber n={1} />
            <div className="flex-1 text-sm">Chrome 우측 상단의 ⋮ 메뉴를 누르세요</div>
          </li>
          <li className="flex items-start gap-3">
            <StepNumber n={2} />
            <div className="flex-1 text-sm">
              <strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong>를 선택하세요
            </div>
          </li>
          <li className="flex items-start gap-3">
            <StepNumber n={3} />
            <div className="flex-1 text-sm">
              홈 화면의 MOA 아이콘으로 앱을 실행한 뒤 알림을 켜주세요
            </div>
          </li>
        </ol>
      )}
    </section>
  );
}

type DesktopGuideProps = AndroidGuideProps;

function DesktopGuide({ canPrompt, installing, onInstall }: DesktopGuideProps) {
  return (
    <section data-testid="install-desktop-guide" className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">데스크톱</Badge>
      </div>
      {canPrompt ? (
        <Button
          type="button"
          className="w-full"
          onClick={onInstall}
          disabled={installing}
          data-testid="install-pwa-prompt-button"
        >
          <Download size={16} className="mr-2" />
          {installing ? '설치 중…' : '데스크톱에 앱 설치'}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          백그라운드 푸시는 모바일에서만 의미가 있어요. 모바일 기기에서 이 페이지를 열어주세요.
        </p>
      )}
    </section>
  );
}

function UnknownGuide() {
  return (
    <section data-testid="install-unknown-guide" className="flex items-center gap-3 text-sm">
      <Smartphone size={20} className="text-muted-foreground" />
      <p>브라우저 환경을 확인할 수 없어요. 모바일에서 다시 시도해주세요.</p>
    </section>
  );
}
