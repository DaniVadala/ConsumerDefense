import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/header';
import { Hero } from '@/components/sections/hero';
import { ChatAvailabilityProvider } from '@/lib/chat-availability-context';

// Below-the-fold: lazy loaded — not included in the initial JS bundle
const TrustSignals = dynamic(() => import('@/components/sections/trust-signals').then(m => ({ default: m.TrustSignals })));
const StepsSection = dynamic(() => import('@/components/sections/steps-section').then(m => ({ default: m.StepsSection })));
const InfoSection = dynamic(() => import('@/components/sections/info-section').then(m => ({ default: m.InfoSection })));
const AboutSyndesix = dynamic(() => import('@/components/sections/about-qualifai').then(m => ({ default: m.AboutQualifAI })));
const PreFooterCta = dynamic(() => import('@/components/sections/pre-footer-cta').then(m => ({ default: m.PreFooterCta })));
const Footer = dynamic(() => import('@/components/layout/footer').then(m => ({ default: m.Footer })));
const WhatsAppFab = dynamic(() => import('@/components/whatsapp-fab').then(m => ({ default: m.WhatsAppFab })));

export default function Home() {
  return (
    <ChatAvailabilityProvider>
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
    </ChatAvailabilityProvider>
  );
}
