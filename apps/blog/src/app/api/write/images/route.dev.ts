import { NextResponse } from 'next/server';
import { WRITE_ENABLED, saveImage } from '@/lib/write';

// POST /api/write/images — 클립보드·드래그로 붙인 이미지를 public/images/posts/<slug>/ 에 저장
export async function POST(request: Request) {
  if (!WRITE_ENABLED) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  const form = await request.formData();
  const file = form.get('file');
  const slug = (form.get('slug') as string | null) ?? '';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '이미지 파일이 없습니다.' }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const { url } = saveImage({ slug, mime: file.type, bytes });
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : '이미지 저장에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
