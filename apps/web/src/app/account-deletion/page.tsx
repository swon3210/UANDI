import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Trash2, Mail } from 'lucide-react';
import { Header, Button } from '@uandi/ui';

export const metadata: Metadata = {
  title: '계정 및 데이터 삭제 | MOA',
  description: 'MOA 계정과 데이터를 삭제하는 방법을 안내합니다.',
  robots: {
    index: true,
    follow: true,
  },
};

const CONTACT_EMAIL = 'swon3210@gmail.com';

export default function AccountDeletionPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="계정 및 데이터 삭제"
        leftSlot={
          <Button variant="ghost" size="icon" asChild aria-label="홈으로">
            <Link href="/">
              <ArrowLeft size={20} />
            </Link>
          </Button>
        }
      />
      <main className="max-w-2xl mx-auto w-full px-4 py-6">
        <article className="prose prose-sm max-w-none text-foreground">
          <p className="mt-2">
            MOA(이하 &lsquo;서비스&rsquo;) 이용자는 언제든지 본인의 계정과 개인정보 삭제를 요청할 수
            있습니다. 아래 방법 중 편한 방법을 이용해 주세요.
          </p>

          <h2 className="mt-8 text-lg font-semibold">방법 1. 앱에서 직접 삭제 (권장)</h2>
          <p>앱에 로그인한 상태에서 아래 경로로 직접 계정을 삭제할 수 있습니다.</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>MOA 앱 실행 후 로그인</li>
            <li>
              하단 메뉴 또는 우측 상단에서 <strong>설정</strong> 이동
            </li>
            <li>
              <strong>회원 탈퇴</strong> 선택 후 안내에 따라 진행
            </li>
          </ol>

          <h2 className="mt-8 text-lg font-semibold">방법 2. 이메일로 삭제 요청</h2>
          <p>
            앱에 접근할 수 없는 경우(앱 삭제, 로그인 불가 등) 아래 이메일로 삭제를 요청해 주세요.
            본인 확인 후 처리해 드립니다.
          </p>
          <p className="flex items-center gap-1.5">
            <Mail size={16} className="text-primary" />
            <a className="font-medium underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            요청 시 가입에 사용한 Google 계정 이메일을 함께 알려주시면 처리가 빠릅니다.
          </p>

          <h2 className="mt-8 text-lg font-semibold">삭제되는 데이터</h2>
          <p>계정 삭제 요청 시 다음 정보가 지체 없이 삭제됩니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Google 계정 연동 정보(이메일, 이름, 프로필 사진 URL, 계정 고유 식별자)</li>
            <li>회원 프로필 등 본인 계정 정보</li>
            <li>인증(로그인) 계정 및 세션 정보</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">예외적으로 보관되는 데이터</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>커플과 함께 만든 콘텐츠</strong>(공유 사진, 가계부 내역 등)는 연결된 상대방이
              계속 이용할 수 있도록, 상대방의 이용에 영향을 주지 않는 범위 내에서 남을 수 있습니다.
              상대방도 탈퇴하거나 해당 콘텐츠 삭제를 요청하면 함께 파기됩니다.
            </li>
            <li>
              관련 법령에 따라 보존이 요구되는 정보는 해당 법정 기간 동안 별도로 보관 후 파기합니다.
            </li>
            <li>
              가계부 점검에 첨부한 거래 명세 이미지는 점검을 완료하면 즉시 삭제되며, 이용자가 직접
              삭제하거나 회원 탈퇴 시에도 함께 파기됩니다.
            </li>
          </ul>

          <p className="mt-8 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Trash2 size={14} />
            자세한 처리 내용은{' '}
            <Link href="/privacy" className="underline">
              개인정보처리방침
            </Link>
            에서 확인할 수 있습니다.
          </p>
        </article>
      </main>
    </div>
  );
}
