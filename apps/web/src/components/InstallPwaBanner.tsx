'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('pwa');
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
              <SheetTitle>{t('title')}</SheetTitle>
              <SheetDescription>{t('description')}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {standalone ? (
          <section className="mt-6 rounded-lg bg-secondary p-4" data-testid="install-already-state">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{t('installed')}</Badge>
              <span className="text-sm font-medium">{t('alreadyInstalled')}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('alreadyInstalledHint')}</p>
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

            <p className="text-xs text-muted-foreground">{t('mobileOnlyNote')}</p>
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

/** 안내 문구 안의 메뉴 칩(공유 / 홈 화면에 추가) */
function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-medium">
      {icon}
      {children}
    </span>
  );
}

const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

function IosGuide() {
  const t = useTranslations('pwa.ios');
  return (
    <section data-testid="install-ios-guide" className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge>iOS Safari</Badge>
        <span className="text-sm text-muted-foreground">{t('minVersion')}</span>
      </div>
      <ol className="space-y-3">
        <li className="flex items-start gap-3">
          <StepNumber n={1} />
          <div className="flex-1 text-sm">
            {t.rich('step1', {
              chip: (chunks) => <Chip icon={<Share size={14} />}>{chunks}</Chip>,
            })}
          </div>
        </li>
        <li className="flex items-start gap-3">
          <StepNumber n={2} />
          <div className="flex-1 text-sm">
            {t.rich('step2', { chip: (chunks) => <Chip icon={<Plus size={14} />}>{chunks}</Chip> })}
          </div>
        </li>
        <li className="flex items-start gap-3">
          <StepNumber n={3} />
          <div className="flex-1 text-sm">{t.rich('step3', { strong })}</div>
        </li>
        <li className="flex items-start gap-3">
          <StepNumber n={4} />
          <div className="flex-1 text-sm">{t.rich('step4', { strong })}</div>
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
  const t = useTranslations('pwa.android');
  return (
    <section data-testid="install-android-guide" className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge>Android Chrome</Badge>
      </div>

      {canPrompt ? (
        <>
          <p className="text-sm text-muted-foreground">{t('promptHint')}</p>
          <Button
            type="button"
            className="w-full"
            onClick={onInstall}
            disabled={installing}
            data-testid="install-pwa-prompt-button"
          >
            <Download size={16} className="mr-2" />
            {installing ? t('installing') : t('install')}
          </Button>
        </>
      ) : (
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <StepNumber n={1} />
            <div className="flex-1 text-sm">{t('step1')}</div>
          </li>
          <li className="flex items-start gap-3">
            <StepNumber n={2} />
            <div className="flex-1 text-sm">{t.rich('step2', { strong })}</div>
          </li>
          <li className="flex items-start gap-3">
            <StepNumber n={3} />
            <div className="flex-1 text-sm">{t('step3')}</div>
          </li>
        </ol>
      )}
    </section>
  );
}

type DesktopGuideProps = AndroidGuideProps;

function DesktopGuide({ canPrompt, installing, onInstall }: DesktopGuideProps) {
  const t = useTranslations('pwa');
  return (
    <section data-testid="install-desktop-guide" className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{t('desktop.badge')}</Badge>
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
          {installing ? t('android.installing') : t('desktop.install')}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">{t('desktop.mobileOnly')}</p>
      )}
    </section>
  );
}

function UnknownGuide() {
  const t = useTranslations('pwa');
  return (
    <section data-testid="install-unknown-guide" className="flex items-center gap-3 text-sm">
      <Smartphone size={20} className="text-muted-foreground" />
      <p>{t('unknown')}</p>
    </section>
  );
}
