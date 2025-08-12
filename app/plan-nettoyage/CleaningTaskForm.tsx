import { useState } from 'react';
import { Tables, TablesInsert } from '@/src/types/database';
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
  Checkbox,
  Alert,
  IconButton,
  Avatar,
  Chip
} from '@mui/material';
import {
  Assignment,
  Schedule,
  CheckCircle,
  Warning,
  Save,
  PhotoCamera
} from '@mui/icons-material';

interface CleaningTaskFormProps {
  tasks: Tables<'cleaning_tasks'>[];
  onSuccess: () => void;
  enqueueSnackbar: any;
}

export default function CleaningTaskForm({ tasks, onSuccess, enqueueSnackbar }: CleaningTaskFormProps) {
  const [formData, setFormData] = useState<TablesInsert<'cleaning_records'>>({
    scheduled_date: new Date().toISOString(),
    cleaning_task_id: null,
    is_completed: false,
    is_compliant: false,
    comments: null,
    completion_date: null,
    photo_url: null,
    user_id: null,
  });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('cleaning_records')
        .insert([formData]);
      
      if (error) throw error;
      
      enqueueSnackbar('Enregistrement de nettoyage réussi!', { variant: 'success' });
      onSuccess();
      
      // Reset form
      setFormData({
        scheduled_date: new Date().toISOString(),
        cleaning_task_id: null,
        is_completed: false,
        is_compliant: false,
        comments: null,
        completion_date: null,
        photo_url: null,
        user_id: null,
      });
    } catch (error) {
      console.error('Error saving cleaning record:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
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
      
      <Box component="form" onSubmit={handleSubmit} sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: { xs: 2.5, sm: 3 }
      }}>
        {/* ... (le reste du formulaire reste inchangé) ... */}
      </Box>
    </Box>
  );
}