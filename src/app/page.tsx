import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { StepsSection } from '@/components/steps-section';
import { InfoSection } from '@/components/info-section';
import { TrustSignals } from '@/components/trust-signals';
import { WhatsAppFab } from '@/components/whatsapp-fab';
import { Footer } from '@/components/footer';
import { PreFooterCta } from '@/components/pre-footer-cta';
import { AboutQualifAI as AboutSyndesix } from '@/components/about-qualifai';

export default function Home() {
  return (
    <>
      <Header />
      <WhatsAppFab />
      <main className="min-h-screen bg-white">
        <Hero />
        <TrustSignals />
        <StepsSection />
        <InfoSection />
        <AboutSyndesix />
        <PreFooterCta />
        <Footer />
      </main>
    </>
  );
}
