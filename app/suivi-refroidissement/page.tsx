'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Paper,
} from '@mui/material';
import { Thermostat as ThermometerIcon } from '@mui/icons-material';

export default function SuiviRefroidissementPage() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
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
            <ThermometerIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              Suivi de refroidissement
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Interface pour suivre les courbes de refroidissement des produits
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Card>
        <CardContent sx={{ p: 6, textAlign: 'center' }}>
          <Avatar
            sx={{
              bgcolor: 'info.light',
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 3,
            }}
          >
            <ThermometerIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Courbe de refroidissement
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Interface à implémenter pour le suivi des courbes de refroidissement
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}