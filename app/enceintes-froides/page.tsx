"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Avatar,
  Skeleton,
  Paper,
  Alert
} from '@mui/material';
import {
  AcUnit,
  Thermostat,
  CheckCircle,
  Cancel,
  Save,
  DeviceThermostat,
  Sensors,
  History
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import EnceinteSection from '@/components/EnceinteSection';

export default function ColdStorage() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  // États
  const [units, setUnits] = useState<Tables<'cold_storage_units'>[]>([]);
  const [readings, setReadings] = useState<Tables<'cold_storage_temperature_readings'>[]>([]);
  const [loading, setLoading] = useState({ units: true, readings: true });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [formData, setFormData] = useState<TablesInsert<'cold_storage_temperature_readings'>>({
    reading_date: new Date().toISOString(),
    temperature: 0,
    is_compliant: true,
    cold_storage_unit_id: null,
    comments: null,
    user_id: null,
  });

  // Fetch des données avec mémoïsation
  const fetchUnits = useCallback(async () => {
    setLoading(prev => ({ ...prev, units: true }));
    const { data, error } = await supabase.from('cold_storage_units').select('*');
    if (!error && data) {
      setUnits(data);
    }
    setLoading(prev => ({ ...prev, units: false }));
  }, []);

  const fetchReadings = useCallback(async (page = 1, reset = false) => {
    setLoading(prev => ({ ...prev, readings: true }));
    
    const query = supabase
      .from('cold_storage_temperature_readings')
      .select('*', { count: 'exact' })
      .order('reading_date', { ascending: false })
      .range((page - 1) * 50, page * 50 - 1);

    const { data, error, count } = await query;

    if (!error) {
      setReadings(prev => reset ? (data || []) : [...prev, ...(data || [])]);
      setHasMore((count || 0) > page * 50);
    } else {
      enqueueSnackbar('Erreur de chargement', { variant: 'error' });
    }
    
    setLoading(prev => ({ ...prev, readings: false }));
  }, [enqueueSnackbar]);

  // Chargement initial et pagination infinie
  useEffect(() => {
    fetchUnits();
    fetchReadings(1, true);
  }, [fetchUnits, fetchReadings]);

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || 
        loading.readings || !hasMore) return;
    setPage(prev => prev + 1);
  }, [loading.readings, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (page > 1) fetchReadings(page);
  }, [page, fetchReadings]);

  // Validation de la température
  const validateTemperature = useCallback((temp: number, unitId: string | null | undefined) => {
    if (!unitId) return true;
    const unit = units.find(u => u.id === unitId);
    if (!unit) return true;
    return temp >= unit.min_temperature && temp <= unit.max_temperature;
  }, [units]);

  const handleTemperatureChange = useCallback((value: string) => {
    const temp = Number(value);
    const isCompliant = validateTemperature(temp, formData.cold_storage_unit_id);
    setFormData(prev => ({
      ...prev, 
      temperature: temp,
      is_compliant: isCompliant
    }));
  }, [formData.cold_storage_unit_id, validateTemperature]);

  // Soumission du formulaire
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('cold_storage_temperature_readings')
        .insert([{
          ...formData,
          employee_id: employee?.id || null,
          user_id: user?.id || null,
        }]);
      
      if (error) throw error;
      
      enqueueSnackbar('Lecture enregistrée avec succès!', { variant: 'success' });
      fetchReadings(1, true); // Reset à la première page
      setFormData({
        reading_date: new Date().toISOString(),
        temperature: 0,
        is_compliant: true,
        cold_storage_unit_id: null,
        comments: null,
        user_id: null,
      });
    } catch {
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    }
  }, [formData, employee, user, enqueueSnackbar, fetchReadings]);

  const selectedUnit = useMemo(() => 
    units.find(u => u.id === formData.cold_storage_unit_id), 
    [units, formData.cold_storage_unit_id]
  );

  // Statistiques calculées
  const stats = useMemo(() => {
    const recentReadings = readings.slice(0, 100);
    return {
      totalUnits: units.length,
      recentReadings: recentReadings.length,
      compliantReadings: recentReadings.filter(r => r.is_compliant).length,
      averageTemp: recentReadings.length > 0 ? 
        (recentReadings.reduce((sum, r) => sum + r.temperature, 0) / recentReadings.length) : 
        0
    };
  }, [readings, units]);

  return (
    <Box sx={{ 
      flexGrow: 1,
      width: '100%',
      maxWidth: { xs: '100vw', lg: '1400px' },
      mx: 'auto'
    }}>
      {/* Header avec gradient moderne */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
          color: 'white',
          p: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 0, sm: 2, md: 3 },
          mx: { xs: -1, sm: 0 },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 }
        }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              width: { xs: 56, md: 80 },
              height: { xs: 56, md: 80 },
            }}
          >
            <AcUnit fontSize="large" />
          </Avatar>
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                lineHeight: 1.2
              }}
            >
              Enceintes Froides
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                opacity: 0.9, 
                mb: 1,
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Surveillance et contrôle des températures de stockage
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.8,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Dernière lecture : {readings.length > 0 ? 
                new Date(readings[0].reading_date).toLocaleDateString('fr-FR', { 
                  weekday: 'short', 
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Aucune'
              }
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        
        {/* Missing Elements Alert */}
        {units.length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Penser à créer les Unités de stockage</strong> - Aucune unité de stockage froid n'est configurée dans le système. 
              Rendez-vous dans "Administration des Unités de stockage" pour créer vos enceintes froides avant d'enregistrer des températures.
            </Typography>
          </Alert>
        )}

        {/* Statistiques rapides */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
          gap: { xs: 2, sm: 3 }, 
          mb: { xs: 3, md: 4 }
        }}>
          {loading.units ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            ))
          ) : (
            <>
              <StatCard 
                title="Unités actives" 
                value={stats.totalUnits} 
                icon={<DeviceThermostat />} 
                color="#00bcd4"
              />
              <StatCard 
                title="Lectures récentes" 
                value={stats.recentReadings} 
                icon={<History />} 
                color="#4caf50"
              />
              <StatCard 
                title="Conformité" 
                value={stats.recentReadings > 0 ? 
                  Math.round((stats.compliantReadings / stats.recentReadings) * 100) + '%' : 
                  'N/A'
                } 
                icon={stats.compliantReadings === stats.recentReadings ? <CheckCircle /> : <Cancel />} 
                color={stats.compliantReadings === stats.recentReadings ? '#4caf50' : '#ff9800'}
              />
              <StatCard 
                title="Température moy." 
                value={stats.averageTemp.toFixed(1) + '°C'} 
                icon={<Sensors />} 
                color="#2196f3"
              />
            </>
          )}
        </Box>

        {/* Formulaire de nouvelle lecture */}
        <Card sx={{ 
          mb: 4,
          transition: 'all 0.3s', 
          '&:hover': { boxShadow: 6 },
          mx: { xs: -1, sm: 0 },
          borderRadius: { xs: 0, sm: 1 }
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: '#00bcd420', color: '#00bcd4' }}>
                <Thermostat />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Nouvelle Lecture de Température
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enregistrer une mesure de contrôle HACCP
                </Typography>
              </Box>
            </Box>
            
            <Box 
              component="form" 
              onSubmit={handleSubmit} 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 3 
              }}
            >
              <FormControl fullWidth required>
                <InputLabel>Unité de stockage</InputLabel>
                <Select
                  value={formData.cold_storage_unit_id || ''}
                  label="Unité de stockage"
                  onChange={(e) => setFormData({...formData, cold_storage_unit_id: e.target.value})}
                >
                  {units.map(unit => (
                    <MenuItem key={unit.id} value={unit.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <AcUnit sx={{ color: 'primary.main' }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {unit.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {unit.location} - {unit.type} ({unit.min_temperature}°C à {unit.max_temperature}°C)
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Température mesurée (°C)"
                type="number"
                inputProps={{ step: "0.1" }}
                value={formData.temperature}
                onChange={(e) => handleTemperatureChange(e.target.value)}
                required
                fullWidth
                error={selectedUnit && !validateTemperature(formData.temperature, formData.cold_storage_unit_id)}
                helperText={
                  selectedUnit && validateTemperature(formData.temperature, formData.cold_storage_unit_id) ? 
                  "✅ Conforme" :
                  selectedUnit ? "⚠️ Hors limites" : 
                  "Saisir la température"
                }
              />
              
              <TextField
                label="Commentaires"
                value={formData.comments || ''}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
                fullWidth
                placeholder="Observations..."
              />
              
              <Box sx={{ gridColumn: { md: '1 / -1' }, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_compliant}
                      onChange={(e) => setFormData({...formData, is_compliant: e.target.checked})}
                    />
                  }
                  label="Validation manuelle"
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  sx={{ 
                    ml: 'auto',
                    background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0097a7 0%, #00838f 100%)',
                    }
                  }}
                >
                  Enregistrer
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Section par enceinte */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
              <AcUnit />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Surveillance par Enceinte
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Détail des températures et historiques pour chaque unité de stockage
              </Typography>
            </Box>
          </Box>

          {loading.units ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3 }} />
            ))
          ) : units.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500', mx: 'auto', mb: 2 }}>
                  <AcUnit />
                </Avatar>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucune enceinte configurée
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Configurez des unités de stockage pour commencer la surveillance
                </Typography>
              </CardContent>
            </Card>
          ) : (
            units.map(unit => (
              <EnceinteSection
                key={unit.id}
                unit={unit}
                readings={readings}
                loading={loading.readings}
              />
            ))
          )}
        </Box>

      </Container>
    </Box>
  );
}

// Composant mémoïsé pour les cartes de statistiques
const StatCard = React.memo(({ title, value, icon, color }: { 
  title: string, 
  value: string | number, 
  icon: React.ReactNode,
  color: string
}) => (
  <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography 
            color="text.secondary" 
            gutterBottom 
            variant="body2"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';