interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <p className="technical-label">{title}</p>
      <p>{message}</p>
    </div>
  );
}
