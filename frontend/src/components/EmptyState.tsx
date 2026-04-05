import "./EmptyState.css";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fade-in">
      <span className="empty-icon" aria-hidden="true">{icon}</span>
      <h2 className="empty-title">{title}</h2>
      <p className="empty-description">{description}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
