import type { CSSProperties } from "react";
import type { SlideData } from "@/lib/cards";
import { ActionRail } from "./ActionRail";
import { CodeBlock } from "./CodeBlock";
/** Timing (ms) for the reveal sequence. Code lines run first, then the explanation. */
const TITLE_DELAY = 40;
const CODE_START = 340;
const LINE_STEP = 45;
const MAX_LINE_STEPS = 18;

const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** One finding card: one viewport tall, plain English, real lines next to it. */
export function Card({ slide, id, active }: { slide: SlideData; id: string; active: boolean }) {
  const first = slide.snippets?.[0];
  const titleId = `${id}-title`;

  // Total code lines drive when the explanation starts, so the stagger never overlaps the code.
  const codeLines = (slide.snippets ?? []).reduce((n, s) => n + (s.html.match(/class="line"/g)?.length ?? 0), 0);
  const codeSteps = Math.min(codeLines, MAX_LINE_STEPS);
  const explainStart = CODE_START + codeSteps * LINE_STEP + 120;

  return (
    <section id={id} className={`slide${active ? " is-active" : ""}`} aria-labelledby={titleId}>
      <article className="inner">
        <div className="card-top reveal" style={at(0)}>
          <div className="topics">
            {slide.topics.map((t) => (
              <span key={t} className="pill">
                {t}
              </span>
            ))}
          </div>
          {slide.isNew && <span className="badge-new">new</span>}
        </div>

        <h2 id={titleId} className="card-title reveal" style={at(TITLE_DELAY)}>
          {slide.title}
        </h2>
        {slide.dek && (
          <p className="dek reveal" style={at(TITLE_DELAY + 90)}>
            {slide.dek}
          </p>
        )}

        <h3 className="label reveal" style={at(TITLE_DELAY + 160)}>
          What changed
        </h3>
        <p className="body reveal" style={at(TITLE_DELAY + 200)}>
          {slide.whatChanged}
        </p>

        {slide.snippets?.map((s) => (
          <CodeBlock key={`${s.path}:${s.startLine}`} snippet={s} />
        ))}

        <div className="implications">
          <h3 className="label reveal" style={at(explainStart)}>
            What this means for creators
          </h3>
          <p className="body reveal" style={at(explainStart + 70)}>
            {slide.meaningForCreators}
          </p>
          <p className="action reveal" style={at(explainStart + 180)}>
            {slide.action}
          </p>
        </div>

        <footer className="card-foot reveal" style={at(explainStart + 320)}>
          <span>Defaults in the repo. Live settings can differ.</span>
          <span>built with Grok Bot</span>
        </footer>
      </article>

      <ActionRail slug={slide.slug} title={slide.title} codeUrl={first?.url} />
    </section>
  );
}
