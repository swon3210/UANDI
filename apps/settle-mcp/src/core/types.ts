// 로컬 스테이징 데이터 모델 (docs/09-settle-mcp.md §4)
// Firestore에는 CashbookEntry만 쓴다. 아래 타입은 전부 사용자 PC에만 남는다.

export type EntryType = 'income' | 'expense';

export type SourceKind = 'account' | 'card';

export type StagedStatus =
  | 'pending' // 커밋 대상
  | 'duplicate' // 기존 내역과 날짜+금액 일치 (기본 제외, 사용자가 pending으로 바꿀 수 있음)
  | 'ignored' // 무시 패턴 일치 (카드대금 등). 커밋 불가
  | 'transfer' // 송금 판정. 기본 제외, 사용자가 pending으로 바꿀 수 있음
  | 'committed'; // 커밋 완료 (committedEntryId 보유)

export type CategorySource = 'rule' | 'llm' | 'user';

export type StagedTransaction = {
  id: string;
  batchId: string;
  /** §4.3 배치 내 지문. sha256(date|amount|normalize(rawDescription)) 앞 16자 */
  fingerprint: string;
  /** YYYY-MM-DD */
  date: string;
  /** 원화 양의 정수 */
  amount: number;
  type: EntryType;
  /** LLM이 읽은 적요 원문. 로컬에만 남고 Firestore로 가지 않는다 */
  rawDescription: string;
  /** 별칭 치환 후 적요. 이것만 Firestore로 간다 */
  description: string;
  /** null이면 커밋 불가 */
  category: string | null;
  categorySource: CategorySource | null;
  /** 카테고리를 정한 규칙 id (categorySource==='rule'일 때). "왜 이 카테고리인가"를 설명할 수 있어야 한다 */
  appliedRuleId: string | null;
  /** 스테이징 때 이 행에 붙은 제안(Suggestion) id들. 제안은 StageOutput.suggestions에 있다 */
  suggestionIds: string[];
  status: StagedStatus;
  /** 예: 'ignore:카드대금', 'dup:existing#abc123', 'transfer:pattern' */
  statusReason: string | null;
  /** 기존 cashbookEntries 문서 ID */
  duplicateOf: string | null;
  /** 'KB국민 입출금 2026-09.pdf p.2' 같은 출처 메모 (LLM 제공) */
  sourceHint: string | null;
  committedEntryId: string | null;
  /** ISO */
  createdAt: string;
};

export type BatchStatus = 'staging' | 'committed' | 'undone';

export type Batch = {
  id: string;
  coupleId: string;
  label: string;
  source: { kind: SourceKind; name: string | null };
  stagedCount: number;
  committedCount: number;
  /** undo용. 커밋 전 [] */
  committedEntryIds: string[];
  /** 스테이징 시점의 기계 규칙 수. 회고의 rulesSavedDuringBatch = 지금 규칙 수 − 이 값. v2 이전 배치는 null */
  rulesAtStart: number | null;
  status: BatchStatus;
  createdAt: string;
  committedAt: string | null;
  undoneAt: string | null;
};

/** 기존 Firestore 내역을 중복 대조에 필요한 최소 형태로 줄인 것 */
export type ExistingEntry = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  amount: number;
};

/** 카테고리 후보 목록(리소스·검증용). cashbook-core의 CashbookCategory에서 필요한 필드만 */
export type CategorySummary = {
  name: string;
  group: 'income' | 'expense';
  subGroup: string;
  parent: string | null;
  description: string;
  examples: string[];
};
