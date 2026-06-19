import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header, Button } from '@uandi/ui';

export const metadata: Metadata = {
  title: '개인정보처리방침 | MOA',
  description: 'MOA 서비스의 개인정보처리방침입니다.',
  robots: {
    index: true,
    follow: true,
  },
};

const EFFECTIVE_DATE = '2026년 6월 19일';
const CONTACT_EMAIL = 'swon3210@gmail.com';
const OPERATOR_NAME = '이송원';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="개인정보처리방침"
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
          <p className="text-sm text-muted-foreground">시행일: {EFFECTIVE_DATE}</p>

          <p className="mt-4">
            MOA(이하 &lsquo;서비스&rsquo;)의 운영자는 이용자의 개인정보를 소중하게
            생각하며,「개인정보 보호법」및「정보통신망 이용촉진 및 정보보호 등에 관한 법률」등 관련
            법령을 준수합니다. 본 개인정보처리방침은 서비스가 어떤 정보를 어떤 목적으로
            수집·이용하며, 이용자가 어떤 권리를 행사할 수 있는지 안내합니다.
          </p>

          <h2 className="mt-8 text-lg font-semibold">1. 수집하는 개인정보 항목 및 수집 방법</h2>

          <h3 className="mt-4 font-semibold">가. 회원가입 및 로그인 시</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Google 계정 정보</strong>: 이메일 주소, 이름, 프로필 사진 URL, Google 계정
              고유 식별자(uid)
            </li>
            <li>
              <strong>수집 방법</strong>: Google OAuth 로그인 시 이용자가 동의한 범위 내에서 자동
              수집
            </li>
            <li>
              서비스는 Google OAuth 외의 별도 로그인 방식(이메일/비밀번호, 전화번호 등)을 사용하지
              않으며, 비밀번호 등 인증 정보를 직접 저장하지 않습니다.
            </li>
          </ul>

          <h3 className="mt-4 font-semibold">나. 서비스 이용 과정에서</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>커플 연결 정보</strong>: 커플 식별자, 초대 코드, 커플 구성원 식별자
            </li>
            <li>
              <strong>사진 및 폴더</strong>: 이용자가 업로드한 사진 원본, 썸네일, 캡션, 태그, 폴더
              이름, 사진 촬영일·업로드일, 이미지 크기(가로/세로 픽셀)
            </li>
            <li>
              <strong>가계부 정보</strong>: 이용자가 입력한 거래 금액, 카테고리, 메모, 거래일자,
              작성자 식별자
            </li>
            <li>
              <strong>가계부 점검용 거래 명세 이미지</strong>: 가계부 점검(결산) 기능에서 이용자가
              직접 첨부하는 카드·계좌 거래 명세 캡처 이미지. 해당 이미지에는 가맹점명, 거래금액,
              거래일시, 일부 마스킹된 카드·계좌 번호 등 금융거래 정보가 포함될 수 있습니다. 이
              이미지는 내역 자동 인식(OCR)·분석 목적으로만 처리되며, 점검 완료 시 즉시
              삭제됩니다(아래 3조·6조 참고).
            </li>
            <li>
              <strong>푸시 알림 토큰</strong>: 푸시 알림 수신 동의 시 발급되는 기기 식별 토큰(FCM
              토큰)
            </li>
          </ul>

          <h3 className="mt-4 font-semibold">다. 자동으로 수집되는 정보</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              인증 세션 쿠키(<code>uandi-auth</code>) — 로그인 상태 및 커플 연결 여부 식별
            </li>
            <li>
              서비스 이용 과정에서 발생하는 접속 로그, 오류 로그, IP 주소, 브라우저/기기 정보(OS, 앱
              버전)
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">2. 개인정보의 처리 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 식별 및 로그인 상태 유지</li>
            <li>커플 연결 기능 제공 (초대 코드 발급·검증)</li>
            <li>사진 갤러리, 가계부 등 핵심 서비스 기능 제공</li>
            <li>
              AI 기반 부가 기능 제공 (가계부 자동 분류, 태그 추천, 지출 분석, 점검 시 첨부한 거래
              명세 이미지의 자동 인식(OCR)·내역 추출 등)
            </li>
            <li>푸시 알림 발송 (이용자가 동의한 경우에 한함)</li>
            <li>서비스 운영 및 오류 대응, 보안 위협 대응</li>
            <li>이용자 문의 응대</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">3. 개인정보의 보유 및 이용기간</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원이 서비스를 이용하는 동안 또는 회원 탈퇴 시까지 보유합니다.</li>
            <li>
              <strong>가계부 점검용 거래 명세 이미지</strong>는 해당 월의 점검을 완료하는 즉시 파일
              저장소(Storage)에서 삭제합니다. 점검을 완료하지 않아 방치된 이미지도 최대 30일 이내에
              자동으로 삭제되며, 이용자가 직접 삭제하거나 회원 탈퇴 시에도 함께 파기됩니다.
              인식(OCR)으로 추출된 가계부 내역(텍스트)은 이용자가 저장을 확정한 경우에 한해 일반
              가계부 정보로 보관됩니다.
            </li>
            <li>
              회원 탈퇴 시 이용자의 계정 정보는 지체 없이 파기합니다. 단, 커플로 연결된 상대방이
              함께 이용 중인 콘텐츠(사진·가계부 등)는 상대방의 이용에 영향을 주지 않는 범위 내에서
              처리됩니다(아래 7조 참고).
            </li>
            <li>
              관련 법령에 따라 보존이 요구되는 경우, 해당 기간 동안 별도로 보관 후 파기합니다.
              통신비밀보호법에 따라 서비스 방문 기록은 최대 3개월간 보관될 수 있습니다.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">4. 개인정보의 제3자 제공 및 처리위탁</h2>
          <p>
            서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다음의 경우에 한하여
            예외로 합니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>이용자의 사전 동의를 받은 경우</li>
            <li>법령에 근거하거나 수사기관의 적법한 요청이 있는 경우</li>
          </ul>

          <p className="mt-3">
            안정적인 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-border">수탁업체</th>
                  <th className="px-3 py-2 text-left border-b border-border">위탁 업무 내용</th>
                  <th className="px-3 py-2 text-left border-b border-border">처리 위치</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border-b border-border">Google LLC (Firebase)</td>
                  <td className="px-3 py-2 border-b border-border">
                    인증(Authentication), 데이터베이스(Firestore), 파일 저장소(Storage), 푸시
                    알림(FCM)
                  </td>
                  <td className="px-3 py-2 border-b border-border">
                    미국·아시아 등 Google Cloud 리전
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-border">Vercel Inc.</td>
                  <td className="px-3 py-2 border-b border-border">웹 호스팅 및 콘텐츠 전송</td>
                  <td className="px-3 py-2 border-b border-border">미국</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">OpenAI, L.L.C.</td>
                  <td className="px-3 py-2">
                    AI 기반 가계부 분류·태그 추천·지출 분석 및 점검 시 첨부한 거래 명세 이미지의
                    자동 인식(OCR)·내역 추출 처리
                  </td>
                  <td className="px-3 py-2">미국</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3">
            위 수탁업체는 위탁받은 업무 수행에 필요한 최소한의 정보만 처리하며, 각 사업자의 약관 및
            개인정보 보호정책에 따라 안전하게 관리됩니다. OpenAI API의 경우 운영자가 가계부 텍스트
            정보(가계부 항목, 분석 요청 등)와 함께{' '}
            <strong>이용자가 점검 기능에서 첨부한 거래 명세 이미지</strong>를 자동 인식(OCR)·분석
            목적으로 전송하며, OpenAI의 정책상 API 호출 데이터는 모델 학습에 이용되지 않습니다.
          </p>

          <h2 className="mt-8 text-lg font-semibold">5. 국외 이전에 관한 사항</h2>
          <p>
            서비스는 Google Cloud, Vercel, OpenAI 등 해외 사업자가 운영하는 인프라를 이용하여
            개인정보를 처리합니다. 이용자는 서비스를 이용함으로써 이러한 국외 이전에 동의한 것으로
            간주됩니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>이전 국가</strong>: 미국, 아시아 일부 리전 등
            </li>
            <li>
              <strong>이전 목적</strong>: 클라우드 인프라 운영, AI 처리, 웹 호스팅
            </li>
            <li>
              <strong>이전 항목</strong>: 1조에 명시된 개인정보
            </li>
            <li>
              <strong>이전 방법</strong>: HTTPS(TLS) 암호화 통신을 통한 네트워크 전송
            </li>
            <li>
              <strong>보유 및 이용기간</strong>: 3조와 동일
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">6. AI 기능 관련 개인정보 처리</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              서비스는 가계부 자동 분류, 태그 추천, 지출 분석 등 AI 기반 부가 기능을 제공하며, 이를
              위해 이용자가 입력한 가계부 텍스트의 일부를 OpenAI API로 전송할 수 있습니다.
            </li>
            <li>
              또한 가계부 점검(결산) 기능에서 이용자가 카드·계좌 거래 명세 이미지를 첨부하면, 해당
              이미지에 포함된 내역을 자동으로 인식(OCR)·분류하기 위해 이미지를 OpenAI API로
              전송합니다. 전송된 이미지는 내역 추출·분석 목적으로만 사용되며, 점검 완료 시 서비스의
              파일 저장소에서 즉시 삭제됩니다.
            </li>
            <li>
              OpenAI의 정책에 따라 API 호출로 전달된 데이터(텍스트 및 이미지)는 모델 학습에 이용되지
              않으며, OpenAI 측에서도 일정 기간 후 파기됩니다.
            </li>
            <li>
              거래 명세 이미지에는 가맹점명·거래금액·일부 마스킹된 카드/계좌 번호 등 금융거래 정보가
              포함될 수 있으며, 서비스는 이를 가계부 점검이라는 명시된 목적 외로 이용하지 않습니다.
              주민등록번호 등 고유식별정보는 수집하지 않으며, 이용자께서도 점검에 불필요한
              민감정보가 노출되지 않도록 주의해 주시기를 권장합니다.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">7. 커플 간 정보 공유에 관한 사항</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>공유 범위</strong>: 커플 연결이 완료되면 양측 이용자가 업로드·입력한
              사진(원본, 썸네일, 캡션, 태그, 폴더), 가계부 내역(금액, 카테고리, 메모, 거래일자),
              점검 완료 전까지 첨부된 거래 명세 이미지가 커플 구성원 간 공유됩니다.
            </li>
            <li>
              <strong>접근 제한</strong>: 공유된 정보는 Firestore 보안 규칙에 의해 동일 커플
              구성원에게만 접근이 허용됩니다.
            </li>
            <li>
              <strong>동의 간주</strong>: 커플 연결은 양측의 상호 동의(초대 코드 입력) 하에
              이루어지며, 연결 시 본 조항의 정보 공유에 동의한 것으로 간주됩니다.
            </li>
            <li>
              <strong>탈퇴 시 처리</strong>: 회원 탈퇴 시 본인 계정 정보는 파기되지만, 커플로 함께
              만든 콘텐츠는 상대방의 정상적인 서비스 이용을 위해 유지될 수 있습니다.
            </li>
            <li>
              <strong>면책</strong>: 커플 상대방이 공유 정보를 캡처·복사하여 외부에 유출한 경우에
              대해서는 운영자가 책임지지 않습니다.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">8. 정보주체의 권리와 행사 방법</h2>
          <p>이용자는 다음과 같은 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개인정보 열람 요구</li>
            <li>개인정보 정정·삭제 요구</li>
            <li>개인정보 처리 정지 요구</li>
            <li>회원 탈퇴(개인정보 삭제)</li>
          </ul>
          <p className="mt-3">
            <strong>행사 방법</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              회원 탈퇴는 앱 내 <strong>설정 &gt; 회원탈퇴</strong> 메뉴에서 직접 진행할 수 있으며,
              탈퇴 시 본인의 계정 정보는 즉시 삭제됩니다.
            </li>
            <li>
              그 외 열람·정정·처리정지 요청은 아래 9조의 이메일을 통해 요청할 수 있으며, 운영자는
              요청 접수 후 합리적인 기간 내에 회신합니다.
            </li>
            <li>푸시 알림 수신은 기기 설정에서 언제든 해제할 수 있습니다.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">9. 개인정보의 파기 절차 및 방법</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              회원 탈퇴, 서비스 종료 등 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 법령에
              따라 보존이 필요한 경우 별도 DB로 분리 보관 후 파기합니다.
            </li>
            <li>
              전자적 파일 형태의 정보는 복구 및 재생이 불가능한 방법으로 영구 삭제하며, 종이 문서는
              분쇄하거나 소각합니다.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">10. 개인정보의 안전성 확보 조치</h2>

          <h3 className="mt-3 font-semibold">가. 기술적 대책</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>모든 통신 구간은 HTTPS(TLS) 암호화로 보호됩니다.</li>
            <li>
              저장 데이터는 Google Cloud(Firestore, Storage)의 기본 암호화 정책 (AES-256 등)에 따라
              보관됩니다.
            </li>
            <li>
              Firestore 보안 규칙을 통해 각 커플 단위로 데이터 접근을 격리하며, 본인 또는 동일 커플
              구성원만 접근할 수 있도록 제한합니다.
            </li>
            <li>인증은 Google OAuth에 위임하여 자체 비밀번호를 저장하지 않습니다.</li>
          </ul>

          <h3 className="mt-3 font-semibold">나. 관리적 대책</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>운영 권한이 부여된 최소한의 인원만 개인정보에 접근합니다.</li>
            <li>
              Google Cloud Console 등 운영 콘솔의 접근 기록은 클라우드 사업자의 감사 로그를 통해
              보관됩니다.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">11. 앱 권한 및 자동 수집 장치</h2>

          <h3 className="mt-3 font-semibold">가. 쿠키 등 자동 수집 장치</h3>
          <p>
            서비스는 로그인 상태 유지를 위해 인증 세션 쿠키(
            <code>uandi-auth</code>)를 사용합니다. 브라우저 설정에서 쿠키 저장을 거부할 경우 로그인
            기능이 제한될 수 있습니다.
          </p>

          <h3 className="mt-3 font-semibold">나. 앱 권한</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-border">권한</th>
                  <th className="px-3 py-2 text-left border-b border-border">목적</th>
                  <th className="px-3 py-2 text-left border-b border-border">필수 여부</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border-b border-border">네트워크 접근</td>
                  <td className="px-3 py-2 border-b border-border">서비스 이용</td>
                  <td className="px-3 py-2 border-b border-border">필수</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-border">사진·파일 접근</td>
                  <td className="px-3 py-2 border-b border-border">
                    사진 갤러리 업로드 및 가계부 점검용 거래 명세 이미지 첨부
                  </td>
                  <td className="px-3 py-2 border-b border-border">선택</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">알림</td>
                  <td className="px-3 py-2">푸시 알림 수신</td>
                  <td className="px-3 py-2">선택</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm">
            선택 권한에 동의하지 않아도 서비스의 기본 이용은 가능하나, 해당 기능은 제한될 수
            있습니다.
          </p>

          <h2 className="mt-8 text-lg font-semibold">12. 만 14세 미만 아동의 개인정보</h2>
          <p>
            서비스는 만 14세 미만 아동의 회원가입을 받지 않습니다. 만 14세 미만임이 확인된 경우 즉시
            계정과 개인정보를 삭제합니다.
          </p>

          <h2 className="mt-8 text-lg font-semibold">13. 앱스토어 정책 준수</h2>
          <p>본 서비스는 다음 정책을 준수합니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Google Play Developer Policy</li>
            <li>Google Play Developer Distribution Agreement</li>
            <li>Android 개인정보보호 정책</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">14. 개인정보 보호책임자 및 문의처</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>개인정보 보호책임자</strong>: {OPERATOR_NAME}
            </li>
            <li>
              <strong>이메일</strong>:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">15. 권익침해 구제 방법</h2>
          <p>개인정보 침해에 대한 신고 및 상담은 아래 기관으로 문의할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개인정보침해신고센터 (한국인터넷진흥원) — privacy.kisa.or.kr / 국번없이 118</li>
            <li>개인정보분쟁조정위원회 — kopico.go.kr / 1833-6972</li>
            <li>대검찰청 사이버수사과 — spo.go.kr / 국번없이 1301</li>
            <li>경찰청 사이버수사국 — ecrm.police.go.kr / 국번없이 182</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">16. 개인정보처리방침의 변경</h2>
          <p>
            본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 공지사항 또는 앱 내
            안내를 통해 사전에 고지합니다. 중요한 변경의 경우 최소 7일 전에 안내합니다.
          </p>

          <p className="mt-8 text-sm text-muted-foreground">
            본 방침은 {EFFECTIVE_DATE}부터 적용됩니다.
          </p>
        </article>
      </main>
    </div>
  );
}
