import { NextResponse } from 'next/server';
import {
  WRITE_ENABLED,
  deleteDraftSnapshot,
  readDraftSnapshot,
  saveDraftSnapshot,
} from '@/lib/write';

function notFound() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

function keyOf(request: Request): string {
  return new URL(request.url).searchParams.get('key') ?? '';
}

// GET /api/write/drafts?key=... → 임시저장본 (없으면 null)
export async function GET(request: Request) {
  if (!WRITE_ENABLED) return notFound();
  return NextResponse.json({ draft: readDraftSnapshot(keyOf(request)) });
}

// POST /api/write/drafts → 쓰는 중인 내용을 스냅샷으로 저장
export async function POST(request: Request) {
  if (!WRITE_ENABLED) return notFound();

  const payload = (await request.json()) as {
    key?: string;
    form?: Record<string, unknown>;
    body?: string;
  };

  try {
    const snapshot = saveDraftSnapshot({
      key: payload.key ?? '',
      form: payload.form ?? {},
      body: payload.body ?? '',
    });
    return NextResponse.json({ savedAt: snapshot.savedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : '임시저장에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/write/drafts?key=... → 정식 저장했거나 버렸을 때 정리
export async function DELETE(request: Request) {
  if (!WRITE_ENABLED) return notFound();

  deleteDraftSnapshot(keyOf(request));
  return NextResponse.json({ ok: true });
}
