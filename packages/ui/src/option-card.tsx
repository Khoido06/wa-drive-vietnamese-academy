"use client";

const LETTERS = ["A", "B", "C", "D", "E"];

interface OptionCardProps {
  id: string;
  text: string;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
  state?: "default" | "correct" | "wrong";
}

export function OptionCard({
  id,
  text,
  index,
  selected,
  onSelect,
  disabled,
  state = "default",
}: OptionCardProps) {
  const stateClass =
    state === "correct" ? " option-card--correct"
    : state === "wrong" ? " option-card--wrong"
    : selected ? " option-card--selected" : "";

  return (
    <button
      type="button"
      className={`option-card${stateClass}`}
      onClick={() => onSelect(id)}
      disabled={disabled}
    >
      <span className="option-letter">{LETTERS[index] ?? index + 1}</span>
      <span>{text}</span>
    </button>
  );
}
