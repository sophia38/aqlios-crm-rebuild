import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { Providers } from './providers';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Aqlios',
  description: 'Aqlios CRM for UK primary care',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${poppins.variable} ${inter.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
