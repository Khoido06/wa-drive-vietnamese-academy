"use client";

interface StepBarProps {
  total: number;
  current: number;
}

export function StepBar({ total, current }: StepBarProps) {
  const pct = Math.round(((current + 1) / total) * 100);

  if (total > 15) {
    return (
      <div className="step-bar step-bar--compact" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
        <div className="step-bar__track">
          <div className="step-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="step-bar__label">Câu {current + 1} / {total} ({pct}%)</p>
      </div>
    );
  }

  return (
    <div className="step-bar" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`step-bar__dot${i < current ? " step-bar__dot--done" : i === current ? " step-bar__dot--current" : ""}`}
        />
      ))}
    </div>
  );
}
