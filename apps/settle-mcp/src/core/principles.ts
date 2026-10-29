/**
 * 결산 원칙 여섯 가지 (docs/09-settle-mcp.md §11.2).
 * 사용자와 LLM이 같은 글을 읽는다. 번호와 제목은 코드(conflictsWith·principlesTouched)와 회고가 인용하므로 바꾸지 않는다.
 * 전문은 resources/principles.ko.md (1b단계 2번째 작업)에 두고, 여기에는 번호·제목만 둔다.
 */
export const PRINCIPLE_TITLES = {
  1: '나중의 우리를 위해 쓴다',
  2: '같은 돈은 한 번만 적는다',
  3: '우리 안에서 오간 돈은 쓴 돈이 아니다',
  4: '한 가게는 한 칸에',
  5: '두 번 같은 고민을 했으면 규칙으로 만든다',
  6: '원칙은 서버가 지키고, 기준은 우리가 정한다',
} as const;

export type PrincipleNo = keyof typeof PRINCIPLE_TITLES;

export const PRINCIPLE_NUMBERS = [1, 2, 3, 4, 5, 6] as const satisfies readonly PrincipleNo[];

/** "원칙 2: 같은 돈은 한 번만 적는다" — 기본 규칙의 rationale, 경고 문구에 쓴다 */
export function principleLabel(no: PrincipleNo): string {
  return `원칙 ${no}: ${PRINCIPLE_TITLES[no]}`;
}
