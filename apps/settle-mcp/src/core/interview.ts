import { z } from 'zod';
import { conflictsOfCategoryRule } from './conflicts';
import { SettleError } from './errors';
import { principleLabel, type PrincipleNo } from './principles';
import {
  DEFAULT_CARD_PAYMENT_PATTERN,
  DEFAULT_CARD_PAYMENT_RULE_ID,
  DEFAULT_TRANSFER_RULE_ID,
  newRuleMeta,
  type CategoryRule,
  type IgnoreRule,
  type InterviewQuestionId,
  type RulesFile,
  type UserPrinciple,
} from './rules';
import { newId } from './id';

/**
 * 첫 결산 인터뷰 (docs/09-settle-mcp.md §11.4). 질문·선택지는 서버가 정하고 LLM은 말을 바꾸지 않는다.
 * 답은 save_rule { kind:'interview', answers }로 들어와 applyInterviewAnswers가 기준(문장)+기계 규칙으로 풀어 쓴다.
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
  /** 자유 입력의 형식 안내 */
  format?: string;
  /** 선택지 외에 받을 수 있는 덧붙임 (이름 목록 등) */
  extraText?: string;
  /** 건너뛸 수 있는 질문이면 그때 보여 줄 경고 */
  skipWarning?: string;
  /** 이 질문이 뿌리를 두는 원칙 */
  principle: PrincipleNo;
  /** save_rule { kind:'interview' }의 answers.<id> 형식 (LLM이 그대로 채운다) */
  answerShape: string;
};

export const CASH_WITHDRAWAL_PATTERN = '(ATM|현금\\s*출금|인출)';

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
    answerShape: '{ choice: "byCard" | "byAccount", category?: string /* byAccount일 때 */ }',
  },
  {
    id: 'partnerName',
    question: '서로의 이름이 통장 적요에 어떻게 찍히나요? 호칭은 뭐라고 적을까요?',
    kind: 'text',
    principle: 3,
    format: '"실명 → 호칭" 쌍을 쉼표로. 예: 홍길동 → 남편, 김영희 → 아내',
    skipWarning:
      '이름을 등록하지 않으면 송금 패턴(이체·송금 등)에만 의존해서, 이름만 적힌 이체를 지출로 잡을 수 있습니다',
    answerShape: '{ names: { realName: string, alias: string }[] } 또는 { skipped: true }',
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
    answerShape:
      '{ choice: "record" | "skip", people?: { realName: string, alias: string, category: string }[] }',
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
    answerShape:
      '{ choices: ("skip" | "cashAsExpense" | "refundAsIncome")[], cashCategory?: string, refundCategory?: string }',
  },
];

export function interviewQuestion(id: InterviewQuestionId): InterviewQuestion {
  return INTERVIEW_QUESTIONS.find((q) => q.id === id)!;
}

// ── 답 형식 (save_rule 입력) ──

const nameSchema = z.string().min(1).max(50);
const categorySchema = z.string().min(1).max(50);

