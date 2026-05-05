type SectionLabelProps = {
  children: React.ReactNode;
};

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-stone-200" />
      <span
        className="text-[11px] font-semibold tracking-[0.08em] text-stone-400 uppercase"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {children}
      </span>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}
