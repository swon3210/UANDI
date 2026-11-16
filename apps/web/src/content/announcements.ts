// 공지사항 원본 — docs/pages/09-announcements.md
// 사용자가 꼭 알아야 할 변경만 골라 적는다(작은 개선·리팩터링·어드민은 올리지 않는다).
// - 새 공지는 배열 맨 앞에 추가한다(최신순 — 읽음 판정 기준).
// - 배포된 공지의 id는 바꾸거나 지우지 않는다. 문구는 고쳐도 된다.
// - E2E가 이 파일을 직접 가져오므로 '@/' 경로 import를 쓰지 않는다.

export type AnnouncementKind = 'new' | 'changed' | 'fixed' | 'ended';

export type Announcement = {
  /** 고유 id. 한 번 배포한 id는 바꾸거나 지우지 않는다 */
  id: string;
  /** 공지 날짜 'YYYY-MM-DD'(KST). 목록 표시와 신규 가입자 판정에 쓴다 */
  date: string;
  kind?: AnnouncementKind;
  /** 한 문장 */
  title: string;
  /** 줄바꿈(\n) 허용. 마크다운 아님 */
  body: string;
  /** 선택: "바로 가기" 버튼 */
  link?: { label: string; href: string };
};

/** 최신순(배열 앞이 최신) */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: '2026-11-feedback',
    date: '2026-11-15',
    kind: 'new',
    title: '앱 안에서 의견을 보낼 수 있어요',
    body: '불편한 점이나 바라는 점이 있으면 설정 → 의견 보내기로 알려 주세요.\n스크린샷도 한 장 함께 보낼 수 있어요.',
    link: { label: '의견 보내러 가기', href: '/settings/feedback' },
  },
  {
    id: '2026-11-couple-link-fix',
    date: '2026-11-15',
    kind: 'fixed',
    title: '짝꿍 연결이 풀리던 문제를 고쳤어요',
    body: '다시 로그인했을 때 짝꿍과의 연결이 끊긴 것처럼 보이던 문제가 있었어요. 불편을 드려 죄송해요.\n아직 연결이 풀려 있다면 의견 보내기로 알려 주세요.',
  },
];
