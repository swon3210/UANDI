import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu';

export type ReportMenuProps = {
  /** 본인 글에서만 전달. 없으면 삭제 메뉴 미노출. */
  onDelete?: () => void;
  /** Phase 4에서 주입. 없으면 신고 메뉴 미노출. */
  onReport?: () => void;
};

/**
 * 카드 [⋯] 액션 메뉴. Phase 3은 본인 글 삭제만, Phase 4에서 신고하기 추가.
 * 콜백이 모두 비어 있으면 트리거는 렌더되지 않는다.
 */
export function ReportMenu({ onDelete, onReport }: ReportMenuProps) {
  if (!onDelete && !onReport) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="액션 메뉴" className="h-8 w-8">
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onReport ? (
          <DropdownMenuItem onSelect={onReport}>신고하기</DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <DropdownMenuItem onSelect={onDelete} className="text-destructive">
            삭제하기
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
