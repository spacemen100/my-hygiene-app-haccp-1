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

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 2, // Plus élevé pour être au-dessus de la sidebar
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
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          HACCP Manager
        </Typography>
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
