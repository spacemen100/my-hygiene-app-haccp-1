// app/layout.tsx
import { Inter } from "next/font/google";
import { ClientLayout } from '@/components/ClientLayout';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'HACCP Management System',
  description: 'Application de gestion HACCP pour restaurants et établissements alimentaires',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}