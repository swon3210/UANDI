import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu';

export type ReportMenuProps = {
  /** 본인 글에서만 전달. 없으면 수정 메뉴 미노출. */
  onEdit?: () => void;
  /** 본인 글에서만 전달. 없으면 삭제 메뉴 미노출. */
  onDelete?: () => void;
  /** 타인 글/스크랩 글에서 주입. 없으면 신고 메뉴 미노출. */
  onReport?: () => void;
};

/**
 * 카드 [⋯] 액션 메뉴.
 * - 본인 글: 수정하기 + 삭제하기
 * - 타인 글/스크랩 글: 신고하기
 * 콜백이 모두 비어 있으면 트리거는 렌더되지 않는다.
 */
export function ReportMenu({ onEdit, onDelete, onReport }: ReportMenuProps) {
  if (!onEdit && !onDelete && !onReport) return null;

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
        {onEdit ? (
          <DropdownMenuItem onSelect={onEdit}>수정하기</DropdownMenuItem>
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
