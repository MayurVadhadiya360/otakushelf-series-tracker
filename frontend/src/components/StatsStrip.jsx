export default function StatsStrip({ stats }) {
  if (!stats) return null;

  const items = [
    { label: "Total", value: stats.total },
    { label: "In progress", value: stats.by_status?.in_progress ?? 0 },
    { label: "Completed", value: stats.by_status?.completed ?? 0 },
    { label: "On hold", value: stats.by_status?.on_hold ?? 0 },
  ];

  return (
    <div className="stats-strip">
      {items.map((item) => (
        <div className="stat-card" key={item.label}>
          <span className="stat-value">{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
