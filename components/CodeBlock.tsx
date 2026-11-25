import type { SnippetView } from "@/lib/cards";

/** One short excerpt. The path and line range link to the exact GitHub lines. */
export function CodeBlock({ snippet }: { snippet: SnippetView }) {
  const lines =
    snippet.endLine > snippet.startLine
      ? `L${snippet.startLine}-L${snippet.endLine}`
      : `L${snippet.startLine}`;

  return (
    <figure className="snippet">
      <figcaption className="snippet-head">
        <a href={snippet.url} target="_blank" rel="noopener noreferrer">
          {snippet.path} <span className="snippet-lines">{lines}</span>
        </a>
      </figcaption>
      {/* Shiki output is generated at build time from our own content files. */}
      <div className="code" dangerouslySetInnerHTML={{ __html: snippet.html }} />
    </figure>
  );
}
