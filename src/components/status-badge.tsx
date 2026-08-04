export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: string }) {
  return <span className="status-badge" data-tone={tone}>{label}</span>;
}
