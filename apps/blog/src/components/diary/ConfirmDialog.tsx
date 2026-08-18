'use client';

type Props = {
  title: string;
  description?: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl">
        <p className="text-[15px] font-semibold text-gray-900">{title}</p>
        {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {pending ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
