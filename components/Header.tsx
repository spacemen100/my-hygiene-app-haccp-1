// components/Header.tsx
'use client';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from './AuthProvider'; // Assurez-vous que le chemin est correct

const Header = () => {
  const { session, signOut } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Mon Application
        </Typography>
        {session ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {session.user.email}
            </Typography>
            <Button color="inherit" onClick={signOut}>
              Déconnexion
            </Button>
          </Box>
        ) : (
          <Button color="inherit" href="/login">
            Connexion
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
