interface StatusIndicatorProps {
  label: string;
  value: string;
}

export function StatusIndicator({ label, value }: StatusIndicatorProps) {
  return (
    <span className="status-indicator">
      <span aria-hidden="true" />
      {label}: {value}
    </span>
  );
}
