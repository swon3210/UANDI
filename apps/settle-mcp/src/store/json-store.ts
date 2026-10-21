import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Batch, StagedStatus, StagedTransaction } from '../core/types';

export type StagedFilter = {
  status?: StagedStatus[];
  offset?: number;
  limit?: number;
};

/** 스테이징·배치 저장소. 도구 계층은 이 인터페이스만 본다 */
export interface Store {
  createBatch(batch: Batch): Promise<void>;
  getBatch(id: string): Promise<Batch | null>;
  updateBatch(id: string, patch: Partial<Batch>): Promise<Batch>;
  /** 아직 커밋되지 않은 가장 최근 배치 (save_rule 재적용 대상) */
  latestStagingBatch(coupleId: string): Promise<Batch | null>;
  /** 커플의 배치 전부, 최근 생성 순 */
  listBatches(coupleId: string): Promise<Batch[]>;
  insertStaged(rows: StagedTransaction[]): Promise<void>;
  listStaged(batchId: string, filter?: StagedFilter): Promise<StagedTransaction[]>;
  countStaged(batchId: string, status?: StagedStatus[]): Promise<number>;
  getStaged(id: string): Promise<StagedTransaction | null>;
  updateStaged(id: string, patch: Partial<StagedTransaction>): Promise<StagedTransaction>;
}

type StoreFile = {
  version: 1;
  batches: Record<string, Batch>;
  staged: Record<string, StagedTransaction>;
};

const EMPTY: StoreFile = { version: 1, batches: {}, staged: {} };

/**
 * JSON 파일 하나로 된 저장소. 네이티브 모듈 없이 어느 Node에서든 돌아간다.
 * 한 결산의 스테이징은 수백 행이라 파일 전체를 읽고 쓰는 비용이 무시할 만하다.
 * 쓰기는 임시 파일 → rename으로 원자적이다.
 */
export class JsonFileStore implements Store {
  private cache: StoreFile | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly path: string) {}

  private async load(): Promise<StoreFile> {
    if (this.cache) return this.cache;
    try {
      const raw = await readFile(this.path, 'utf8');
      this.cache = JSON.parse(raw) as StoreFile;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      this.cache = structuredClone(EMPTY);
    }
    return this.cache;
  }

  private async flush(): Promise<void> {
    const data = await this.load();
    await mkdir(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await rename(tmp, this.path);
  }

  /** 쓰기를 직렬화해 동시 호출이 서로 덮어쓰지 않게 한다 */
  private write<T>(fn: (data: StoreFile) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const data = await this.load();
      const result = fn(data);
      await this.flush();
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  createBatch(batch: Batch): Promise<void> {
    return this.write((d) => {
      d.batches[batch.id] = batch;
    });
  }

  async getBatch(id: string): Promise<Batch | null> {
    return (await this.load()).batches[id] ?? null;
  }

  updateBatch(id: string, patch: Partial<Batch>): Promise<Batch> {
    return this.write((d) => {
      const prev = d.batches[id];
      if (!prev) throw new Error(`batch not found: ${id}`);
      const next = { ...prev, ...patch };
      d.batches[id] = next;
      return next;
    });
  }

  async listBatches(coupleId: string): Promise<Batch[]> {
    const d = await this.load();
    return Object.values(d.batches)
      .filter((b) => b.coupleId === coupleId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async latestStagingBatch(coupleId: string): Promise<Batch | null> {
    const d = await this.load();
    const candidates = Object.values(d.batches)
      .filter((b) => b.coupleId === coupleId && b.status === 'staging')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return candidates[0] ?? null;
  }

  insertStaged(rows: StagedTransaction[]): Promise<void> {
    return this.write((d) => {
      for (const row of rows) d.staged[row.id] = row;
    });
  }

  async listStaged(batchId: string, filter: StagedFilter = {}): Promise<StagedTransaction[]> {
    const d = await this.load();
    const statuses = filter.status ? new Set(filter.status) : null;
    const rows = Object.values(d.staged)
      .filter((r) => r.batchId === batchId && (!statuses || statuses.has(r.status)))
      .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? -1 : 1));
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? rows.length;
    return rows.slice(offset, offset + limit);
  }

  async countStaged(batchId: string, status?: StagedStatus[]): Promise<number> {
    return (await this.listStaged(batchId, { status })).length;
  }

  async getStaged(id: string): Promise<StagedTransaction | null> {
    return (await this.load()).staged[id] ?? null;
  }

  updateStaged(id: string, patch: Partial<StagedTransaction>): Promise<StagedTransaction> {
    return this.write((d) => {
      const prev = d.staged[id];
      if (!prev) throw new Error(`staged row not found: ${id}`);
      const next = { ...prev, ...patch };
      d.staged[id] = next;
      return next;
    });
  }
}
