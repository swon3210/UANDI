import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';

export type PostAuthorProps = {
  displayName: string;
  photoURL?: string | null;
  /** 캘러가 dayjs.fromNow() 등으로 포맷한 상대 시각. 예: "30분 전". */
  timeLabel: string;
};

export function PostAuthor({ displayName, photoURL, timeLabel }: PostAuthorProps) {
  const initial = displayName.slice(0, 1).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        {photoURL ? <AvatarImage src={photoURL} alt={displayName} /> : null}
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-foreground">{displayName}</span>
        <span className="text-xs text-muted-foreground">{timeLabel}</span>
      </div>
    </div>
  );
}
