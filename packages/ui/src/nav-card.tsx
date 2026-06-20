"use client";

interface NavCardProps {
  icon: string;
  label: string;
  description?: string;
  primary?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function NavCard({ icon, label, description, primary, onClick, disabled }: NavCardProps) {
  return (
    <button
      type="button"
      className={`nav-card${primary ? " nav-card--primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="nav-card__icon" aria-hidden="true">{icon}</span>
      <span>
        <div className="nav-card__label">{label}</div>
        {description && <div className="nav-card__desc">{description}</div>}
      </span>
    </button>
  );
}
