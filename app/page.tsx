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

export default function Home() {
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
      maxWidth: { xs: '100vw', lg: '1400px' },
      mx: 'auto',
      px: { xs: 0, sm: 1, md: 2 }
    }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          p: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 0, sm: 2, md: 3 },
          mx: { xs: -1, sm: 0 },
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
            lineHeight: 1.2
          }}
        >
          Tableau de Bord HACCP
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            opacity: 0.9,
            fontSize: { xs: '1rem', sm: '1.25rem' },
            mb: { xs: 1, md: 0 }
          }}
        >
          Bienvenue dans votre système de gestion qualité
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            mt: { xs: 1, md: 2 }, 
            opacity: 0.8,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            display: { xs: 'none', sm: 'block' }
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
      </Paper>

      {/* Quick Stats */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: { xs: 2, sm: 3 },
        mb: { xs: 3, md: 4 }
      }}>
        {quickStats.map((stat, index) => (
          <Card key={index} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography 
                    color="text.secondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: `${stat.color}20`,
                    color: stat.color,
                    width: { xs: 40, sm: 48, md: 56 },
                    height: { xs: 40, sm: 48, md: 56 },
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
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

      {/* Quick Actions */}
      <Typography 
        variant="h5" 
        component="h2" 
        gutterBottom 
        sx={{ 
          fontWeight: 600,
          mb: { xs: 2, md: 3 },
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          px: { xs: 1, sm: 0 }
        }}
      >
        Actions rapides
      </Typography>
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, 1fr)'
        },
        gap: { xs: 2, sm: 3 },
        mb: { xs: 3, md: 4 }
      }}>
        {quickActions.map((action, index) => (
          <Card
            key={index}
            component={Link}
            href={action.href}
            sx={{
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: `${action.color}20`,
                    color: action.color,
                    width: { xs: 48, md: 56 },
                    height: { xs: 48, md: 56 },
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: '1.5rem', md: '2rem' }
                    }
                  }}
                >
                  <action.icon />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      lineHeight: 1.3
                    }}
                  >
                    {action.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      lineHeight: 1.4
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

      {/* Recent Activity */}
      <Card sx={{ mx: { xs: -1, sm: 0 }, borderRadius: { xs: 0, sm: 1 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            component="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.125rem', md: '1.25rem' }
            }}
          >
            Activité récente
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: { xs: 2, md: 3 },
              fontSize: { xs: '0.8rem', md: '0.875rem' }
            }}
          >
            Dernières actions effectuées dans le système
          </Typography>
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