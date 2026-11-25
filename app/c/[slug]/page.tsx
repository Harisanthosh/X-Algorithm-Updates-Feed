import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "@/components/Feed";
import { getCardSlugs, getSlides, loadCards } from "@/lib/cards";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getCardSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const cards = await loadCards();
  const card = cards.find((c) => c.slug === slug && c.verified);
  if (!card) return { title: "Not found" };
  return {
    title: `${card.title} | X Algorithm Scroll`,
    description: card.dek ?? card.whatChanged,
    alternates: { canonical: `/c/${card.slug}` },
  };
}

/** Same feed, opened on this card. Unknown or unverified slugs are a 404. */
export default async function CardPage({ params }: Params) {
  const { slug } = await params;
  const slides = await getSlides();
  if (!slides.some((s) => s.kind === "card" && s.slug === slug)) notFound();
  return <Feed slides={slides} initialSlug={slug} />;
}
