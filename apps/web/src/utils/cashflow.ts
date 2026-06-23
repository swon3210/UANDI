import dayjs, { type Dayjs } from 'dayjs';
import { occurrenceDateInMonth } from '@uandi/cashbook-core/utils/recurrence';
import type {
  CashbookCategory,
  CashbookEntryType,
  CashflowPayday,
  CashflowPaydayType,
  PredictionSource,
} from '@/types';

// 현금흐름 캘린더 순수 계산 유틸 (firebase 비의존 — Storybook/테스트에서 그대로 사용 가능).
// 명세: Spec §9 (결제일·잔액 계산), §4-3 (카드 표시).

/** 캘린더 카드에 표시할 거래 1건. 실거래(actual ✓) 또는 예측(predicted ◇)을 통합 표현. */
export type CashflowTxnKind = 'actual' | 'predicted';

export type CashflowTransaction = {
  id: string;
  kind: CashflowTxnKind;
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: Date;
  /** predicted일 때만: 출처(calendar/auto/llm). */
  source?: PredictionSource;
};

/** 결제일의 구체적 발생 인스턴스(미래 N개월 내 실제 날짜). */
export type PaydayInstance = {
  id: string; // `${paydayId}-${YYYY-MM-DD}`
  paydayId: string;
  label: string;
  type?: CashflowPaydayType;
  date: Date; // 발생일(해당 일자의 시작)
};

/** 결제일 미등록 시 사용하는 주 단위 버킷(§9-1). */
export type WeekBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

/** 카드 경계: endDate(상한일) 기준으로 그 이하 날짜의 거래를 묶는다. */
export type CardBoundary = {
  key: string;
  label: string;
  endDate: Date;
  subLabel?: string;
  /** 결제일 유형(카드 아이콘 표시용). 주 단위 폴백은 미지정. */
  paydayType?: CashflowPaydayType;
};

export type CashflowCardData = {
  key: string;
  label: string;
  subLabel?: string;
  endDate: Date;
  /** 결제일 유형(아이콘/틴트 선택). 주 단위 폴백은 미지정. */
  paydayType?: CashflowPaydayType;
  inflow: number; // 들어올 돈 (income 합)
  outflow: number; // 나갈 돈 (expense + flex 합)
  balance: number; // 남는 돈 (누적)
  isNegative: boolean;
  transactions: CashflowTransaction[];
  /** §7-2 예상 변동지출(있으면 카드에 한 줄 표시). PR5에서 채움. */
  estimatedVariable?: number;
};

/**
 * 결제일별 발생 인스턴스를 from(오늘)부터 months개월 내에서 생성한다.
 * - dayOfMonth가 해당 월 말일보다 크면 말일로 clamp(예: 31일 → 2월 28/29일).
 * - from(당일) 이후(당일 포함)만 포함. 발생일 오름차순 정렬.
 */
