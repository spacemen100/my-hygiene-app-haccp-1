// app/layout.tsx
'use client';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import { Inter } from "next/font/google";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { theme } from '@/theme/theme';
import { AuthProvider } from '@/components/AuthProvider';
import { EmployeeProvider } from '@/contexts/EmployeeContext';
import { AppLayout } from '@/components/AppLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/auth-helpers-nextjs';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    console.log('[Layout] Setting up auth listener');
    
    const fetchSession = async () => {
      console.log('[Layout] Fetching initial session');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Layout] Initial session:', !!session, session?.user?.id);
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Layout] Auth state changed:', _event, !!session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (loading) {
    return (
      <html lang="fr">
        <body className={inter.className}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
          </Box>
        </body>
      </html>
    );
  }

  return (
    <html lang="fr">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <AuthProvider session={session}>
              <EmployeeProvider>
                <AppLayout>
                  {children}
                </AppLayout>
              </EmployeeProvider>
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}