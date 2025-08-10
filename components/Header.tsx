// components/Header.tsx
'use client';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useAuth } from './AuthProvider'; // Assurez-vous que le chemin est correct

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { session, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerWidth = 280;

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        top: 0,
        left: { xs: 0, md: `${drawerWidth}px` }, // Laisse l'espace pour le sidebar sur desktop
        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }, // Ajuste la largeur
        zIndex: (theme) => theme.zIndex.drawer + 1,
        m: 0,
        p: 0,
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        {isMobile && onMenuClick && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {session ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
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
