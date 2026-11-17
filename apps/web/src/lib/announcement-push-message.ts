import type { Announcement, AnnouncementKind } from '../content/announcements';

// 공지 푸시 문구 — docs/pages/10-announcement-push.md 「푸시 메시지」
// 제목은 종류별로 정해진 문구, 본문은 공지 제목(한 문장 요약). 자세한 내용은 푸시를 눌러 공지사항에서 본다.
// E2E가 이 파일을 직접 가져오므로 '@/' 경로 import를 쓰지 않는다.

const TITLE_BY_KIND: Record<AnnouncementKind, string> = {
  new: '[공지] 새 기능이 생겼어요',
  changed: '[공지] 바뀐 점이 있어요',
  fixed: '[공지] 버그를 고쳤어요',
  ended: '[공지] 종료 안내',
};

const DEFAULT_TITLE = '[공지] 말랑 가계부 소식';

export function buildAnnouncementPushText(announcement: Announcement): {
  title: string;
  body: string;
} {
  return {
    title: announcement.kind ? TITLE_BY_KIND[announcement.kind] : DEFAULT_TITLE,
    body: announcement.title,
  };
}
