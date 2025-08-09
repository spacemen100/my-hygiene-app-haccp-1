'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Paper,
} from '@mui/material';
import { Label as TagsIcon } from '@mui/icons-material';

export default function EtiquettesPage() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
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
            <TagsIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              Enregistrement des étiquettes
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Interface pour enregistrer et gérer les étiquettes des produits
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Card>
        <CardContent sx={{ p: 6, textAlign: 'center' }}>
          <Avatar
            sx={{
              bgcolor: 'secondary.light',
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 3,
            }}
          >
            <TagsIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Gestion des étiquettes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Interface à implémenter pour la gestion des étiquettes produits
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}