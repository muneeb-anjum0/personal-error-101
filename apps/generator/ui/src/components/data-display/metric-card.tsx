export function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
