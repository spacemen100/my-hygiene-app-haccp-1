'use client';
import React, { useState } from 'react';
import { AppProvider } from './AppProvider';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useOrganizationCheck } from '../hooks/useOrganizationCheck';
import { Box, CircularProgress, Alert, AlertTitle, Button } from '@mui/material';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isLoading } = useAuth();
  const { showAlert, alertMessage, redirectToQuestionnaire } = useOrganizationCheck();

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
      {showAlert && (
        <Alert 
          severity="warning" 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1300,
            borderRadius: 0
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={redirectToQuestionnaire}
              variant="outlined"
            >
              Remplir maintenant
            </Button>
          }
        >
          <AlertTitle>Configuration requise</AlertTitle>
          {alertMessage}
        </Alert>
      )}
      <Header onMenuClick={handleDrawerToggle} />
      <AppProvider mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle}>
        <Box sx={{ mt: showAlert ? 8 : 0 }}>
          {children}
        </Box>
      </AppProvider>
    </>
  );
}