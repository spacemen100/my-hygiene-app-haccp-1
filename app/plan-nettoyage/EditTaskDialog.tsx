"use client";

import { useState, useEffect } from 'react';
import { Tables } from '@/src/types/database';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Avatar,
  Typography
} from '@mui/material';
import { Edit as EditIcon, Close as CloseIcon, Save } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import PhotoUpload from './PhotoUpload';

interface EditTaskDialogProps {
  open: boolean;
  onClose: () => void;
  record: Tables<'cleaning_records'> | null;
  tasks: Tables<'cleaning_tasks'>[];
  onSave: (data: Partial<Tables<'cleaning_records'>>) => Promise<void>;
}

export default function EditTaskDialog({ open, onClose, record, tasks, onSave }: EditTaskDialogProps) {
  const [formData, setFormData] = useState<Partial<Tables<'cleaning_records'>>>({});
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (record) {
      setFormData({
        is_completed: record.is_completed,
        is_compliant: record.is_compliant,
        completion_date: record.completion_date,
        comments: record.comments,
        photo_url: record.photo_url,
      });
    }
  }, [record]);

  const formatDateTimeForInput = (isoString: string | null) => {
    return isoString ? isoString.substring(0, 16) : '';
  };

  const handleSubmit = async () => {
    if (!record) return;
    
    setLoading(true);
    try {
      await onSave(formData);
      enqueueSnackbar('Tâche mise à jour avec succès!', { variant: 'success' });
      onClose();
    } catch (error) {
      console.error('Error updating record:', error);
      enqueueSnackbar('Erreur lors de la mise à jour', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const taskName = record ? tasks.find(t => t.id === record.cleaning_task_id)?.name || 'Tâche inconnue' : '';

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <EditIcon />
        </Avatar>
        <Box>
          <Typography variant="h6">
            Modifier la tâche
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {taskName}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_completed || false}
                onChange={(e) => setFormData({...formData, is_completed: e.target.checked})}
              />
            }
            label="Tâche réalisée"
          />
          
          {formData.is_completed && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_compliant || false}
                    onChange={(e) => setFormData({...formData, is_compliant: e.target.checked})}
                  />
                }
                label="Conforme aux standards HACCP"
              />
              
              <TextField
                label="Date de completion"
                type="datetime-local"
                value={formatDateTimeForInput(formData.completion_date || null)}
                onChange={(e) => setFormData({
                  ...formData, 
                  completion_date: e.target.value ? new Date(e.target.value).toISOString() : null
                })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              
              <PhotoUpload
                label="Photo de la tâche réalisée (optionnel)"
                value={formData.photo_url}
                onChange={(url) => setFormData({...formData, photo_url: url})}
                disabled={loading}
              />
            </>
          )}
          
          <TextField
            label="Commentaires"
            multiline
            rows={4}
            value={formData.comments || ''}
            onChange={(e) => setFormData({...formData, comments: e.target.value})}
            fullWidth
            placeholder="Observations, produits utilisés, difficultés rencontrées..."
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose} 
          startIcon={<CloseIcon />}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          startIcon={<Save />}
          disabled={loading}
        >
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}