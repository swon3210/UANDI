export type SettleErrorCode =
  | 'NOT_CONNECTED'
  | 'INVALID_INPUT'
  | 'RULES_INVALID'
  | 'RULES_WRITE_FAILED'
  | 'FIRESTORE_READ_FAILED'
  | 'FIRESTORE_WRITE_FAILED'
  | 'TOO_MANY_TRANSACTIONS'
  | 'BATCH_NOT_FOUND'
  | 'BATCH_ALREADY_COMMITTED'
  | 'BATCH_NOT_COMMITTED'
  | 'UNKNOWN_CATEGORY'
  | 'IGNORED_LOCKED'
  | 'INVALID_PATTERN'
  | 'PATTERN_TOO_BROAD'
  | 'NOTHING_TO_COMMIT'
  | 'COMMIT_BLOCKED'
  | 'COMMIT_PARTIAL'
  | 'UNDO_EXPIRED'
  | 'KEYCHAIN_UNAVAILABLE'
  | 'CONNECT_FAILED';

/** 도구가 LLM에게 돌려주는 구조화 에러. MCP 결과의 isError:true 본문이 된다. */
export class SettleError extends Error {
  readonly code: SettleErrorCode;
  readonly details?: unknown;

  constructor(code: SettleErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'SettleError';
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return { code: this.code, message: this.message, details: this.details };
  }
}
