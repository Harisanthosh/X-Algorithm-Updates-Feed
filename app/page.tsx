import { Feed } from "@/components/Feed";
import { getSlides } from "@/lib/cards";

export default async function Home() {
  const slides = await getSlides();
  return <Feed slides={slides} />;
}
