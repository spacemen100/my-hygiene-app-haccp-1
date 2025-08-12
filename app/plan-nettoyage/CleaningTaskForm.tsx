import { useState } from 'react';
import { Tables, TablesInsert } from '@/src/types/database';
import {
  Box,
  Typography,
  Avatar
} from '@mui/material';
import {
  Assignment
} from '@mui/icons-material';

interface CleaningTaskFormProps {
  onSuccess: () => void;
  enqueueSnackbar: (message: string, options?: { variant: 'success' | 'error' | 'warning' | 'info' }) => void;
}

export default function CleaningTaskForm({ onSuccess, enqueueSnackbar }: CleaningTaskFormProps) {


  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 1.5, sm: 2 }, 
        mb: { xs: 3, md: 4 }
      }}>
        <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
          <Assignment />
        </Avatar>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            Nouvelle Exécution
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Enregistrer une tâche de nettoyage HACCP
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="body2" color="text.secondary">
        Composant de formulaire à implémenter
      </Typography>
    </Box>
  );
}