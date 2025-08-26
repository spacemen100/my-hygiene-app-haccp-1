"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Grid,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  Close as CloseIcon,
  CheckCircle as OpenIcon,
} from '@mui/icons-material';
import React from 'react';

type OpeningHour = Tables<'opening_hours'> & {
  opening_hours_slots?: Array<{
    id: string;
    open_time: string;
    close_time: string;
    slot_order: number;
  }>;
};
type OpeningHourInsert = TablesInsert<'opening_hours'>;
type OpeningHourUpdate = TablesUpdate<'opening_hours'>;

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

export default function OpeningHoursManager() {
  const { user } = useAuth();
  const { employee: currentEmployee, loading: employeeLoading } = useEmployee();
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [defaultOrganization, setDefaultOrganization] = useState<string | null>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHour, setEditingHour] = useState<OpeningHour | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hourToDelete, setHourToDelete] = useState<OpeningHour | null>(null);
  
  // Time slots for complex opening hours
  interface TimeSlot {
    id: string;
    open_time: string;
    close_time: string;
  }

  // Form state
  const [formData, setFormData] = useState<OpeningHourInsert>({
    organization_id: '',
    day_of_week: 1,
    open_time: null,
    close_time: null,
    is_closed: false,
    employee_id: null,
    user_id: null,
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', open_time: '', close_time: '' }
  ]);

  const loadDefaultOrganization = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .order('created_at')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setDefaultOrganization(data?.id || null);
    } catch (err) {
      console.error('Error loading default organization:', err);
    }
  }, []);

  const loadOpeningHours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const organizationId = currentEmployee?.organization_id || defaultOrganization;
      if (!organizationId) {
        setOpeningHours([]);
        return;
      }

      const { data, error } = await supabase
        .from('opening_hours')
        .select(`
          *,
          organizations (
            id,
            name
          ),
          employees (
            id,
            first_name,
            last_name
          ),
          opening_hours_slots (
            id,
            open_time,
            close_time,
            slot_order
          )
        `)
        .eq('organization_id', organizationId)
        .order('day_of_week');
      
      if (error) throw error;
      setOpeningHours(data || []);
    } catch (err) {
      console.error('Error loading opening hours:', err);
      setError('Erreur lors du chargement des horaires');
    } finally {
      setLoading(false);
    }
  }, [currentEmployee?.organization_id, defaultOrganization]);

  useEffect(() => {
    loadDefaultOrganization();
  }, [loadDefaultOrganization]);

  useEffect(() => {
    if (!employeeLoading && defaultOrganization !== null) {
      loadOpeningHours();
      
      if (!dialogOpen) {
        const organizationId = currentEmployee?.organization_id || defaultOrganization;
        if (organizationId) {
          setFormData(prev => ({ ...prev, organization_id: organizationId }));
        }
      }
    }
  }, [currentEmployee?.organization_id, defaultOrganization, loadOpeningHours, employeeLoading, dialogOpen]);

  const handleOpenDialog = (hour: OpeningHour | null = null, preselectedDay?: number) => {
    setError(null);
    setSuccess(null);
    
    if (hour) {
      setEditingHour(hour);
      setFormData({
        organization_id: hour.organization_id,
        day_of_week: hour.day_of_week,
        open_time: hour.open_time,
        close_time: hour.close_time,
        is_closed: hour.is_closed ?? false,
        employee_id: hour.employee_id,
        user_id: hour.user_id,
      });

      // Load existing time slots from the slots table
      if (hour.opening_hours_slots && hour.opening_hours_slots.length > 0) {
        const sortedSlots = hour.opening_hours_slots.sort((a, b) => a.slot_order - b.slot_order);
        setTimeSlots(sortedSlots.map((slot, index) => ({
          id: slot.id,
          open_time: slot.open_time || '',
          close_time: slot.close_time || ''
        })));
      } else if (hour.open_time && hour.close_time && !hour.is_closed) {
        // Fallback for existing records without slots table
        setTimeSlots([{
          id: '1',
          open_time: hour.open_time,
          close_time: hour.close_time
        }]);
      } else {
        setTimeSlots([{ id: '1', open_time: '', close_time: '' }]);
      }
    } else {
      setEditingHour(null);
      // Pour un nouvel horaire, utiliser le jour présélectionné ou le premier jour disponible
      const availableDays = getAvailableDays();
      const defaultDay = preselectedDay !== undefined ? preselectedDay : 
                        (availableDays.length > 0 ? availableDays[0].value : 1);
      
      setFormData({
        organization_id: currentEmployee?.organization_id || defaultOrganization || '',
        day_of_week: defaultDay,
        open_time: null,
        close_time: null,
        is_closed: false,
        employee_id: currentEmployee?.id || null,
        user_id: user?.id || null,
      });
      
      setTimeSlots([{ id: '1', open_time: '', close_time: '' }]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHour(null);
    setError(null);
    
    setFormData({
      organization_id: currentEmployee?.organization_id || defaultOrganization || '',
      day_of_week: 1,
      open_time: null,
      close_time: null,
      is_closed: false,
      employee_id: currentEmployee?.id || null,
      user_id: user?.id || null,
    });
    
    setTimeSlots([{ id: '1', open_time: '', close_time: '' }]);
  };

  const addTimeSlot = () => {
    const newId = (timeSlots.length + 1).toString();
    setTimeSlots([...timeSlots, { id: newId, open_time: '', close_time: '' }]);
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter(slot => slot.id !== id));
    }
  };

  const updateTimeSlot = (id: string, field: 'open_time' | 'close_time', value: string) => {
    setTimeSlots(timeSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSave = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!formData.organization_id) {
        setError('L\'organisation est obligatoire');
        setSaving(false);
        return;
      }

      if (!formData.is_closed) {
        // Validate time slots
        const validSlots = timeSlots.filter(slot => slot.open_time && slot.close_time);
        
        if (validSlots.length === 0) {
          setError('Au moins un créneau horaire est obligatoire si l\'établissement n\'est pas fermé');
          setSaving(false);
          return;
        }

        // Validate each time slot
        for (const slot of validSlots) {
          if (slot.open_time >= slot.close_time) {
            setError('L\'heure d\'ouverture doit être antérieure à l\'heure de fermeture pour chaque créneau');
            setSaving(false);
            return;
          }
        }

        // Check for overlapping time slots
        const sortedSlots = validSlots.sort((a, b) => a.open_time.localeCompare(b.open_time));
        for (let i = 0; i < sortedSlots.length - 1; i++) {
          if (sortedSlots[i].close_time > sortedSlots[i + 1].open_time) {
            setError('Les créneaux horaires ne peuvent pas se chevaucher');
            setSaving(false);
            return;
          }
        }
      }

      const validSlots = formData.is_closed ? [] : timeSlots.filter(slot => slot.open_time && slot.close_time);

      // Prepare opening hours data
      const hourData = {
        ...formData,
        open_time: validSlots.length > 0 ? validSlots[0].open_time : null,
        close_time: validSlots.length > 0 ? validSlots[0].close_time : null,
      };

      if (editingHour) {
        // Update existing opening hour
        const { error: updateError } = await supabase
          .from('opening_hours')
          .update(hourData as OpeningHourUpdate)
          .eq('id', editingHour.id);

        if (updateError) throw updateError;

        // Delete existing slots
        const { error: deleteError } = await supabase
          .from('opening_hours_slots')
          .delete()
          .eq('opening_hours_id', editingHour.id);

        if (deleteError) throw deleteError;

        // Insert new slots if not closed
        if (!formData.is_closed && validSlots.length > 0) {
          const slotsToInsert = validSlots.map((slot, index) => ({
            opening_hours_id: editingHour.id,
            open_time: slot.open_time,
            close_time: slot.close_time,
            slot_order: index + 1
          }));

          const { error: slotsError } = await supabase
            .from('opening_hours_slots')
            .insert(slotsToInsert);

          if (slotsError) throw slotsError;
        }

        setSuccess('Horaire mis à jour avec succès');
      } else {
        // Create new opening hour
        const { data: newHour, error: insertError } = await supabase
          .from('opening_hours')
          .insert([hourData])
          .select()
          .single();

        if (insertError) throw insertError;

        // Insert slots if not closed
        if (!formData.is_closed && validSlots.length > 0) {
          const slotsToInsert = validSlots.map((slot, index) => ({
            opening_hours_id: newHour.id,
            open_time: slot.open_time,
            close_time: slot.close_time,
            slot_order: index + 1
          }));

          const { error: slotsError } = await supabase
            .from('opening_hours_slots')
            .insert(slotsToInsert);

          if (slotsError) throw slotsError;
        }

        setSuccess('Horaire créé avec succès');
      }

      await loadOpeningHours();
      handleCloseDialog();
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      
      if (errorMessage.includes('opening_hours_unique_day')) {
        setError('Un horaire existe déjà pour ce jour de la semaine dans cette organisation');
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!hourToDelete) return;

    try {
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('opening_hours')
        .delete()
        .eq('id', hourToDelete.id);

      if (error) throw error;

      setSuccess('Horaire supprimé avec succès');
      await loadOpeningHours();
      setDeleteDialogOpen(false);
      setHourToDelete(null);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  const formatTimeSlots = (hour: OpeningHour) => {
    if (!hour || hour.is_closed) return '-';
    
    if (hour.opening_hours_slots && hour.opening_hours_slots.length > 0) {
      const sortedSlots = hour.opening_hours_slots.sort((a, b) => a.slot_order - b.slot_order);
      return sortedSlots.map(slot => `${formatTime(slot.open_time)}-${formatTime(slot.close_time)}`).join(', ');
    }
    
    // Fallback pour les anciens enregistrements
    if (hour.open_time && hour.close_time) {
      return `${formatTime(hour.open_time)}-${formatTime(hour.close_time)}`;
    }
    
    return '-';
  };

  const calculateTotalDuration = (hour: OpeningHour) => {
    if (!hour || hour.is_closed) return '-';
    
    if (hour.opening_hours_slots && hour.opening_hours_slots.length > 0) {
      let totalMinutes = 0;
      hour.opening_hours_slots.forEach(slot => {
        const openDate = new Date(`1970-01-01T${slot.open_time}`);
        const closeDate = new Date(`1970-01-01T${slot.close_time}`);
        totalMinutes += (closeDate.getTime() - openDate.getTime()) / (1000 * 60);
      });
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${hours}h`;
    }
    
    // Fallback pour les anciens enregistrements
    if (hour.open_time && hour.close_time) {
      const openDate = new Date(`1970-01-01T${hour.open_time}`);
      const closeDate = new Date(`1970-01-01T${hour.close_time}`);
      const duration = (closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60);
      return `${duration}h`;
    }
    
    return '-';
  };

  const hasMultipleSlots = (hour: OpeningHour) => {
    return hour && hour.opening_hours_slots && hour.opening_hours_slots.length > 1;
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || 'Inconnu';
  };

  const getAvailableDays = () => {
    if (editingHour) {
      // En mode édition, tous les jours sont disponibles sauf si on change le jour
      return DAYS_OF_WEEK;
    }
    
    // En mode création, filtrer les jours déjà configurés
    const configuredDays = openingHours.map(h => h.day_of_week);
    return DAYS_OF_WEEK.filter(day => !configuredDays.includes(day.value));
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  if (loading || employeeLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ScheduleIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Horaires d'Établissement
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Gestion des horaires d'ouverture - Définir les créneaux d'ouverture
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <ScheduleIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Jours Configurés
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {openingHours.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <OpenIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Jours Ouverts
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {openingHours.filter(h => !h.is_closed).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <CloseIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Jours Fermés
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {openingHours.filter(h => h.is_closed).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <TimeIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Non Configurés
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {7 - openingHours.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Add Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={getAvailableDays().length === 0}
          sx={{ 
            px: 3, 
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          Nouvel Horaire
        </Button>
      </Box>

      {/* Opening Hours Table */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Jour</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Horaires</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Durée Totale</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {DAYS_OF_WEEK.map((day) => {
                  const dayHour = openingHours.find(h => h.day_of_week === day.value);
                  
                  return (
                    <TableRow key={day.value} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {day.label.substring(0, 2).toUpperCase()}
                            </Typography>
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {day.label}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {dayHour ? (
                          <Chip
                            label={dayHour.is_closed ? 'Fermé' : 'Ouvert'}
                            size="small"
                            color={dayHour.is_closed ? 'error' : 'success'}
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="Non configuré"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {formatTimeSlots(dayHour)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {hasMultipleSlots(dayHour) ? 'Créneaux multiples' : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {calculateTotalDuration(dayHour)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {dayHour ? (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(dayHour)}
                                sx={{ color: 'primary.main' }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setHourToDelete(dayHour);
                                  setDeleteDialogOpen(true);
                                }}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => handleOpenDialog(null, day.value)}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              Configurer
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {editingHour ? 'Modifier l\'Horaire' : 'Nouvel Horaire'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Jour de la semaine</InputLabel>
                  <Select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: Number(e.target.value) })}
                    label="Jour de la semaine"
                    disabled={!!editingHour}
                  >
                    {getAvailableDays().map((day) => (
                      <MenuItem key={day.value} value={day.value}>
                        {day.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_closed || false}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        is_closed: e.target.checked,
                        open_time: e.target.checked ? null : formData.open_time,
                        close_time: e.target.checked ? null : formData.close_time,
                      })}
                    />
                  }
                  label="Établissement fermé ce jour"
                />
              </Grid>

              {!formData.is_closed && (
                <>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Créneaux horaires
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={addTimeSlot}
                        sx={{ textTransform: 'none' }}
                      >
                        Ajouter un créneau
                      </Button>
                    </Box>
                  </Grid>

                  {timeSlots.map((slot, index) => (
                    <React.Fragment key={slot.id}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 80 }}>
                            Créneau {index + 1}:
                          </Typography>
                          {timeSlots.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeTimeSlot(slot.id)}
                              sx={{ ml: 'auto' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label={`Ouverture ${index + 1}`}
                          type="time"
                          value={slot.open_time}
                          onChange={(e) => updateTimeSlot(slot.id, 'open_time', e.target.value)}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          required
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label={`Fermeture ${index + 1}`}
                          type="time"
                          value={slot.close_time}
                          onChange={(e) => updateTimeSlot(slot.id, 'close_time', e.target.value)}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          required
                        />
                      </Grid>
                    </React.Fragment>
                  ))}
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Sauvegarde...' : (editingHour ? 'Mettre à jour' : 'Créer')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l&apos;horaire du &quot;{hourToDelete ? getDayLabel(hourToDelete.day_of_week) : ''}&quot; ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}