import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WatermarkBackground from "@/components/WatermarkBackground";
import CaseStudies from "@/components/CaseStudies";
import Partners from "@/components/Partners";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import MobileCTA from "@/components/MobileCTA";
import SmoothScroll from "@/components/SmoothScroll";

// Catalog is the heaviest interactive piece (search/filters/pagination) —
// split it into its own chunk instead of bloating the initial page bundle.
const Catalog = dynamic(() => import("@/components/Catalog"), {
  loading: () => <CatalogSkeleton />,
});

function CatalogSkeleton() {
  return (
    <section
      id="catalog"
      aria-hidden="true"
      className="mx-auto max-w-[1240px] px-5 pb-24 md:px-7"
    >
      <div className="mb-6 h-11 w-64 animate-pulse rounded-lg bg-white/10" />
      <div className="mb-6 h-5 w-full max-w-[500px] animate-pulse rounded bg-white/5" />
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[320px] animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <SmoothScroll />
      <WatermarkBackground />
      <div className="relative z-10">
        <Header />
        <Hero />
        <Catalog />
        <CaseStudies />
        <Partners />
        <ContactSection />
        <Footer />
        <MobileCTA />
      </div>
    </div>
  );
}
