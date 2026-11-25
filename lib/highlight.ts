import { codeToHtml } from "shiki";
import type { Snippet } from "@/content/schema";

/**
 * Highlight one snippet with Shiki. Output has one `.line` per source line,
 * tagged with its real repo line number (`data-n`) and `.hl` when highlighted.
 * Both light and dark colors are emitted as CSS variables; globals.css picks one.
 */
export async function highlightSnippet(snippet: Snippet): Promise<string> {
  const lang = snippet.language === "other" ? "text" : snippet.language;
  const highlight = new Set(snippet.highlightLines ?? []);

  return codeToHtml(snippet.code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
    transformers: [
      {
        line(node, line) {
          const n = snippet.startLine + line - 1;
          node.properties["data-n"] = String(n);
          if (highlight.has(n)) this.addClassToHast(node, "hl");
        },
      },
    ],
  });
}
