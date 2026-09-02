import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'LibriFlow — Library System',
  description: 'Circulation and book inventory management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={`${plusJakartaSans.className} antialiased bg-zinc-50/60 text-zinc-900 selection:bg-zinc-900 selection:text-white`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

