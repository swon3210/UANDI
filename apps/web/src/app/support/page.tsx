import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, HelpCircle, Clock } from 'lucide-react';
import { Header, Button } from '@uandi/ui';

export const metadata: Metadata = {
  title: '고객 지원 | 말랑 가계부',
  description:
    '말랑 가계부 사용 중 궁금한 점이나 문제를 도와드립니다. 문의 방법과 자주 묻는 질문을 확인하세요.',
  robots: {
    index: true,
    follow: true,
  },
};

const CONTACT_EMAIL = 'swon3210@gmail.com';
const OPERATOR_NAME = '이송원';

const FAQS: { question: string; answer: React.ReactNode }[] = [
  {
    question: '커플 연결은 어떻게 하나요?',
    answer: (
      <>
        한 사람이 앱에서 <strong>초대 코드</strong>를 생성한 뒤 상대방에게 공유하고, 상대방이 그
        코드를 입력하면 두 계정이 커플로 연결됩니다. 연결 후에는 가계부와 사진 등 우리집 공간의
        콘텐츠를 함께 사용할 수 있습니다.
      </>
    ),
  },
  {
    question: '구글 로그인이 되지 않아요.',
    answer: (
      <>
        말랑 가계부는 <strong>구글(Google) 계정</strong>으로만 로그인합니다. 로그인이 계속 실패하면
        앱을 최신 버전으로 업데이트한 뒤 다시 시도해 주세요. 그래도 해결되지 않으면 사용 중인 기기와
        구글 계정 이메일을 함께 알려 주시면 빠르게 도와드리겠습니다.
      </>
    ),
  },
  {
    question: '내가 입력한 가계부 내역과 사진은 상대방에게도 보이나요?',
    answer: (
      <>
        네. 우리집 공간(가계부·갤러리)의 콘텐츠는 커플이 <strong>공동으로 소유·열람</strong>하도록
        설계되어 있어 연결된 상대방과 함께 보고 관리할 수 있습니다. 반면 재테크
        공간(환테크·투자·적금 등)은 개인 소유이며, 커플 대시보드에서는 합산된 요약만 함께
        확인합니다.
      </>
    ),
  },
  {
    question: '가계부 점검에 첨부한 거래 명세 이미지는 안전한가요?',
    answer: (
      <>
        가계부 점검(결산) 기능에서 첨부하는 카드·계좌 거래 명세 이미지는 내역 자동 인식(OCR)·분석
        용도로만 사용되며, <strong>점검을 완료하면 즉시 삭제</strong>됩니다. 자세한 내용은{' '}
        <Link href="/privacy" className="text-primary underline">
          개인정보처리방침
        </Link>
        에서 확인할 수 있습니다.
      </>
    ),
  },
  {
    question: '앱은 무료인가요?',
    answer: <>네, 말랑 가계부의 기본 기능은 무료로 이용할 수 있습니다.</>,
  },
  {
    question: '계정과 데이터를 삭제하고 싶어요.',
    answer: (
      <>
        앱 내 설정에서 직접 회원 탈퇴를 하거나 이메일로 삭제를 요청할 수 있습니다. 자세한 절차와
        삭제되는 데이터 범위는{' '}
        <Link href="/account-deletion" className="text-primary underline">
          계정 및 데이터 삭제
        </Link>{' '}
        안내를 참고해 주세요.
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="고객 지원"
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
            말랑 가계부(이하 &lsquo;서비스&rsquo;)를 이용하며 궁금한 점이나 불편한 점이 있으면
            언제든지 문의해 주세요. 아래 안내를 통해 도움을 받으실 수 있습니다.
          </p>

          <h2 className="mt-8 text-lg font-semibold">문의하기</h2>
          <p>서비스 이용, 오류 신고, 개선 제안 등 모든 문의는 아래 이메일로 보내 주세요.</p>
          <p className="flex items-center gap-1.5">
            <Mail size={16} className="text-primary" />
            <a className="font-medium underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            문의 시 사용 중인 기기(예: iPhone 15, iOS 18)와 가입에 사용한 구글 계정 이메일, 그리고
            문제 상황을 함께 알려 주시면 더 빠르게 도와드릴 수 있습니다.
          </p>

          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock size={14} />
            보내 주신 문의는 영업일 기준 2~3일 이내에 답변드립니다.
          </p>

          <h2 className="mt-8 flex items-center gap-1.5 text-lg font-semibold">
            <HelpCircle size={18} className="text-primary" />
            자주 묻는 질문
          </h2>
          <div className="mt-2 space-y-5">
            {FAQS.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold">Q. {faq.question}</h3>
                <p className="mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-semibold">관련 안내</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <Link href="/privacy" className="text-primary underline">
                개인정보처리방침
              </Link>
            </li>
            <li>
              <Link href="/account-deletion" className="text-primary underline">
                계정 및 데이터 삭제
              </Link>
            </li>
          </ul>

          <p className="mt-8 text-sm text-muted-foreground">운영자: {OPERATOR_NAME}</p>
        </article>
      </main>
    </div>
  );
}
