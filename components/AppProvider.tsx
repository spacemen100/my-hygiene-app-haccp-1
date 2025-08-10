'use client';
import React from 'react';
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AssignmentTurnedIn as ClipboardCheck,
  Label as TagsIcon,
  Print as PrinterIcon,
  AcUnit as SnowflakeIcon,
  Thermostat as ThermometerIcon,
  CleaningServices as SprayCanIcon,
  Home as HomeIcon,
  AdminPanelSettings as AdminIcon,
  Business as SuppliersIcon,
  Kitchen as StorageIcon,
  LocalOffer as LabelsIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const drawerWidth = 280;

const menuItems = [
  { href: "/", icon: HomeIcon, label: "Accueil" },
  { href: "/controle-reception", icon: ClipboardCheck, label: "Contrôle à réception" },
  { href: "/etiquettes", icon: TagsIcon, label: "Enregistrement des étiquettes" },
  { href: "/impression-dlc", icon: PrinterIcon, label: "Impression des DLC secondaires" },
  { href: "/enceintes-froides", icon: SnowflakeIcon, label: "Enceintes froides" },
  { href: "/suivi-refroidissement", icon: ThermometerIcon, label: "Suivi de refroidissement" },
  { href: "/plan-nettoyage", icon: SprayCanIcon, label: "Plan de nettoyage" },
  { href: "/admin-plan-nettoyage", icon: AdminIcon, label: "Administrateur Plan de nettoyage" },
  { href: "/admin-fournisseurs", icon: SuppliersIcon, label: "Administrateur des fournisseurs" },
  { href: "/admin-unites-stockage", icon: StorageIcon, label: "Administrateur des Unités de Stockage" },
  { href: "/admin-etiquettes", icon: LabelsIcon, label: "Administrateur Enregistrement des Étiquettes" },
];

interface AppProviderProps {
  children: React.ReactNode;
  mobileOpen?: boolean;
  onDrawerToggle?: () => void;
}

export function AppProvider({ children, mobileOpen = false, onDrawerToggle }: AppProviderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();

  const drawer = (
    <Box>
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ClipboardCheck />
        </Box>
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            HACCP Manager
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Gestion Qualité & Admin
          </Typography>
        </Box>
      </Box>

      <List sx={{ mt: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                onClick={() => isMobile && onDrawerToggle && onDrawerToggle()}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.12)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          p: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          bgcolor: 'grey.50',
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          <strong>Version 1.0</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Système HACCP
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', pt: 0 }}>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              top: 0, // Touche le haut de l'écran
              height: '100%', // Prend toute la hauteur
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', md: '64px' }, // Espace pour le header fixe sur toutes les tailles
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}