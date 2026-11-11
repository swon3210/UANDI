'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { Header, Button, Avatar, AvatarImage, AvatarFallback } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLocaleSetting } from '@/hooks/useLocaleSetting';
import { LanguageSettingRow } from '@/components/settings/LanguageSettingRow';

/** 설정 첫 화면. 회원탈퇴는 프로필 편집 페이지 맨 아래로 옮겼다(docs/04-auth-flow.md). */
export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { locale, setLocale, isPending } = useLocaleSetting();

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="settings-header"
        title={t('title')}
        leftSlot={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label={tCommon('back')}
          >
            <ArrowLeft size={20} />
          </Button>
        }
      />
      <main className="max-w-md mx-auto w-full px-4 pt-6 space-y-6">
        {/* 프로필 섹션 — 클릭 시 프로필 편집으로 이동 */}
        <Link
          href="/settings/profile"
          data-testid="settings-profile"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
        >
          <Avatar className="h-16 w-16" data-testid="settings-profile-avatar">
            {user.photoURL ? <AvatarImage src={user.photoURL} alt={user.displayName} /> : null}
            <AvatarFallback>
              <UserIcon size={24} />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col">
            <span className="text-lg font-semibold" data-testid="settings-profile-name">
              {user.displayName}
            </span>
            <span className="text-sm text-muted-foreground" data-testid="settings-profile-email">
              {user.email}
            </span>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </Link>

        <div className="space-y-2">
          <Link
            href="/inner/cashbook/settings"
            data-testid="settings-cashbook"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium"
          >
            {t('cashbook')}
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
          <Link
            href="/settings/ai"
            data-testid="settings-ai"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium"
          >
            {t('ai')}
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
          <LanguageSettingRow value={locale} onChange={setLocale} disabled={isPending} />
        </div>
      </main>
    </div>
  );
}
