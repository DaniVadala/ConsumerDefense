import dynamic from 'next/dynamic';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';

// Below-the-fold: lazy loaded — not included in the initial JS bundle
const TrustSignals = dynamic(() => import('@/components/trust-signals').then(m => ({ default: m.TrustSignals })));
const StepsSection = dynamic(() => import('@/components/steps-section').then(m => ({ default: m.StepsSection })));
const InfoSection = dynamic(() => import('@/components/info-section').then(m => ({ default: m.InfoSection })));
const AboutSyndesix = dynamic(() => import('@/components/ui/about-qualifai').then(m => ({ default: m.AboutQualifAI })));
const PreFooterCta = dynamic(() => import('@/components/pre-footer-cta').then(m => ({ default: m.PreFooterCta })));
const Footer = dynamic(() => import('@/components/footer').then(m => ({ default: m.Footer })));
const WhatsAppFab = dynamic(() => import('@/components/whatsapp-fab').then(m => ({ default: m.WhatsAppFab })));

export default function Home() {
  return (
    <>
      <Header />
      <WhatsAppFab />
      <main id="main-content" className="min-h-screen bg-white">
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
