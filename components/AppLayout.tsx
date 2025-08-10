'use client';
import React, { useState } from 'react';
import { AppProvider } from './AppProvider';
import Header from './Header';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Pages qui ne doivent pas afficher le header et sidebar
  const noLayoutPages = ['/login'];
  const shouldShowLayout = !noLayoutPages.includes(pathname);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Header onMenuClick={handleDrawerToggle} />
      <AppProvider mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle}>
        {children}
      </AppProvider>
    </>
  );
}