import { MascotState as UiMascotState, type MascotStateProps } from '@uandi/ui';
import mascotEmpty from '@uandi/ui/assets/mascot-empty.png';
import mascotError from '@uandi/ui/assets/mascot-error.png';
import mascotSuccess from '@uandi/ui/assets/mascot-success.png';
import mascotIdle from '@uandi/ui/assets/mascot-idle.png';

export type MascotMood = 'empty' | 'error' | 'success' | 'idle';

const MASCOT: Record<MascotMood, { src: string }> = {
  empty: mascotEmpty,
  error: mascotError,
  success: mascotSuccess,
  idle: mascotIdle,
};

/**
 * 상태별 마스코트 화면 (web). `mood` 로 빈 화면/에러/성공/유휴 일러스트를 고른다.
 *
 * 마스코트 PNG를 import 하므로 Next가 content-hash + immutable 캐싱한다.
 * import한 PNG는 URL 문자열만 번들에 들어가고 실제 파일은 렌더되는 것만 내려받는다.
 */
export function MascotState({
  mood,
  ...props
}: Omit<MascotStateProps, 'src'> & { mood: MascotMood }) {
  return <UiMascotState src={MASCOT[mood].src} {...props} />;
}
