"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/src/types/database';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Avatar,
  Chip
} from '@mui/material';
import { Repeat } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

interface RepeatTaskFormProps {
  tasks: Tables<'cleaning_tasks'>[];
  onSuccess: () => void;
}

export default function RepeatTaskForm({ tasks, onSuccess }: RepeatTaskFormProps) {
  const [formData, setFormData] = useState({
    cleaning_task_id: null as string | null,
    start_date: new Date().toISOString(),
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    occurrence_limit: 30,
    is_compliant: false,
    comments: '',
  });
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const formatDateTimeForInput = (isoString: string) => {
    return isoString.substring(0, 16);
  };

  const getTaskFrequencyColor = (frequency: string) => {
    switch (frequency?.toLowerCase()) {
      case 'quotidien': return 'success';
      case 'hebdomadaire': return 'info';
      case 'mensuel': return 'warning';
      default: return 'default';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cleaning_task_id) {
      enqueueSnackbar('Veuillez sélectionner une tâche', { variant: 'error' });
      return;
    }

    setLoading(true);
    
    try {
      const records = [];
      const startDate = new Date(formData.start_date);
      
      for (let i = 0; i < formData.occurrence_limit; i++) {
        let scheduledDate = new Date(startDate);
        
        switch (formData.frequency) {
          case 'daily':
            scheduledDate.setDate(startDate.getDate() + i);
            break;
          case 'weekly':
            scheduledDate.setDate(startDate.getDate() + (i * 7));
            break;
          case 'monthly':
            scheduledDate.setMonth(startDate.getMonth() + i);
            break;
        }
        
        records.push({
          cleaning_task_id: formData.cleaning_task_id,
          scheduled_date: scheduledDate.toISOString(),
          is_completed: false,
          is_compliant: formData.is_compliant,
          comments: formData.comments || null,
          completion_date: null,
          photo_url: null,
          user_id: null,
        });
      }

      const { error } = await supabase
        .from('cleaning_records')
        .insert(records);
      
      if (error) throw error;
      
      enqueueSnackbar(`${formData.occurrence_limit} tâches répétitives créées avec succès!`, { variant: 'success' });
      onSuccess();
      
      // Reset form
      setFormData({
        cleaning_task_id: null,
        start_date: new Date().toISOString(),
        frequency: 'daily',
        occurrence_limit: 30,
        is_compliant: false,
        comments: '',
      });
    } catch (error) {
      console.error('Error creating repeat tasks:', error);
      enqueueSnackbar('Erreur lors de la création des tâches répétitives', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 1.5, sm: 2 }, 
        mb: { xs: 3, md: 4 }
      }}>
        <Avatar sx={{ bgcolor: '#ff980020', color: '#ff9800' }}>
          <Repeat />
        </Avatar>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            Tâches Répétitives
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Programmer des tâches récurrentes avec limite
          </Typography>
        </Box>
      </Box>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: { xs: 2.5, sm: 3 }
      }}>
        <FormControl fullWidth required>
          <InputLabel>Tâche de nettoyage</InputLabel>
          <Select
            value={formData.cleaning_task_id || ''}
            label="Tâche de nettoyage"
            onChange={(e) => setFormData({...formData, cleaning_task_id: e.target.value})}
          >
            {tasks.map(task => (
              <MenuItem key={task.id} value={task.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {task.name}
                  </Typography>
                  <Chip 
                    label={task.frequency}
                    size="small"
                    color={getTaskFrequencyColor(task.frequency)}
                    variant="outlined"
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
          <TextField
            label="Date de début"
            type="datetime-local"
            value={formatDateTimeForInput(formData.start_date)}
            onChange={(e) => setFormData({...formData, start_date: new Date(e.target.value).toISOString()})}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          
          <FormControl fullWidth required>
            <InputLabel>Fréquence</InputLabel>
            <Select
              value={formData.frequency}
              label="Fréquence"
              onChange={(e) => setFormData({...formData, frequency: e.target.value as 'daily' | 'weekly' | 'monthly'})}
            >
              <MenuItem value="daily">Quotidienne</MenuItem>
              <MenuItem value="weekly">Hebdomadaire</MenuItem>
              <MenuItem value="monthly">Mensuelle</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <TextField
          label="Nombre d'occurrences (max 100)"
          type="number"
          value={formData.occurrence_limit}
          onChange={(e) => {
            const value = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
            setFormData({...formData, occurrence_limit: value});
          }}
          required
          fullWidth
          inputProps={{ min: 1, max: 100 }}
          helperText={`Cela créera ${formData.occurrence_limit} tâche(s) programmée(s)`}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={formData.is_compliant}
              onChange={(e) => setFormData({...formData, is_compliant: e.target.checked})}
            />
          }
          label="Marquer comme conforme par défaut"
        />
        
        <TextField
          label="Commentaires (optionnel)"
          multiline
          rows={3}
          value={formData.comments}
          onChange={(e) => setFormData({...formData, comments: e.target.value})}
          fullWidth
          placeholder="Instructions spécifiques pour ces tâches répétitives..."
        />
        
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Limite de sécurité :</strong> Maximum 100 occurrences pour éviter la saturation de la base de données.
          </Typography>
        </Alert>
        
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<Repeat />}
          disabled={loading}
          fullWidth
          color="warning"
          sx={{ 
            mt: { xs: 1.5, sm: 2 },
            py: { xs: 1.5, sm: 2 },
            minHeight: '48px',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          {loading ? 'Création en cours...' : `Créer ${formData.occurrence_limit} tâche(s)`}
        </Button>
      </Box>
    </Box>
  );
}