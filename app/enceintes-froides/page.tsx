'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CardHeader,
} from '@mui/material';
import {
  AcUnit as SnowflakeIcon,
  Thermostat as ThermometerIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';

export default function EnceintesFroidesPage() {
  const chambers = [
    { id: "CF-A", name: "Chambre froide A", temp: "2.1°C", target: "2°C", status: "normal", connected: true },
    { id: "CF-B", name: "Chambre froide B", temp: "1.8°C", target: "2°C", status: "normal", connected: true },
    { id: "CF-C", name: "Chambre froide C", temp: "4.2°C", target: "4°C", status: "warning", connected: true },
    { id: "CONG-1", name: "Congélateur 1", temp: "-18.5°C", target: "-18°C", status: "normal", connected: false }
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(to right, #0891b2, #0e7490)',
        borderRadius: '16px',
        p: 4,
        color: 'white',
        boxShadow: 3,
        mb: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '12px' }}>
            <SnowflakeIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Enceintes froides
            </Typography>
            <Typography variant="body1" sx={{ color: '#bae6fd' }}>
              Surveillance des températures en temps réel
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 4,
        '& > *': {
          flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
          minWidth: 0
        }
      }}>
        <Card sx={{ boxShadow: 2, border: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Enceintes
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  4
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#e0f2fe' }}>
                <SnowflakeIcon sx={{ color: '#0284c7', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ boxShadow: 2, border: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Normales
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#16a34a' }}>
                  3
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#dcfce7' }}>
                <ThermometerIcon sx={{ color: '#16a34a', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ boxShadow: 2, border: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Alertes
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#ea580c' }}>
                  1
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#ffedd5' }}>
                <WarningIcon sx={{ color: '#ea580c', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ boxShadow: 2, border: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Moyenne
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#0d9488' }}>
                  2.3°C
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#ccfbf1' }}>
                <TrendingDownIcon sx={{ color: '#0d9488', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Chambers Grid */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 4,
        '& > *': {
          flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' },
          minWidth: 0
        }
      }}>
        {chambers.map((chamber) => (
          <Card key={chamber.id} sx={{
            boxShadow: 3,
            transition: 'all 0.2s',
            ...(chamber.status === 'warning' ? { 
              border: '1px solid #fed7aa',
              backgroundColor: 'rgba(254, 215, 170, 0.1)'
            } : chamber.status === 'alert' ? {
              border: '1px solid #fecaca',
              backgroundColor: 'rgba(254, 202, 202, 0.1)'
            } : { '&:hover': { boxShadow: 6 } })
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {chamber.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {chamber.id}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {chamber.connected ? (
                      <WifiIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                    ) : (
                      <WifiOffIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                    )}
                    <Box sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: chamber.status === 'normal' ? '#16a34a' :
                                      chamber.status === 'warning' ? '#ea580c' : '#dc2626'
                    }} />
                  </Box>
                </Box>
              }
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                      {chamber.temp}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Température actuelle
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" component="div">
                      {chamber.target}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Consigne
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: 8 }}>
                  <Box sx={{
                    height: '100%',
                    borderRadius: '9999px',
                    backgroundColor: chamber.status === 'normal' ? '#16a34a' :
                                    chamber.status === 'warning' ? '#ea580c' : '#dc2626',
                    width: '85%'
                  }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Dernière mesure : Il y a 2 minutes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Temperature History */}
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div">
              Historique des températures
            </Typography>
          }
          subheader="Évolution des températures sur les dernières 24h"
        />
        <CardContent>
          <Box sx={{
            height: 256,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #e5e7eb',
            borderRadius: '12px'
          }}>
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <TrendingDownIcon sx={{ fontSize: 48, opacity: 0.5, mx: 'auto', mb: 2 }} />
              <Typography>Graphique des températures</Typography>
              <Typography variant="caption">Interface à implémenter</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}