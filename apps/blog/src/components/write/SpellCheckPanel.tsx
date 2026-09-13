import type { SpellIssue } from '@/lib/spellcheck';

export type SpellCheckState = {
  status: 'idle' | 'checking' | 'done' | 'error';
  issues: SpellIssue[];
  message: string;
};

function headline(state: SpellCheckState): string {
  if (state.status === 'checking') return '검사 중…';
  if (state.status === 'error') return state.message;
  if (state.status === 'idle') return '글을 쓰면 자동으로 검사합니다';
  return state.issues.length === 0 ? '고칠 곳이 없습니다' : `${state.issues.length}건`;
}

export function SpellCheckPanel({
  state,
  onFix,
  onIgnore,
  onRecheck,
}: {
  state: SpellCheckState;
  onFix: (issue: SpellIssue) => void;
  onIgnore: (issue: SpellIssue) => void;
  onRecheck: () => void;
}) {
  return (
    <div className="border-t border-gray-100 bg-gray-50/70">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          맞춤법
        </span>
        <span className={`text-xs ${state.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
          {headline(state)}
        </span>
        <button
          type="button"
          className="ml-auto rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
          onClick={onRecheck}
          disabled={state.status === 'checking'}
        >
          다시 검사
        </button>
      </div>

      {state.issues.length > 0 ? (
        <ul className="max-h-52 space-y-1 overflow-y-auto px-2 pb-2">
          {state.issues.map((issue) => (
            <li key={issue.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-500 line-through">{issue.token}</span>
                <span className="text-gray-300">→</span>
                <span className="font-semibold text-gray-900">{issue.suggestion}</span>

                <div className="ml-auto flex shrink-0 gap-1">
                  {issue.start >= 0 ? (
                    <button
                      type="button"
                      className="rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white hover:opacity-90"
                      onClick={() => onFix(issue)}
                    >
                      고치기
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-50"
                    onClick={() => onIgnore(issue)}
                  >
                    무시
                  </button>
                </div>
              </div>

              {issue.info ? <p className="mt-1 text-[11px] text-gray-400">{issue.info}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
