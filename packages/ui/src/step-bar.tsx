"use client";

interface StepBarProps {
  total: number;
  current: number;
}

export function StepBar({ total, current }: StepBarProps) {
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
