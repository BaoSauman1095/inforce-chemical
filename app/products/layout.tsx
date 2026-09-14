import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileCTA from "@/components/MobileCTA";
import SmoothScroll from "@/components/SmoothScroll";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <SmoothScroll />
      <div className="relative z-10">
        <Header />
        <main className="pb-24 md:pb-0">{children}</main>
        <Footer />
        <MobileCTA />
      </div>
    </div>
  );
}
