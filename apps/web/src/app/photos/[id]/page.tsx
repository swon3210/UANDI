// TODO: 사진 상세 구현
// 구현 명세: docs/pages/03-photo-gallery.md

export default async function PhotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="flex min-h-screen flex-col px-4 pt-14">
      <p className="text-sm text-muted-foreground">사진 ID: {id}</p>
    </main>
  );
}
