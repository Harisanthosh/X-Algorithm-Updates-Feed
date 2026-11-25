import type { SlideData } from "@/lib/cards";

/** Cover and about slides. No snippets, so they are not forced into the card layout. */
export function SpecialCard({ slide, id }: { slide: SlideData; id: string }) {
  const titleId = `${id}-title`;
  const isCover = slide.kind === "cover";

  return (
    <section id={id} className="slide" aria-labelledby={titleId}>
      <article className="inner special">
        <h2 id={titleId} className={isCover ? "cover-title" : "card-title"}>
          {slide.title}
        </h2>
        {slide.body?.map((p) => (
          <p key={p} className="body">
            {p}
          </p>
        ))}
        {slide.links && (
          <ul className="links">
            {slide.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        {isCover && <p className="hint">Swipe, scroll, or press J and K. Home and End jump to the ends.</p>}
      </article>
    </section>
  );
}
