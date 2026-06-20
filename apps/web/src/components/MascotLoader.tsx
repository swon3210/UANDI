import { MascotLoader as UiMascotLoader, type MascotLoaderProps } from '@uandi/ui';
import mascotCoral from '@uandi/ui/assets/mascot-loading.png';
import mascotSage from '@uandi/ui/assets/mascot-loading-green.png';

export type MascotCharacter = 'coral' | 'sage';

/**
 * UANDI 마스코트 로딩 인디케이터 (web).
 *
 * 마스코트 PNG를 import 하므로 Next가 content-hash 한 URL(`/_next/static/media/...`)로 내보내고
 * `immutable` 장기 캐싱이 자동 적용된다. 파일을 교체하면 해시도 바뀌어 캐시가 자동 무효화된다.
 *
 * `character` 로 코랄(기본) / 세이지(그린 스카프 짝꿍)를 선택한다. import한 두 PNG는 URL 문자열만
 * 번들에 들어가고, 실제 파일은 렌더되는 쪽만 브라우저가 내려받는다.
 *
 * `FullScreenSpinner` 자리에 `<MascotLoader fullScreen />` 로 1:1 대체한다.
 */
export function MascotLoader({
  character = 'coral',
  ...props
}: Omit<MascotLoaderProps, 'src'> & { character?: MascotCharacter }) {
  // Next의 png import는 StaticImageData 객체 — 해시된 URL은 `.src`에 담긴다.
  const src = (character === 'sage' ? mascotSage : mascotCoral).src;
  return <UiMascotLoader src={src} {...props} />;
}
