/** Quiet progress mark, for example "12 / 22". */
export function Progress({ index, total }: { index: number; total: number }) {
  return (
    <span className="progress" aria-live="polite">
      {index + 1} / {total}
    </span>
  );
}
