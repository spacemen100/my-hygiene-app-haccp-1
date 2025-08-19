'use client';
import React, { useState } from 'react';
import { AppProvider } from './AppProvider';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Box, CircularProgress } from '@mui/material';
import { useOrganizationCheck } from '@/hooks/useOrganizationCheck';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isLoading } = useAuth();
  const { hasOrganization, loading: orgLoading } = useOrganizationCheck();

  // Pages qui ne doivent pas afficher le header et sidebar
  const noLayoutPages = ['/login', '/register', '/admin-questionnaire-prise-en-main'];
  const shouldShowLayout = !noLayoutPages.includes(pathname);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Afficher un loader pendant la vérification de l'authentification et de l'organisation
  if ((isLoading || orgLoading) && shouldShowLayout) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontWeight: 'bold' }}>Vérification de votre configuration...</Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}>
            {isLoading ? 'Authentification en cours...' : 'Vérification de votre organisation...'}
          </Box>
        </Box>
      </Box>
    );
  }

  // Si pas d'organisation, ne pas afficher le layout (la redirection se fait dans le hook)
  if (shouldShowLayout && hasOrganization === false) {
    return null;
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