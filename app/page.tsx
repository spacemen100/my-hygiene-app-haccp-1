'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  TrendingUp,
  Assignment as ClipboardCheck,
  LocalOffer as TagsIcon,
  AcUnit as SnowflakeIcon,
  CleaningServices as SprayCanIcon,
  Circle,
  DirectionsRun as Activity,
} from '@mui/icons-material';
import Link from 'next/link';
import { useOrganizationCheck } from '@/hooks/useOrganizationCheck';

export default function Home() {
  const { hasOrganization, loading } = useOrganizationCheck();

  // Afficher un spinner pendant la vérification
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Vérification de votre configuration...
        </Typography>
      </Box>
    );
  }

  // Si pas d'organisation, ne pas afficher la page (la redirection se fait dans le hook)
  if (hasOrganization === false) {
    return null;
  }

  const quickStats = [
    { icon: CheckCircle, label: 'Contrôles OK', value: '24', color: '#4caf50' },
    { icon: Warning, label: 'Alertes', value: '3', color: '#ff9800' },
    { icon: Activity, label: 'En cours', value: '7', color: '#2196f3' },
    { icon: TrendingUp, label: 'Performance', value: '98%', color: '#4caf50' }
  ];

  const quickActions = [
    { 
      href: '/controle-reception', 
      icon: ClipboardCheck, 
      title: 'Contrôle à réception', 
      description: 'Enregistrer un nouveau contrôle qualité',
      color: '#1976d2'
    },
    { 
      href: '/etiquettes', 
      icon: TagsIcon, 
      title: 'Étiquettes', 
      description: 'Gérer les étiquettes produits',
      color: '#9c27b0'
    },
    { 
      href: '/enceintes-froides', 
      icon: SnowflakeIcon, 
      title: 'Enceintes froides', 
      description: 'Surveiller les températures',
      color: '#00bcd4'
    },
    { 
      href: '/plan-nettoyage', 
      icon: SprayCanIcon, 
      title: 'Plan de nettoyage', 
      description: 'Planifier les opérations',
      color: '#4caf50'
    }
  ];

  const recentActivities = [
    { time: 'Il y a 2 min', action: 'Contrôle qualité validé', item: 'Lot #2024-001', status: 'success' },
    { time: 'Il y a 15 min', action: 'Température enregistrée', item: 'Chambre froide A', status: 'info' },
    { time: 'Il y a 1h', action: 'Plan de nettoyage mis à jour', item: 'Zone de production', status: 'warning' },
    { time: 'Il y a 2h', action: 'Étiquette imprimée', item: 'Produit #P-456', status: 'success' }
  ];

  return (
    <Box sx={{ 
      flexGrow: 1,
      width: '100%',
      maxWidth: '100%',
      mx: 'auto',
      p: 0
    }}>
      {/* Hero Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          p: { 
            xs: '1.5rem 1rem',
            sm: '2rem 1.5rem', 
            md: '2.5rem 2rem',
            lg: '3rem 2.5rem'
          },
          mb: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          borderRadius: { xs: 0, sm: 2, md: 3 },
          mx: { xs: '-0.75rem', sm: 0 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,255,255,0.05)',
            transform: 'skewY(-2deg)',
            transformOrigin: 'top left',
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h1" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 800,
              fontSize: { 
                xs: '1.75rem',
                sm: '2.25rem', 
                md: '2.75rem',
                lg: '3.25rem'
              },
              lineHeight: { xs: 1.2, md: 1.1 },
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Tableau de Bord HACCP
          </Typography>
          <Typography 
            variant="h2" 
            component="p"
            sx={{ 
              opacity: 0.95,
              fontSize: { 
                xs: '1rem',
                sm: '1.125rem',
                md: '1.25rem',
                lg: '1.375rem'
              },
              mb: { xs: 1, md: 1.5 },
              fontWeight: 500,
              lineHeight: 1.4
            }}
          >
            Bienvenue dans votre système de gestion qualité
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mt: { xs: 1, md: 2 }, 
              opacity: 0.85,
              fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
              display: { xs: 'none', sm: 'block' },
              lineHeight: 1.5
            }}
          >
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        </Box>
      </Paper>

      {/* Stats Grid - Responsive */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
        mb: { xs: '2rem', sm: '2.5rem', md: '3rem' }
      }}>
        {quickStats.map((stat, index) => (
          <Card 
            key={index} 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
          >
            <CardContent sx={{ 
              p: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
              '&:last-child': { pb: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                height: '100%'
              }}>
                <Box sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                  <Typography 
                    color="text.secondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                      lineHeight: 1.4,
                      mb: { xs: 0.5, md: 1 }
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                      fontWeight: 800,
                      fontSize: { 
                        xs: '1.25rem', 
                        sm: '1.5rem', 
                        md: '2rem',
                        lg: '2.25rem'
                      },
                      lineHeight: 1,
                      color: stat.color
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: `${stat.color}15`,
                    color: stat.color,
                    width: { xs: 36, sm: 42, md: 48, lg: 56 },
                    height: { xs: 36, sm: 42, md: 48, lg: 56 },
                    flexShrink: 0,
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem', lg: '1.75rem' }
                    }
                  }}
                >
                  <stat.icon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Quick Actions Section */}
      <Typography 
        variant="h2" 
        component="h2" 
        gutterBottom 
        sx={{ 
          fontWeight: 700,
          mb: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          fontSize: { xs: '1.375rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
          color: 'text.primary'
        }}
      >
        Actions rapides
      </Typography>
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, 1fr)',
          xl: 'repeat(2, 1fr)'
        },
        gap: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
        mb: { xs: '2.5rem', sm: '3rem', md: '4rem' }
      }}>
        {quickActions.map((action, index) => (
          <Card
            key={index}
            component={Link}
            href={action.href}
            sx={{
              textDecoration: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              },
              '&:active': {
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ 
              p: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              '&:last-child': { pb: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 2, sm: 2.5, md: 3 },
                width: '100%'
              }}>
                <Avatar
                  sx={{
                    bgcolor: `${action.color}18`,
                    color: action.color,
                    width: { xs: 52, sm: 58, md: 64, lg: 72 },
                    height: { xs: 52, sm: 58, md: 64, lg: 72 },
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${action.color}25`,
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem', lg: '2.25rem' }
                    }
                  }}
                >
                  <action.icon />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
                      lineHeight: 1.3,
                      mb: { xs: 0.5, md: 0.75 },
                      color: 'text.primary'
                    }}
                  >
                    {action.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
                      lineHeight: 1.5,
                      opacity: 0.8
                    }}
                  >
                    {action.description}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Recent Activity Section */}
      <Card sx={{ 
        mx: { xs: '-0.75rem', sm: 0 }, 
        borderRadius: { xs: 0, sm: 2, md: 3 },
        boxShadow: { xs: 'none', sm: 1, md: 2 }
      }}>
        <CardContent sx={{ p: { xs: '1.5rem 1rem', sm: '2rem 1.5rem', md: '2.5rem 2rem' } }}>
          <Box sx={{ mb: { xs: 2, md: 3 } }}>
            <Typography 
              variant="h2" 
              component="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem', lg: '1.75rem' },
                mb: 1,
                color: 'text.primary'
              }}
            >
              Activité récente
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
                lineHeight: 1.5,
                opacity: 0.8
              }}
            >
              Dernières actions effectuées dans le système
            </Typography>
          </Box>
          <List>
            {recentActivities.map((activity, index) => (
              <ListItem key={index} sx={{ px: 0, py: { xs: 1, md: 1.5 } }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Circle
                    sx={{
                      fontSize: 12,
                      color: 
                        activity.status === 'success' ? 'success.main' :
                        activity.status === 'warning' ? 'warning.main' : 'info.main'
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 0 }
                    }}>
                      <Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            lineHeight: 1.3
                          }}
                        >
                          {activity.action}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                        >
                          {activity.item}
                        </Typography>
                      </Box>
                      <Chip 
                        label={activity.time} 
                        size="small" 
                        variant="outlined" 
                        sx={{ 
                          fontSize: { xs: '0.65rem', md: '0.75rem' },
                          height: { xs: '24px', md: '28px' }
                        }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}