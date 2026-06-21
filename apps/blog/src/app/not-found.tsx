import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot/error.png"
        alt=""
        aria-hidden="true"
        className="w-32 h-auto"
      />
      <h1 className="mt-6 text-xl font-bold text-gray-900">
        찾는 글이 없어요
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        주소가 바뀌었거나, 아직 없는 글일 수 있어요.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-[var(--color-primary)] hover:underline"
      >
        &larr; 목록으로 돌아가기
      </Link>
    </div>
  );
}
