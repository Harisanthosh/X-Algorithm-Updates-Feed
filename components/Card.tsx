import type { SlideData } from "@/lib/cards";
import { CodeBlock } from "./CodeBlock";
import { ShareButton } from "./ShareButton";

/** One finding card: one viewport tall, plain English, real lines next to it. */
export function Card({ slide, id }: { slide: SlideData; id: string }) {
  const first = slide.snippets?.[0];
  const titleId = `${id}-title`;

  return (
    <section id={id} className="slide" aria-labelledby={titleId}>
      <article className="inner">
        <div className="card-top">
          <div className="topics">
            {slide.topics.map((t) => (
              <span key={t} className="pill">
                {t}
              </span>
            ))}
          </div>
          {slide.isNew && <span className="badge-new">new</span>}
        </div>

        <h2 id={titleId} className="card-title">
          {slide.title}
        </h2>
        {slide.dek && <p className="dek">{slide.dek}</p>}

        <h3 className="label">What changed</h3>
        <p className="body">{slide.whatChanged}</p>

        {slide.snippets?.map((s) => (
          <CodeBlock key={`${s.path}:${s.startLine}`} snippet={s} />
        ))}

        <h3 className="label">What this means for creators</h3>
        <p className="body">{slide.meaningForCreators}</p>

        <p className="action">{slide.action}</p>

        <div className="card-actions">
          <ShareButton slug={slide.slug} title={slide.title} />
          {first && (
            <a className="btn" href={first.url} target="_blank" rel="noopener noreferrer">
              Open the code
            </a>
          )}
        </div>

        <footer className="card-foot">
          <span>Defaults in the repo. Live settings can differ.</span>
          <span>built with Grok Bot</span>
        </footer>
      </article>
    </section>
  );
}
