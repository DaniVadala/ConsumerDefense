import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/header';
import { ChatAvailabilityProvider } from '@/lib/chat-availability-context';

const Footer = dynamic(() => import('@/components/layout/footer').then((m) => ({ default: m.Footer })));
const WhatsAppFab = dynamic(() => import('@/components/whatsapp-fab').then((m) => ({ default: m.WhatsAppFab })));

export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatAvailabilityProvider>
      <Header />
      <WhatsAppFab />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white pt-16">
        <main id="main-content" className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </div>
    </ChatAvailabilityProvider>
  );
}
