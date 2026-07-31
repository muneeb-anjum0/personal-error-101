export function StatusIndicator({ status, label }: { status: string; label: string }) {
  return (
    <span className={`status-pill status-${status.replaceAll("_", "-")}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}
