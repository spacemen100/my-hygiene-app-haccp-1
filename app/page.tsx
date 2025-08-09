'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  Activity,
  ClipboardCheck,
  Label as TagsIcon,
  AcUnit as SnowflakeIcon,
  Cleaning as SprayCanIcon,
  Circle,
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
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Tableau de Bord HACCP
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Bienvenue dans votre système de gestion qualité
        </Typography>
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}20`,
                      color: stat.color,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <stat.icon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Actions rapides
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card
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
                      width: 56,
                      height: 56,
                    }}
                  >
                    <action.icon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Activité récente
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Dernières actions effectuées dans le système
          </Typography>
          <List>
            {recentActivities.map((activity, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {activity.action}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.item}
                        </Typography>
                      </Box>
                      <Chip 
                        label={activity.time} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontSize: '0.75rem' }}
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