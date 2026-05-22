import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { HeroCinematic } from "@/components/marketing/hero-cinematic";
import { LogoCloud } from "@/components/marketing/logo-cloud";
import { FeaturesBento } from "@/components/marketing/features-bento";
import { AIShowcase } from "@/components/marketing/ai-showcase";
import { DashboardPreviewSection } from "@/components/marketing/dashboard-preview-section";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";
import { FAQ } from "@/components/marketing/faq";
import { CTA } from "@/components/marketing/cta";
import { SmoothScroll } from "@/components/effects/smooth-scroll";
import { ScrollProgress } from "@/components/effects/scroll-progress";

export default function HomePage() {
  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <MarketingNavbar />
      <main className="relative">
        <HeroCinematic />
        <LogoCloud />
        <FeaturesBento />
        <AIShowcase />
        <DashboardPreviewSection />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <MarketingFooter />
    </>
  );
}
