'use client';
import React, { useState } from 'react';
import { AppProvider } from './AppProvider';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Box, CircularProgress } from '@mui/material';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isLoading } = useAuth();

  // Pages qui ne doivent pas afficher le header et sidebar
  const noLayoutPages = ['/login', '/register'];
  const shouldShowLayout = !noLayoutPages.includes(pathname);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading && shouldShowLayout) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontWeight: 'bold' }}>Authentification en cours...</Box>
        </Box>
      </Box>
    );
  }

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