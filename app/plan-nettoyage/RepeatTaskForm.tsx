"use client";

import { useState, useEffect } from 'react';
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
  Alert,
  Avatar,
  Chip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Repeat,
  Schedule,
  LocationOn,
  CleaningServices
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/components/AuthProvider';
import { useEmployee } from '@/contexts/EmployeeContext';

interface RepeatTaskFormProps {
  tasks: Tables<'cleaning_tasks'>[];
  onSuccess: () => void;
}

export default function RepeatTaskForm({ tasks, onSuccess }: RepeatTaskFormProps) {
  const { user } = useAuth();
  const { employee } = useEmployee();
  const [formData, setFormData] = useState({
    cleaning_task_id: null as string | null,
    start_date: new Date().toISOString().split('T')[0],
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    custom_frequency_days: 1,
    occurrence_limit: 30,
    comments: '',
  });
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tables<'cleaning_tasks'> | null>(null);
  const [zones, setZones] = useState<Tables<'cleaning_zones'>[]>([]);
  const [subZones, setSubZones] = useState<Tables<'cleaning_sub_zones'>[]>([]);
  const [products, setProducts] = useState<Tables<'cleaning_products'>[]>([]);
  const [equipment, setEquipment] = useState<Tables<'cleaning_equipment'>[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchRelatedData();
  }, []);

  const fetchRelatedData = async () => {
    try {
      const [zonesData, productsData, equipmentData] = await Promise.all([
        supabase.from('cleaning_zones').select('*'),
        supabase.from('cleaning_products').select('*').eq('is_active', true),
        supabase.from('cleaning_equipment').select('*').eq('is_active', true)
      ]);
      
      if (zonesData.data) setZones(zonesData.data);
      if (productsData.data) setProducts(productsData.data);
      if (equipmentData.data) setEquipment(equipmentData.data);
    } catch (error) {
      console.error('Error fetching related data:', error);
    }
  };

  const handleTaskChange = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setSelectedTask(task || null);
    setFormData(prev => ({ ...prev, cleaning_task_id: taskId }));
    
    // Fetch sub-zones if zone is selected
    if (task?.cleaning_zone_id) {
      const { data } = await supabase
        .from('cleaning_sub_zones')
        .select('*')
        .eq('cleaning_zone_id', task.cleaning_zone_id);
      if (data) setSubZones(data);
    }
  };

  const getTaskDetails = (task: Tables<'cleaning_tasks'>) => {
    const zone = zones.find(z => z.id === task.cleaning_zone_id);
    const subZone = subZones.find(sz => sz.id === task.cleaning_sub_zone_id);
    const product = products.find(p => p.id === task.cleaning_product_id);
    const equip = equipment.find(e => e.id === task.cleaning_equipment_id);
    
    return { zone, subZone, product, equip };
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
        const scheduledDate = new Date(startDate);
        
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
          case 'custom':
            scheduledDate.setDate(startDate.getDate() + (i * formData.custom_frequency_days));
            break;
        }
        
        records.push({
          cleaning_task_id: formData.cleaning_task_id,
          user_id: user?.id || null,
          employee_id: employee?.id || null,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          is_completed: false,
          is_compliant: null,
          comments: formData.comments || null,
          completion_date: null,
          photo_url: null
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
        start_date: new Date().toISOString().split('T')[0],
        frequency: 'daily',
        custom_frequency_days: 1,
        occurrence_limit: 30,
        comments: '',
      });
      setSelectedTask(null);
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
            onChange={(e) => handleTaskChange(e.target.value)}
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

        {/* Task Details Card */}
        {selectedTask && (
          <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CleaningServices color="primary" />
                Détails de la tâche sélectionnée
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>Zone:</strong> {getTaskDetails(selectedTask).zone?.name || 'Non spécifiée'}
                      </Typography>
                    </Box>
                    {getTaskDetails(selectedTask).subZone && (
                      <Typography variant="body2" sx={{ ml: 3, color: 'text.secondary' }}>
                        Sous-zone: {getTaskDetails(selectedTask).subZone?.name}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>Fréquence recommandée:</strong> {selectedTask.frequency}
                        {selectedTask.frequency_days && ` (${selectedTask.frequency_days} jours)`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Action à réaliser:</strong> {selectedTask.action_to_perform}
                  </Typography>
                </Box>

                {(getTaskDetails(selectedTask).product || getTaskDetails(selectedTask).equip) && (
                  <Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {getTaskDetails(selectedTask).product && (
                        <Chip 
                          label={`Produit: ${getTaskDetails(selectedTask).product?.name}`}
                          variant="outlined"
                          size="small"
                          color="secondary"
                        />
                      )}
                      {getTaskDetails(selectedTask).equip && (
                        <Chip 
                          label={`Équipement: ${getTaskDetails(selectedTask).equip?.name}`}
                          variant="outlined"
                          size="small"
                          color="info"
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
          <TextField
            label="Date de début"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          
          <FormControl fullWidth required>
            <InputLabel>Fréquence</InputLabel>
            <Select
              value={formData.frequency}
              label="Fréquence"
              onChange={(e) => setFormData({...formData, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom'})}
            >
              <MenuItem value="daily">Quotidienne</MenuItem>
              <MenuItem value="weekly">Hebdomadaire</MenuItem>
              <MenuItem value="monthly">Mensuelle</MenuItem>
              <MenuItem value="custom">Personnalisée</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {formData.frequency === 'custom' && (
          <TextField
            label="Fréquence en jours"
            type="number"
            value={formData.custom_frequency_days}
            onChange={(e) => {
              const value = Math.max(1, parseInt(e.target.value) || 1);
              setFormData({...formData, custom_frequency_days: value});
            }}
            required
            fullWidth
            slotProps={{ htmlInput: { min: 1 } }}
            helperText="Nombre de jours entre chaque occurrence"
          />
        )}
        
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
          slotProps={{ htmlInput: { min: 1, max: 100 } }}
          helperText={`Cela créera ${formData.occurrence_limit} tâche(s) programmée(s)`}
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