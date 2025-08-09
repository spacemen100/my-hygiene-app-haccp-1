'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Paper,
} from '@mui/material';
import { Print as PrinterIcon } from '@mui/icons-material';

export default function ImpressionDLCPage() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
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
            <PrinterIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              Impression des DLC secondaires
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Interface pour imprimer les dates limites de consommation secondaires
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Card>
        <CardContent sx={{ p: 6, textAlign: 'center' }}>
          <Avatar
            sx={{
              bgcolor: 'warning.light',
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 3,
            }}
          >
            <PrinterIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Impression DLC
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Interface à implémenter pour l'impression des DLC secondaires
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}