import { About } from "@/components/About";
import { ContrastSection } from "@/components/ContrastSection";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HistoryIntro } from "@/components/HistoryIntro";
import { Marquee } from "@/components/Marquee";
import { PhrasesGrid } from "@/components/PhrasesGrid";
import { Services } from "@/components/Services";
import { Testimonials } from "@/components/Testimonials";
import { TopBar } from "@/components/TopBar";
import { WhyDifferent } from "@/components/WhyDifferent";

export default function Home() {
  return (
    <main className="relative">
      <TopBar />
      <Hero />
      <Marquee />
      <ContrastSection />
      <PhrasesGrid />
      <HistoryIntro />
      <WhyDifferent />
      <About />
      <Services />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
