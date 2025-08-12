"use client";

import { useState, useEffect } from 'react';
import { Tables, TablesInsert } from '@/src/types/database';
import { supabase } from '@/lib/supabase';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Save,
  LocationOn,
  CleaningServices,
  CalendarToday
} from '@mui/icons-material';
import { useAuth } from '@/components/AuthProvider';
import { useEmployee } from '@/contexts/EmployeeContext';

interface CleaningTaskFormProps {
  tasks: Tables<'cleaning_tasks'>[];
  onSuccess: () => void;
  enqueueSnackbar: (message: string, options?: { variant: 'success' | 'error' | 'warning' | 'info' }) => void;
}

export default function CleaningTaskForm({ tasks, onSuccess, enqueueSnackbar }: CleaningTaskFormProps) {
  const { user } = useAuth();
  const { employee } = useEmployee();
  const [formData, setFormData] = useState<TablesInsert<'cleaning_records'>>({
    cleaning_task_id: null,
    user_id: user?.id || null,
    employee_id: employee?.id || null,
    scheduled_date: new Date().toISOString().split('T')[0],
    is_completed: false,
    is_compliant: null,
    comments: null,
    photo_url: null
  });
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tables<'cleaning_tasks'> | null>(null);
  const [zones, setZones] = useState<Tables<'cleaning_zones'>[]>([]);
  const [subZones, setSubZones] = useState<Tables<'cleaning_sub_zones'>[]>([]);
  const [products, setProducts] = useState<Tables<'cleaning_products'>[]>([]);
  const [equipment, setEquipment] = useState<Tables<'cleaning_equipment'>[]>([]);

  useEffect(() => {
    fetchRelatedData();
  }, []);

  // Update user_id and employee_id when they change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      user_id: user?.id || null,
      employee_id: employee?.id || null
    }));
  }, [user?.id, employee?.id]);

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
      const { error } = await supabase
        .from('cleaning_records')
        .insert([formData]);
      
      if (error) throw error;
      
      enqueueSnackbar('Enregistrement de nettoyage créé avec succès!', { variant: 'success' });
      onSuccess();
      
      // Reset form
      setFormData({
        cleaning_task_id: null,
        user_id: user?.id || null,
        employee_id: employee?.id || null,
        scheduled_date: new Date().toISOString().split('T')[0],
        is_completed: false,
        is_compliant: null,
        comments: null,
        photo_url: null
      });
      setSelectedTask(null);
    } catch (error) {
      console.error('Error creating cleaning record:', error);
      enqueueSnackbar('Erreur lors de la création de l&apos;enregistrement', { variant: 'error' });
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
            Programmer une tâche de nettoyage HACCP
          </Typography>
        </Box>
      </Box>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Task Selection */}
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
                Détails de la tâche
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
                        <strong>Fréquence:</strong> {selectedTask.frequency}
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

        {/* Schedule Date */}
        <TextField
          label="Date programmée"
          type="date"
          value={formData.scheduled_date}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
          required
          fullWidth
          slotProps={{ 
            inputLabel: { shrink: true },
            htmlInput: { min: new Date().toISOString().split('T')[0] }
          }}
        />

        {/* Execution Options */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday color="primary" fontSize="small" />
            Exécution (Optionnel)
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_completed || false}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  is_completed: e.target.checked,
                  completion_date: e.target.checked ? new Date().toISOString() : null,
                  is_compliant: e.target.checked ? true : null
                }))}
              />
            }
            label="Marquer comme réalisée maintenant"
          />
          
          {formData.is_completed && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_compliant !== false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_compliant: e.target.checked }))}
                  />
                }
                label="Conforme aux standards HACCP"
              />
              
              <TextField
                label="URL de la photo (optionnel)"
                value={formData.photo_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                fullWidth
                placeholder="https://..."
              />
            </>
          )}
          
          <TextField
            label="Commentaires (optionnel)"
            multiline
            rows={3}
            value={formData.comments || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
            fullWidth
            placeholder="Observations, difficultés rencontrées, notes..."
          />
        </Box>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<Save />}
          disabled={loading || !formData.cleaning_task_id}
          fullWidth
          sx={{ mt: 2, py: 1.5 }}
        >
          {loading ? 'Création en cours...' : 'Créer l&apos;enregistrement'}
        </Button>

        {!selectedTask && tasks.length === 0 && (
          <Alert severity="info">
            Aucune tâche de nettoyage disponible. Veuillez d&apos;abord créer des tâches dans la section administration.
          </Alert>
        )}
      </Box>
    </Box>
  );
}