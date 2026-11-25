import type { CSSProperties } from "react";
import type { SlideData } from "@/lib/cards";

const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Cover and about slides. No snippets, so they are not forced into the card layout. */
export function SpecialCard({ slide, id, active }: { slide: SlideData; id: string; active: boolean }) {
  const titleId = `${id}-title`;
  const isCover = slide.kind === "cover";

  return (
    <section id={id} className={`slide${active ? " is-active" : ""}`} aria-labelledby={titleId}>
      <article className="inner special">
        <h2 id={titleId} className={`${isCover ? "cover-title" : "card-title"} reveal`} style={at(40)}>
          {slide.title}
        </h2>
        {slide.body?.map((p, i) => (
          <p key={p} className="body reveal" style={at(160 + i * 90)}>
            {p}
          </p>
        ))}
        {slide.links && (
          <ul className="links reveal" style={at(160 + (slide.body?.length ?? 0) * 90)}>
            {slide.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        {isCover && (
          <p className="hint reveal" style={at(700)}>
            Swipe, scroll, or press J and K. Home and End jump to the ends.
          </p>
        )}
      </article>
    </section>
  );
}