export function buildPaydayInstances(
  paydays: CashflowPayday[],
  from: Dayjs,
  months = 3
): PaydayInstance[] {
  if (paydays.length === 0) return [];
  const start = from.startOf('day');
  const end = start.add(months, 'month').endOf('day');
  const out: PaydayInstance[] = [];

  let monthCursor = start.startOf('month');
  while (monthCursor.isBefore(end) || monthCursor.isSame(end, 'month')) {
    for (const p of paydays) {
      const day = Math.min(p.dayOfMonth, monthCursor.daysInMonth());
      const occ = monthCursor.date(day).startOf('day');
      const afterStart = occ.isSame(start, 'day') || occ.isAfter(start);
      const beforeEnd = occ.isBefore(end);
      if (afterStart && beforeEnd) {
        out.push({
          id: `${p.id}-${occ.format('YYYY-MM-DD')}`,
          paydayId: p.id,
          label: p.label,
          type: p.type,
          date: occ.toDate(),
        });
      }
    }
    monthCursor = monthCursor.add(1, 'month');
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** from(오늘)부터 months개월을 주 단위(오늘→이번 주말, 이후 주 단위)로 묶는다(§9-1 폴백). */
export function buildWeeklyBuckets(from: Dayjs, months = 3): WeekBucket[] {
  const start = from.startOf('day');
  const horizonEnd = start.add(months, 'month');
  const out: WeekBucket[] = [];

  let weekStart = start;
  let i = 0;
  while (weekStart.isBefore(horizonEnd)) {
    const weekEnd = weekStart.endOf('week');
    const end = weekEnd.isAfter(horizonEnd) ? horizonEnd : weekEnd;
    out.push({
      key: `week-${i}`,
      label: `${weekStart.format('M월 D일')} ~ ${end.format('M월 D일')}`,
      start: weekStart.startOf('day').toDate(),
      end: end.endOf('day').toDate(),
    });
    weekStart = weekEnd.add(1, 'day').startOf('day');
    i++;
  }

  return out;
}

/**
 * PaydayInstance[] → 카드 경계. 각 결제일 당일을 상한(endDate)으로 본다.
 * 같은 날짜의 결제일들은 하나의 카드로 묶고, 이벤트명을 ' · '로 합친다.
 */
export function paydayBoundaries(instances: PaydayInstance[]): CardBoundary[] {
  const byDate = new Map<string, PaydayInstance[]>();
  for (const inst of instances) {
    const key = dayjs(inst.date).format('YYYY-MM-DD');
    const arr = byDate.get(key);
    if (arr) arr.push(inst);
    else byDate.set(key, [inst]);
  }

  return [...byDate.values()]
    .map((insts) => {
      const date = insts[0].date;
      return {
        key: dayjs(date).format('YYYY-MM-DD'),
        label: insts.map((i) => i.label).join(' · '),
        endDate: dayjs(date).endOf('day').toDate(),
        subLabel: dayjs(date).format('M월 D일 (ddd)'),
        paydayType: insts[0].type,
      };
    })
    .sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
}

/** WeekBucket[] → 카드 경계. 주의 마지막 날을 상한으로 본다. */
export function weeklyBoundaries(buckets: WeekBucket[]): CardBoundary[] {
  return buckets.map((b) => ({ key: b.key, label: b.label, endDate: b.end }));
}

/**
 * 카드 경계 + 거래 + 현재 보유 현금으로 카드별 들어올/나갈/남는 돈을 누적 계산한다(§9-2).
 * - 각 거래는 endDate가 거래일 이상인 "가장 이른" 카드에 배정된다.
 * - 마지막 카드의 endDate 이후 거래는 표시 구간 밖이라 제외된다.
 * - 남는 돈[i] = (i===0 ? currentCash : 남는 돈[i-1]) + 들어올 돈 - 나갈 돈.
 */
export function buildCashflowCards(
  boundaries: CardBoundary[],
  transactions: CashflowTransaction[],
  currentCash: number,
  opts: { from?: Date; estimatedDailyVariable?: number } = {}
): CashflowCardData[] {
  const sorted = [...boundaries].sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
  const buckets = sorted.map((b) => ({
    boundary: b,
    txns: [] as CashflowTransaction[],
  }));

  for (const t of transactions) {
    const bucket = buckets.find((b) => t.date.getTime() <= b.boundary.endDate.getTime());
    if (bucket) bucket.txns.push(t);
  }

  const dailyVar = opts.estimatedDailyVariable ?? 0;
  let running = currentCash;
  let prevEnd = opts.from ? opts.from.getTime() : (sorted[0]?.endDate.getTime() ?? 0);

  return buckets.map(({ boundary, txns }) => {
    let inflow = 0;
    let outflow = 0;
    for (const t of txns) {
      if (t.type === 'income') inflow += t.amount;
      else outflow += t.amount; // expense + flex
    }
    running = running + inflow - outflow;

    // §7-2 예상 변동지출 = 일평균 변동지출 × 직전 결제일 이후 경과일수 (표시 전용, 잔액 미반영)
    const spanDays = Math.max(1, Math.round((boundary.endDate.getTime() - prevEnd) / 86400000));
    prevEnd = boundary.endDate.getTime();
    const estimatedVariable = dailyVar > 0 ? Math.round(dailyVar * spanDays) : undefined;

    return {
      key: boundary.key,
      label: boundary.label,
      subLabel: boundary.subLabel,
      paydayType: boundary.paydayType,
      endDate: boundary.endDate,
      inflow,
      outflow,
      balance: running,
      isNegative: running < 0,
      transactions: [...txns].sort((a, b) => a.date.getTime() - b.date.getTime()),
      estimatedVariable,
    };
  });
}

/** 가장 이른(다음) 잔액 음수 카드. 없으면 null(§10 음수 경고 배너용). */
export function firstNegativeCard(cards: CashflowCardData[]): CashflowCardData | null {
  return cards.find((c) => c.isNegative) ?? null;
}

/** `${categoryName}|${YYYY-MM}` — 같은 달·같은 카테고리 중복(이중계산) 판정 키. */
export function recurrenceMonthKey(categoryName: string, date: Date): string {
  return `${categoryName}|${dayjs(date).format('YYYY-MM')}`;
}

/** recurrence가 설정된 고정 카테고리의 호라이즌 내 발생 인스턴스(게이트 미적용). 경계·거래 공통 입력. */
export type RecurrenceOccurrence = {
  categoryId: string;
  categoryName: string;
  type: 'income' | 'expense';
  amount: number;
  date: Date;
};

/**
 * recurrence가 설정된 고정 지출/수입 카테고리 → 호라이즌 내 발생 인스턴스.
 * docs/pages/inner/cashflow-recurrence-integration.md 참고.
 * - 포함 조건: `recurrence.enabled` && `expectedAmount > 0` && group ∈ {income, expense}.
 * - 발생일은 `occurrenceDateInMonth`(알림 cron과 동일 primitive)로 계산 → 판정 일치.
 * - 이중계산 게이트(G1/G2)는 적용하지 않는다. 경계(체크포인트)는 항상 만들고, 거래 합성에서만
 *   `recurrenceTransactions`로 걸러낸다(실거래가 있는 달은 그 카드에 실거래가 들어가면 된다).
 */
export function buildRecurrenceOccurrences(
  categories: CashbookCategory[],
  opts: { from: Dayjs; months: number }
): RecurrenceOccurrence[] {
  const start = opts.from.startOf('day');
  const end = start.add(opts.months, 'month').endOf('day');
  const out: RecurrenceOccurrence[] = [];

  for (const cat of categories) {
    const r = cat.recurrence;
    if (!r || !r.enabled) continue;
    if (cat.group !== 'income' && cat.group !== 'expense') continue;
    const amount = r.expectedAmount;
    if (amount == null || amount <= 0) continue;

    // 호라이즌이 걸치는 각 달의 발생일을 계산(buildPaydayInstances와 동일한 월 커서 패턴).
    let monthCursor = start.startOf('month');
    while (monthCursor.isBefore(end) || monthCursor.isSame(end, 'month')) {
      const occ = occurrenceDateInMonth(r, monthCursor);
      monthCursor = monthCursor.add(1, 'month');
      if (!occ) continue;

      const inRange = (occ.isSame(start, 'day') || occ.isAfter(start)) && occ.isBefore(end);
      if (!inRange) continue;

      out.push({
        categoryId: cat.id,
        categoryName: cat.name,
        type: cat.group, // 'income' | 'expense'
        amount,
        date: occ.toDate(),
      });
    }
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export type RecurrenceTxnGate = {
  /** G1: 같은 달 실거래가 있는 `${categoryName}|${YYYY-MM}` 집합 → 그 달 발생분 제외. */
  actualKeys: Set<string>;
  /** G2: 같은 달 활성 예측이 있는 `${categoryName}|${YYYY-MM}` 집합 → 그 달 발생분 제외. */
  activePredictionKeys?: Set<string>;
};

/**
 * 발생 인스턴스 → 합성 예측 거래(◇). G1/G2로 같은 달 실거래·활성 예측이 있으면 제외(이중계산 방지).
 * persist하지 않는 읽기 시점 파생물이라, 실제 기록 시 G1로 자연히 사라진다.
 */
export function recurrenceTransactions(
  occurrences: RecurrenceOccurrence[],
  gate: RecurrenceTxnGate
): CashflowTransaction[] {
  const out: CashflowTransaction[] = [];
  for (const o of occurrences) {
    const monthKey = recurrenceMonthKey(o.categoryName, o.date);
    if (gate.actualKeys.has(monthKey)) continue; // G1: 이미 기록된 달
    if (gate.activePredictionKeys?.has(monthKey)) continue; // G2: 이미 예측이 잡힌 달
    out.push({
      id: `recurrence-${o.categoryId}-${dayjs(o.date).format('YYYY-MM-DD')}`,
      kind: 'predicted',
      type: o.type,
      amount: o.amount,
      category: o.categoryName,
      description: '',
      date: o.date,
      source: 'calendar',
    });
  }
  return out;
}

/**
 * 발생 인스턴스 → 카드 경계(체크포인트). 같은 날짜 발생은 한 카드로 묶고 카테고리명을 ' · '로 합친다.
 * paydayBoundaries와 동일한 형태(key=YYYY-MM-DD, subLabel=날짜)라 mergeBoundariesByDate로 합칠 수 있다.
 */
export function recurrenceBoundaries(occurrences: RecurrenceOccurrence[]): CardBoundary[] {
  const byDate = new Map<string, RecurrenceOccurrence[]>();
  for (const o of occurrences) {
    const key = dayjs(o.date).format('YYYY-MM-DD');
    const arr = byDate.get(key);
    if (arr) arr.push(o);
    else byDate.set(key, [o]);
  }

  return [...byDate.values()]
    .map((occs) => {
      const date = occs[0].date;
      return {
        key: dayjs(date).format('YYYY-MM-DD'),
        label: [...new Set(occs.map((o) => o.categoryName))].join(' · '),
        endDate: dayjs(date).endOf('day').toDate(),
        subLabel: dayjs(date).format('M월 D일 (ddd)'),
      };
    })
    .sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
}

/** LLM이 과거 패턴에서 추정한 예상 거래 1건(API 응답 형태). */
export type LlmPrediction = {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  /** 발생 예상일(YYYY-MM-DD). */
  date: string;
  /** 0~1 추정 신뢰도. */
  confidence: number;
  /** 왜 이렇게 예측했는지 한 줄 사유(표시용). */
  reason?: string;
};

/**
 * LLM 예측 → 합성 예측 거래(◇, source='llm'). 현금흐름 카드의 들어올/나갈/남는 돈에 반영된다.
 * - 호라이즌(from ~ from+months) 안의 예측만.
 * - 정기 발생으로 이미 선언된 카테고리는 통째로 제외(선언이 단일 출처, 캘린더 ◇로 이미 노출됨).
 * - **G1(같은 달 실거래 존재 → 제외)**: 잔액에 반영되므로 같은 달 실거래와의 이중계산을 막는다.
 *   현재 달은 실거래로 잡히고, 실거래가 아직 없는 미래 달만 예측이 들어간다.
 * - 같은 카테고리·같은 날 중복은 dedup(React key 충돌 회피).
 */
export function llmTransactions(
  predictions: LlmPrediction[],
  opts: {
    from: Dayjs;
    months: number;
    /** 정기 발생 선언된 카테고리 이름 집합(통째 제외). */
    declaredCategories: Set<string>;
    /** G1: 같은 달 실거래가 있는 `${categoryName}|${YYYY-MM}` 집합 → 그 달 예측 제외. */
    actualKeys: Set<string>;
  }
): CashflowTransaction[] {
  const start = opts.from.startOf('day');
  const end = start.add(opts.months, 'month').endOf('day');
  const out: CashflowTransaction[] = [];
  const seenIds = new Set<string>();

  for (const p of predictions) {
    if (!p.category || !(p.amount > 0)) continue;
    if (opts.declaredCategories.has(p.category)) continue;

    const d = dayjs(p.date);
    if (!d.isValid()) continue;
    const occ = d.startOf('day');
    const inRange = (occ.isSame(start, 'day') || occ.isAfter(start)) && occ.isBefore(end);
    if (!inRange) continue;

    if (opts.actualKeys.has(recurrenceMonthKey(p.category, occ.toDate()))) continue; // G1

    const id = `llm-${p.category}-${occ.format('YYYY-MM-DD')}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    out.push({
      id,
      kind: 'predicted',
      type: p.type,
      amount: Math.round(p.amount),
      category: p.category,
      description: p.reason ?? '',
      date: occ.toDate(),
      source: 'llm',
    });
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * 여러 경계 목록(결제일·recurrence)을 같은 날짜(key) 기준으로 병합한다(Phase 2).
 * 같은 날짜면 라벨을 ' · '로 합치고, subLabel/paydayType은 먼저 정의된 값을 유지한다.
 */
export function mergeBoundariesByDate(...lists: CardBoundary[][]): CardBoundary[] {
  const byKey = new Map<string, CardBoundary>();
  for (const list of lists) {
    for (const b of list) {
      const existing = byKey.get(b.key);
      if (!existing) {
        byKey.set(b.key, { ...b });
        continue;
      }
      const labels = [...new Set([...existing.label.split(' · '), ...b.label.split(' · ')])];
      byKey.set(b.key, {
        ...existing,
        label: labels.join(' · '),
        subLabel: existing.subLabel ?? b.subLabel,
        paydayType: existing.paydayType ?? b.paydayType,
      });
    }
  }
  return [...byKey.values()].sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
}
