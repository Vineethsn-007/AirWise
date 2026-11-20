import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';
import { AppStateProvider } from '@/components/AppState';

export const metadata: Metadata = {
  title: 'AirWise — breathe easier, together',
  description:
    'Live air quality, deterministic EPA health guidance, and personalised low-emission plans for families.',
  applicationName: 'AirWise',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F4F9FC',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-paper font-sans text-sky-ink antialiased">
        <a
          href="#main"
          className="sr-only rounded-capsule bg-sky-deep px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
        >
          Skip to main content
        </a>
        <AppStateProvider>
          <Nav />
          <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-28 sm:px-6">
            {children}
          </main>
        </AppStateProvider>
        <footer className="border-t border-sky-soft bg-white px-4 py-8 text-center text-sm text-sky-deep">
          <p>
            AirWise uses live data from Open-Meteo (CAMS ENSEMBLE) and GeoNames. Health categories follow US EPA
            AirNow. Emissions factors are from UK Government conversion factors.
          </p>
        </footer>
      </body>
    </html>
  );
}
