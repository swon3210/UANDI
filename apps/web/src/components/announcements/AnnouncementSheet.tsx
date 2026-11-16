import {
  Button,
  Separator,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@uandi/ui';
import type { Announcement } from '@/content/announcements';
import { AnnouncementItem } from './AnnouncementItem';

/** 시트에 한 번에 보여줄 최대 공지 수. 넘치면 「지난 공지 모두 보기」 */
export const ANNOUNCEMENT_SHEET_MAX = 3;

type AnnouncementSheetProps = {
  /** 안 읽은 공지(최신순) */
  announcements: Announcement[];
  onConfirm: () => void;
  onLinkClick: (href: string) => void;
  onSeeAll: () => void;
};

/** 대시보드 진입 시 안 읽은 공지를 보여주는 바텀시트 본문. 열고 닫기는 호출 측(overlay-kit). */
export function AnnouncementSheet({
  announcements,
  onConfirm,
  onLinkClick,
  onSeeAll,
}: AnnouncementSheetProps) {
  const visible = announcements.slice(0, ANNOUNCEMENT_SHEET_MAX);
  const hasMore = announcements.length > ANNOUNCEMENT_SHEET_MAX;

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="announcement-sheet"
    >
      <SheetHeader>
        <SheetTitle>새 소식</SheetTitle>
        <SheetDescription className="sr-only">
          말랑 가계부에 새로 바뀐 점을 알려 드려요
        </SheetDescription>
      </SheetHeader>

      <div className="-mx-6 flex-1 overflow-y-auto px-6 py-2">
        {visible.map((announcement, i) => (
          <div key={announcement.id}>
            {i > 0 ? <Separator className="my-4" /> : null}
            <AnnouncementItem announcement={announcement} onLinkClick={onLinkClick} />
          </div>
        ))}
        {hasMore ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full"
            data-testid="announcement-see-all"
            onClick={onSeeAll}
          >
            지난 공지 모두 보기
          </Button>
        ) : null}
      </div>

      <SheetFooter className="pt-2">
        <Button className="w-full" data-testid="announcement-confirm" onClick={onConfirm}>
          확인
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}