export const interviewAnswersSchema = z
  .object({
    cardPayment: z
      .object({ choice: z.enum(['byCard', 'byAccount']), category: categorySchema.optional() })
      .strict()
      .optional(),
    partnerName: z
      .union([
        z
          .object({
            names: z.array(z.object({ realName: nameSchema, alias: nameSchema }).strict()).min(1),
          })
          .strict(),
        z.object({ skipped: z.literal(true) }).strict(),
      ])
      .optional(),
    thirdParty: z
      .object({
        choice: z.enum(['record', 'skip']),
        people: z
          .array(
            z.object({ realName: nameSchema, alias: nameSchema, category: categorySchema }).strict()
          )
          .optional(),
      })
      .strict()
      .optional(),
    cashRefund: z
      .object({
        choices: z.array(z.enum(['skip', 'cashAsExpense', 'refundAsIncome'])).min(1),
        cashCategory: categorySchema.optional(),
        refundCategory: categorySchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type InterviewAnswers = z.infer<typeof interviewAnswersSchema>;

export type InterviewApplication = {
  file: RulesFile;
  warnings: string[];
  createdRuleIds: string[];
  createdPrincipleIds: string[];
};

/**
 * 인터뷰 답을 기준(문장) + 기계 규칙으로 풀어 쓴다 (§11.4 표). 원본은 바꾸지 않는다.
 * 답하지 않은 질문은 건너뛴다(기본값을 강제로 채우지 않는다 — 기본값은 이미 기본 규칙이 하고 있다).
 */
export function applyInterviewAnswers(
  file: RulesFile,
  answers: InterviewAnswers,
  categoryNames: ReadonlySet<string>,
  now: string = new Date().toISOString()
): InterviewApplication {
  const next = structuredClone(file);
  const warnings: string[] = [];
  const createdRuleIds: string[] = [];
  const createdPrincipleIds: string[] = [];

  const requireCategory = (name: string | undefined, what: string): string => {
    if (!name) throw new SettleError('INVALID_INPUT', `${what}에 쓸 카테고리를 함께 주세요`);
    if (!categoryNames.has(name)) {
      throw new SettleError('UNKNOWN_CATEGORY', `카테고리 "${name}"는 목록에 없습니다`);
    }
    return name;
  };
  const addPrinciple = (
    text: string,
    topic: UserPrinciple['topic'],
    ruleIds: string[]
  ): UserPrinciple => {
    const p: UserPrinciple = {
      id: newId(),
      text,
      topic,
      source: 'interview',
      createdAt: now,
      ruleIds,
    };
    next.principles.push(p);
    createdPrincipleIds.push(p.id);
    return p;
  };
  const addCategoryRule = (
    rule: Omit<CategoryRule, keyof ReturnType<typeof newRuleMeta>>,
    rationale: string
  ) => {
    const full: CategoryRule = { ...newRuleMeta({ source: 'interview', rationale }, now), ...rule };
    full.conflictsWith = conflictsOfCategoryRule(full, next);
    next.categoryRules.push(full);
    createdRuleIds.push(full.id);
    return full;
  };

  // 1) 카드대금 (원칙 2)
  if (answers.cardPayment) {
    const a = answers.cardPayment;
    next.interview.answers.cardPayment = a.choice;
    if (a.choice === 'byCard') {
      addPrinciple(
        '카드 지출은 카드 내역서에서 건별로 기록하고, 통장에서 빠진 카드대금은 넣지 않는다',
        'duplicate',
        next.ignore.some((r) => r.id === DEFAULT_CARD_PAYMENT_RULE_ID)
          ? [DEFAULT_CARD_PAYMENT_RULE_ID]
          : []
      );
    } else {
      const category = requireCategory(a.category, '카드대금 지출');
      next.ignore = next.ignore.filter((r) => r.id !== DEFAULT_CARD_PAYMENT_RULE_ID);
      const rule = addCategoryRule(
        {
          match: { kind: 'regex', pattern: DEFAULT_CARD_PAYMENT_PATTERN },
          category,
          onlyFor: { sourceKind: 'account', type: 'expense' },
        },
        '인터뷰: 카드 내역서를 쓰지 않고 통장의 카드대금 출금을 지출 한 건으로 본다'
      );
      addPrinciple(
        '통장의 카드대금 출금을 지출 한 건으로 기록한다 (카드 내역서는 넣지 않는다)',
        'duplicate',
        [rule.id]
      );
      warnings.push(
        `${principleLabel(2)}와 어긋나지만 저장했습니다 — 카드 내역서도 함께 넣으면 지출이 두 배가 됩니다`
      );
    }
  }

  // 2) 서로의 이름 (원칙 3)
  if (answers.partnerName) {
    const a = answers.partnerName;
    if ('skipped' in a) {
      next.interview.answers.partnerName = 'skipped';
      warnings.push(interviewQuestion('partnerName').skipWarning!);
    } else {
      next.interview.answers.partnerName = 'provided';
      for (const { realName, alias } of a.names) {
        next.aliases[realName] = alias;
        if (!next.insiders.includes(realName)) next.insiders.push(realName);
      }
      const who = a.names.map((n) => n.alias).join('·');
      addPrinciple(
        `우리(${who}) 사이의 이체는 쓴 돈이 아니라 기록하지 않는다`,
        'transfer',
        next.transfer.some((r) => r.id === DEFAULT_TRANSFER_RULE_ID)
          ? [DEFAULT_TRANSFER_RULE_ID]
          : []
      );
    }
  }

  // 3) 다른 사람에게 보낸 돈 (원칙 3)
  if (answers.thirdParty) {
    const a = answers.thirdParty;
    next.interview.answers.thirdParty = a.choice;
    if (a.choice === 'record') {
      const ruleIds: string[] = [];
      for (const person of a.people ?? []) {
        const category = requireCategory(person.category, `${person.alias}에게 보낸 돈`);
        next.aliases[person.realName] = person.alias;
        const rule = addCategoryRule(
          { match: { kind: 'contains', text: person.realName }, category, evenIfTransfer: true },
          `인터뷰: ${person.alias}에게 보낸 돈은 ${category}로 기록한다`
        );
        ruleIds.push(rule.id);
      }
      addPrinciple(
        a.people?.length
          ? `다른 사람(${a.people.map((p) => p.alias).join('·')})에게 보낸 돈은 지출로 기록한다`
          : '다른 사람에게 보낸 돈은 지출로 기록한다',
        'transfer',
        ruleIds
      );
    } else {
      addPrinciple('다른 사람에게 보낸 돈도 기록하지 않는다', 'transfer', []);
    }
  }

  // 4) 현금 인출·환불 (원칙 6 — 사용자 기준)
  if (answers.cashRefund) {
    const a = answers.cashRefund;
    next.interview.answers.cashRefund = [...a.choices].sort().join(',');
    if (a.choices.includes('skip')) {
      const ignore: IgnoreRule = {
        ...newRuleMeta(
          { source: 'interview', rationale: '인터뷰: 현금 인출은 기록하지 않는다' },
          now
        ),
        pattern: CASH_WITHDRAWAL_PATTERN,
        reason: '현금 인출 — 인터뷰에서 기록하지 않기로 함',
        onlyFor: { sourceKind: 'account', type: 'expense' },
      };
      next.ignore = next.ignore.filter((r) => r.pattern !== CASH_WITHDRAWAL_PATTERN);
      next.ignore.push(ignore);
      createdRuleIds.push(ignore.id);
      addPrinciple('현금 인출과 다른 달에 들어온 환불은 기록하지 않는다', 'cash', [ignore.id]);
    }
    if (a.choices.includes('cashAsExpense')) {
      const category = requireCategory(a.cashCategory, '현금 인출');
      const rule = addCategoryRule(
        {
          match: { kind: 'regex', pattern: CASH_WITHDRAWAL_PATTERN },
          category,
          onlyFor: { sourceKind: 'account', type: 'expense' },
          evenIfTransfer: true,
        },
        `인터뷰: 현금을 뽑을 때 ${category}로 기록한다`
      );
      addPrinciple(`현금은 뽑을 때 ${category}로 기록한다`, 'cash', [rule.id]);
    }
    if (a.choices.includes('refundAsIncome')) {
      const category = requireCategory(a.refundCategory, '환불');
      addPrinciple(`다른 달에 들어온 환불은 ${category} 수입으로 기록한다`, 'refund', []);
    }
  }

  next.interview.completedAt = now;
  return { file: next, warnings, createdRuleIds, createdPrincipleIds };
}

/** 인터뷰를 다시 하기 — 기준·규칙은 지우지 않고 완료 표시만 지운다 */
export function resetInterview(file: RulesFile): RulesFile {
  const next = structuredClone(file);
  next.interview = { completedAt: null, answers: {} };
  return next;
}
