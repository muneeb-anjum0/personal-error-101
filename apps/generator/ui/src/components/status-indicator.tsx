interface StatusIndicatorProps {
  label: string;
  value: string;
  tone: "ready" | "pending" | "error";
}

const toneClasses: Record<StatusIndicatorProps["tone"], string> = {
  ready: "status-dot status-dot-ready",
  pending: "status-dot status-dot-pending",
  error: "status-dot status-dot-error"
};

export function StatusIndicator({ label, value, tone }: StatusIndicatorProps) {
  return (
    <div className="status-row">
      <span className={toneClasses[tone]} aria-hidden="true" />
      <span className="status-label">{label}</span>
      <span className="status-value">{value}</span>
    </div>
  );
}
