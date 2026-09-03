import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WatermarkBackground from "@/components/WatermarkBackground";
import Catalog from "@/components/Catalog";
// Тимчасово прихований блок "Наші результати в полі"
// import CaseStudies from "@/components/CaseStudies";
import Partners from "@/components/Partners";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import MobileCTA from "@/components/MobileCTA";
import SmoothScroll from "@/components/SmoothScroll";

export default function HomePage() {
  return (
    <div className="relative">
      <SmoothScroll />
      <WatermarkBackground />
      <div className="relative z-10">
        <Header />
        <Hero />
        <Catalog />
        {/* Тимчасово прихований блок "Наші результати в полі" */}
        {/* <CaseStudies /> */}
        <Partners />
        <ContactSection />
        <Footer />
        <MobileCTA />
      </div>
    </div>
  );
}
