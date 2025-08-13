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
  People as PeopleIcon,
  Business as BusinessIcon,
  Room as ZoneIcon,
  Science as ProductsIcon,
  Build as EquipmentIcon,
  ListAlt as MethodsIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEmployee } from '@/contexts/EmployeeContext';

// Responsive drawer widths
const mobileDrawerWidth = 280;
const tabletDrawerWidth = 260;
const desktopDrawerWidth = 280;

const menuItems = [
  { href: "/", icon: HomeIcon, label: "Accueil" },
  { href: "/controle-reception", icon: ClipboardCheck, label: "Contrôle à réception" },
  { href: "/etiquettes", icon: TagsIcon, label: "Enregistrement des étiquettes" },
  { href: "/impression-dlc", icon: PrinterIcon, label: "Impression des DLC secondaires" },
  { href: "/enceintes-froides", icon: SnowflakeIcon, label: "Enceintes froides" },
  { href: "/suivi-refroidissement", icon: ThermometerIcon, label: "Suivi de refroidissement" },
  { href: "/plan-nettoyage", icon: SprayCanIcon, label: "Plan de nettoyage" },
  { href: "/admin-organisation", icon: BusinessIcon, label: "Administrateur Organisation" },
  { href: "/admin-employes", icon: PeopleIcon, label: "Administrateur des employés" },
  { href: "/admin-plan-nettoyage", icon: AdminIcon, label: "Administrateur Plan de nettoyage" },
  { href: "/admin-zones-nettoyage", icon: ZoneIcon, label: "Administrateur Zones et Sous-zones de Nettoyage" },
  { href: "/admin-produits-nettoyage", icon: ProductsIcon, label: "Administrateur des Produits de Nettoyage" },
  { href: "/admin-equipements", icon: EquipmentIcon, label: "Administrateur des Équipements" },
  { href: "/admin-methodes-nettoyage", icon: MethodsIcon, label: "Administrateur des Méthodes de Nettoyage" },
  { href: "/admin-fournisseurs", icon: SuppliersIcon, label: "Administrateur des fournisseurs" },
  { href: "/admin-unites-stockage", icon: StorageIcon, label: "Administrateur des Unités de Stockage" },
  { href: "/admin-etiquettes", icon: LabelsIcon, label: "Administrateur Enregistrement des Étiquettes" },
  { href: "/admin-imprimantes", icon: PrinterIcon, label: "Administrateur des Imprimantes" },
];

interface AppProviderProps {
  children: React.ReactNode;
  mobileOpen?: boolean;
  onDrawerToggle?: () => void;
}

export function AppProvider({ children, mobileOpen = false, onDrawerToggle }: AppProviderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const pathname = usePathname();
  const { employee: currentEmployee } = useEmployee();
  
  // Function to check if user has admin access
  const hasAdminAccess = () => {
    return currentEmployee?.role === 'Administrateur';
  };

  // Filter menu items based on role
  const getFilteredMenuItems = () => {
    if (!currentEmployee) {
      // If no employee is selected, show all items (for initial setup)
      return menuItems;
    }
    
    if (hasAdminAccess()) {
      // Admin users see all menu items
      return menuItems;
    }
    
    // Non-admin users don't see admin menu items
    return menuItems.filter(item => !item.label.startsWith('Administrateur'));
  };
  
  // Dynamic drawer width based on screen size
  const getDrawerWidth = () => {
    if (isMobile) return mobileDrawerWidth;
    if (isTablet) return tabletDrawerWidth;
    return desktopDrawerWidth;
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header desktop - responsive */}
      <Box
        sx={{
          p: { md: 2, lg: 3 },
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: { md: 1.5, lg: 2 },
          flexShrink: 0,
          minHeight: '4rem',
        }}
      >
        <Box
          sx={{
            width: { md: 36, lg: 40 },
            height: { md: 36, lg: 40 },
            bgcolor: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ClipboardCheck sx={{ fontSize: { md: '1.25rem', lg: '1.5rem' } }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              fontSize: { md: '1.1rem', lg: '1.25rem' },
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            HACCP Manager
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: 0.8,
              fontSize: { md: '0.8rem', lg: '0.875rem' },
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            Gestion Qualité & Admin
          </Typography>
        </Box>
      </Box>

      {/* Header mobile - visible uniquement sur mobile */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          p: 2,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          alignItems: 'center',
          gap: 2,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ClipboardCheck sx={{ fontSize: 20 }} />
        </Box>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          HACCP Manager
        </Typography>
      </Box>

      {/* Zone scrollable pour le menu */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        marginTop: { xs: 0, md: 0 }, // Pas de marge supplémentaire
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#a8a8a8',
        },
      }}>
        <List sx={{ mt: { xs: 0, md: 1 }, pb: 2, pt: { xs: 1, md: 0 } }}>
          {getFilteredMenuItems().map((item) => {
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
                        fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
                        fontWeight: isActive ? 600 : 400,
                        lineHeight: { xs: 1.3, md: 1.5 },
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer fixe */}
      <Box
        sx={{
          p: { xs: 1.5, md: 2 },
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          bgcolor: 'grey.50',
          flexShrink: 0,
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
          <strong>Version 1.0</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
          Système HACCP
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', pt: 0 }}>
      <Box
        component="nav"
        sx={{ width: { md: getDrawerWidth() }, flexShrink: { md: 0 } }}
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
              width: `min(${mobileDrawerWidth}px, 85vw)`,
              maxWidth: '100vw',
              height: '100vh',
              overflow: 'hidden',
              zIndex: 1400,
              paddingTop: '64px',
            },
            '& .MuiBackdrop-root': {
              zIndex: 1350,
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
              width: { md: tabletDrawerWidth, lg: desktopDrawerWidth },
              top: 0,
              height: '100vh',
              overflow: 'hidden',
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
          p: { 
            xs: '0.75rem',
            sm: '1rem', 
            md: '1.5rem',
            lg: '2rem'
          },
          width: { 
            xs: '100%',
            md: `calc(100% - ${tabletDrawerWidth}px)`,
            lg: `calc(100% - ${desktopDrawerWidth}px)`
          },
          mt: { xs: '56px', sm: '64px' },
          bgcolor: 'background.default',
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          maxWidth: '100vw',
          overflow: 'auto',
          position: 'relative',
          // Better content container
          '& > *': {
            maxWidth: '100%',
          }
        }}
      >
        <Box
          sx={{
            maxWidth: { xs: '100%', xl: '1400px' },
            mx: 'auto',
            width: '100%'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}