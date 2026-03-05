import { Inter } from 'next/font/google';
import StyledComponentsRegistry from '@/theme/StyledComponentsRegistry';
import { GlobalStyle } from '@/theme/GlobalStyle';
import { AppLayout } from '@/components/layout/AppLayout';
import { SWRProvider } from '@/components/providers/SWRProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'OC Facturer - Sewan',
  description: 'Gestion de la facturation OC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <GlobalStyle />
          <SWRProvider>
            <AppLayout>{children}</AppLayout>
          </SWRProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
