"use client";

type Props = {
  topics: string[];
  active: string | null;
  onChange: (topic: string | null) => void;
};

export function FilterBar({ topics, active, onChange }: Props) {
  return (
    <nav className="filters" aria-label="Filter cards by topic">
      <button
        type="button"
        className="chip"
        aria-pressed={active === null}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {topics.map((t) => (
        <button
          key={t}
          type="button"
          className="chip"
          aria-pressed={active === t}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </nav>
  );
}
