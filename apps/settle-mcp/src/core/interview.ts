import type { InterviewQuestionId } from './rules';
import type { PrincipleNo } from './principles';

/**
 * 첫 결산 인터뷰 (docs/09-settle-mcp.md §11.4). 질문·선택지는 서버가 정하고 LLM은 말을 바꾸지 않는다.
 * 답을 기준(문장)+기계 규칙으로 풀어 쓰는 쪽은 save_rule { kind:'interview' } (1b단계 3번째 작업).
 */
export type InterviewChoice = {
  id: string;
  label: string;
  /** 사용자가 고르지 않으면 이 선택지 */
  default?: boolean;
  /** 이 선택지를 고르면 카테고리 하나를 함께 받아야 한다 */
  needsCategory?: boolean;
  /** 원칙과 어긋나는 선택. 저장 시 conflictsWith에 기록되고 경고하되 막지 않는다 (원칙 6) */
  conflictsWith?: PrincipleNo[];
};

export type InterviewQuestion = {
  id: InterviewQuestionId;
  question: string;
  /** choice: 하나 / multi: 여러 개 / text: 자유 입력 */
  kind: 'choice' | 'multi' | 'text';
  choices?: InterviewChoice[];
  /** 자유 입력의 형식 안내 (text·extraText용) */
  format?: string;
  /** 선택지 외에 받을 수 있는 덧붙임 (이름 목록 등) */
  extraText?: string;
  /** 건너뛸 수 있는 질문이면 그때 보여 줄 경고 */
  skipWarning?: string;
  /** 이 질문이 뿌리를 두는 원칙 */
  principle: PrincipleNo;
};

export const INTERVIEW_QUESTIONS: readonly InterviewQuestion[] = [
  {
    id: 'cardPayment',
    question: '카드로 쓴 돈은 어느 내역서에서 기록할까요?',
    kind: 'choice',
    principle: 2,
    choices: [
      {
        id: 'byCard',
        label: '카드 내역서에서 건별로. 통장에서 빠진 카드대금은 적지 않는다',
        default: true,
      },
      {
        id: 'byAccount',
        label: '카드 내역서는 안 쓰고, 통장의 카드대금 출금을 지출 한 건으로',
        needsCategory: true,
        conflictsWith: [2],
      },
    ],
  },
  {
    id: 'partnerName',
    question: '서로의 이름이 통장 적요에 어떻게 찍히나요? 호칭은 뭐라고 적을까요?',
    kind: 'text',
    principle: 3,
    format: '"실명 → 호칭" 쌍을 쉼표로. 예: 홍길동 → 남편, 김영희 → 아내',
    skipWarning:
      '이름을 등록하지 않으면 송금 패턴(이체·송금 등)에만 의존해서, 이름만 적힌 이체를 지출로 잡을 수 있습니다',
  },
  {
    id: 'thirdParty',
    question: '다른 사람에게 보내는 돈(용돈·경조사·정산)은 지출로 기록할까요?',
    kind: 'choice',
    principle: 3,
    choices: [
      { id: 'record', label: '지출로 기록한다', default: true },
      { id: 'skip', label: '기록하지 않는다' },
    ],
    extraText: '기록한다면 적요에 보이는 이름과 카테고리를 알려 주세요. 예: 박말순 → 어머니, 용돈',
  },
  {
    id: 'cashRefund',
    question: '현금 인출과 다른 달에 들어온 환불은 어떻게 할까요?',
    kind: 'multi',
    principle: 6,
    choices: [
      { id: 'skip', label: '둘 다 기록하지 않는다', default: true },
      { id: 'cashAsExpense', label: '현금을 뽑을 때 지출로 기록한다', needsCategory: true },
      { id: 'refundAsIncome', label: '환불은 수입으로 기록한다', needsCategory: true },
    ],
  },
];

export function interviewQuestion(id: InterviewQuestionId): InterviewQuestion {
  return INTERVIEW_QUESTIONS.find((q) => q.id === id)!;
}
