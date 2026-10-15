export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 tracking-tight ${light ? "text-white" : "text-ink"}`}>
      <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
        <path d="M1 1h3.2L9.6 17H6.4L1 1z" fill="#e11d2e" />
        <path d="M7.2 1H10.4L16.8 17h-3.2L7.2 1z" fill="#e11d2e" />
      </svg>
      <span className="font-bold tracking-tight">ADMEXO</span>
      <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${light ? "text-white/60" : "text-muted"}`}>Workspace</span>
    </span>
  );
}
