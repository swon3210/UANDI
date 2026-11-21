import { Mail, KeyRound } from 'lucide-react';
import { Badge } from '../../components/badge';

/** 로그인에 쓴 소셜 계정 종류. 알 수 없으면 null(행을 숨긴다). */
export type AccountSignInProvider = 'google' | 'apple';

export type AccountInfoCardProps = {
  email: string;
  provider: AccountSignInProvider | null;
};

const PROVIDER_LABEL: Record<AccountSignInProvider, string> = {
  google: 'Google',
  apple: 'Apple',
};

/**
 * 계정 관리 페이지 상단의 계정 정보 카드 — 로그인 이메일과 로그인 수단을 읽기 전용으로 보여준다.
 * 프레젠테이션 전용. 로그아웃·회원탈퇴 같은 동작은 페이지가 붙인다.
 */
export function AccountInfoCard({ email, provider }: AccountInfoCardProps) {
  return (
    <dl
      className="divide-y divide-border rounded-xl border border-border bg-card"
      data-testid="account-info-card"
    >
      <div className="flex items-center gap-3 p-4">
        <Mail size={18} className="shrink-0 text-muted-foreground" aria-hidden />
        <dt className="w-20 shrink-0 text-sm text-muted-foreground">이메일</dt>
        <dd
          className="min-w-0 flex-1 truncate text-right text-sm font-medium"
          data-testid="account-email"
        >
          {email}
        </dd>
      </div>
      {provider ? (
        <div className="flex items-center gap-3 p-4">
          <KeyRound size={18} className="shrink-0 text-muted-foreground" aria-hidden />
          <dt className="w-20 shrink-0 text-sm text-muted-foreground">로그인 수단</dt>
          <dd className="flex flex-1 justify-end">
            <Badge variant="secondary" data-testid="account-provider">
              {PROVIDER_LABEL[provider]} 계정
            </Badge>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
