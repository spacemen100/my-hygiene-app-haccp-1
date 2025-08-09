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
  ListItemText,
  Chip,
  Paper,
  Button,
  Divider,
} from '@mui/material';
import {
  Assignment as ClipboardCheck,
  Inventory2,
  CheckCircle,
  Warning,
  Add,
  Circle,
} from '@mui/icons-material';

export default function ControleReceptionPage() {
  const recentControls = [
    { id: "LOT001", supplier: "Fournisseur A", date: "2024-08-09", status: "approved", temperature: "2°C" },
    { id: "LOT002", supplier: "Fournisseur B", date: "2024-08-08", status: "rejected", temperature: "8°C" },
    { id: "LOT003", supplier: "Fournisseur C", date: "2024-08-08", status: "pending", temperature: "4°C" }
  ];

  const stats = [
    { label: "Aujourd'hui", value: "12", icon: Inventory2, color: "#2196f3" },
    { label: "Approuvés", value: "10", icon: CheckCircle, color: "#4caf50" },
    { label: "En attente", value: "2", icon: Warning, color: "#ff9800" }
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 56,
              height: 56,
            }}
          >
            <ClipboardCheck sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              Contrôle à réception
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Vérification qualité des marchandises
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} md={4} key={index}>
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

      {/* New Control Button */}
      <Card
        sx={{
          mb: 4,
          border: '2px dashed',
          borderColor: 'primary.light',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 2,
            }}
          >
            <Add sx={{ fontSize: 36 }} />
          </Avatar>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Nouveau contrôle à réception
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Cliquez pour démarrer un nouveau contrôle qualité
          </Typography>
        </CardContent>
      </Card>

      {/* Recent Controls */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Contrôles récents
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Historique des derniers contrôles effectués
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {recentControls.map((control, index) => (
              <ListItem
                key={control.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 2,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
                  <Circle
                    sx={{
                      fontSize: 12,
                      color: 
                        control.status === 'approved' ? 'success.main' :
                        control.status === 'rejected' ? 'error.main' : 'warning.main'
                    }}
                  />
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Lot {control.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {control.supplier}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {control.temperature}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Température
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {control.date}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Date
                          </Typography>
                        </Box>
                        <Chip
                          label={
                            control.status === 'approved' ? 'Approuvé' :
                            control.status === 'rejected' ? 'Rejeté' : 'En attente'
                          }
                          color={
                            control.status === 'approved' ? 'success' :
                            control.status === 'rejected' ? 'error' : 'warning'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>
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