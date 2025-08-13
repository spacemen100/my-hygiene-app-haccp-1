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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Stack,
  Skeleton,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  AcUnit,
  Thermostat,
  CheckCircle,
  Cancel,
  Save,
  DeviceThermostat,
  Sensors,
  History,
  FilterList,
  Download,
  Close,
  DateRange
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import TemperatureCurvesChart from '@/components/TemperatureCurvesChart';

// Composant mémoïsé pour les lignes du tableau
const ReadingRow = React.memo(({ reading, units }: { reading: Tables<'cold_storage_temperature_readings'>, units: Tables<'cold_storage_units'>[] }) => {
  const unit = useMemo(() => units.find(u => u.id === reading.cold_storage_unit_id), [reading.cold_storage_unit_id, units]);
  const isRecent = useMemo(() => new Date().getTime() - new Date(reading.reading_date).getTime() < 3600000, [reading.reading_date]);

  const getTemperatureColor = useCallback((temp: number, unit?: Tables<'cold_storage_units'>) => {
    if (!unit) return 'text.primary';
    return temp < unit.min_temperature || temp > unit.max_temperature ? 'error.main' : 'success.main';
  }, []);

  return (
    <TableRow hover sx={{ 
      '&:hover': { bgcolor: 'action.hover' },
      bgcolor: isRecent ? 'success.light' : 'inherit',
      opacity: isRecent ? 1 : 0.8
    }}>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {new Date(reading.reading_date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(reading.reading_date).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {unit ? unit.name : 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {unit ? unit.location : ''}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="body1" 
            fontWeight="bold"
            color={getTemperatureColor(reading.temperature, unit)}
          >
            {reading.temperature}°C
          </Typography>
          <Thermostat 
            fontSize="small" 
            sx={{ color: getTemperatureColor(reading.temperature, unit) }} 
          />
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          size="small"
          icon={reading.is_compliant ? <CheckCircle /> : <Cancel />}
          label={reading.is_compliant ? 'Conforme' : 'Non conforme'}
          color={reading.is_compliant ? 'success' : 'error'}
          variant={reading.is_compliant ? 'outlined' : 'filled'}
          sx={{ fontWeight: 600 }}
        />
      </TableCell>
    </TableRow>
  );
});
ReadingRow.displayName = 'ReadingRow';

// Composant mémoïsé pour la jauge de température
const TemperatureGauge = React.memo(({ temp, min, max }: { temp: number, min: number, max: number }) => {
  const percentage = useMemo(() => Math.min(100, Math.max(0, ((temp - min) / (max - min)) * 100)), [temp, min, max]);
  const color = useMemo(() => temp < min ? '#ff5252' : temp > max ? '#ff9800' : '#4caf50', [temp, min, max]);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption">{min}°C</Typography>
        <Typography variant="caption">{max}°C</Typography>
      </Box>
      <Box sx={{
        height: 8,
        bgcolor: 'grey.200',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Box sx={{
          position: 'absolute',
          left: 0,
          width: `${percentage}%`,
          height: '100%',
          bgcolor: color,
          transition: 'all 0.3s ease'
        }} />
      </Box>
    </Box>
  );
});
TemperatureGauge.displayName = 'TemperatureGauge';

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
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    unitId: null as string | null,
    compliantOnly: false,
    dateRange: { start: null as Date | null, end: null as Date | null }
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Fetch des données avec mémoïsation
  const fetchUnits = useCallback(async () => {
    setLoading(prev => ({ ...prev, units: true }));
    const { data, error } = await supabase.from('cold_storage_units').select('*');
    if (!error && data) setUnits(data);
    setLoading(prev => ({ ...prev, units: false }));
  }, []);

  const fetchReadings = useCallback(async (page = 1, reset = false) => {
    setLoading(prev => ({ ...prev, readings: true }));
    
    let query = supabase
      .from('cold_storage_temperature_readings')
      .select('*', { count: 'exact' })
      .order('reading_date', { ascending: false })
      .range((page - 1) * 10, page * 10 - 1);

    // Application des filtres
    if (filters.unitId) query = query.eq('cold_storage_unit_id', filters.unitId);
    if (filters.compliantOnly) query = query.eq('is_compliant', true);
    if (filters.dateRange.start) query = query.gte('reading_date', filters.dateRange.start.toISOString());
    if (filters.dateRange.end) query = query.lte('reading_date', filters.dateRange.end.toISOString());

    const { data, error, count } = await query;

    if (!error) {
      setReadings(prev => reset ? (data || []) : [...prev, ...(data || [])]);
      setHasMore((count || 0) > page * 10);
    } else {
      enqueueSnackbar('Erreur de chargement', { variant: 'error' });
    }
    
    setLoading(prev => ({ ...prev, readings: false }));
  }, [filters, enqueueSnackbar]);

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
    } catch (error) {
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    }
  }, [formData, employee, user, enqueueSnackbar, fetchReadings]);

  // Filtres
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const applyFilters = useCallback(() => {
    fetchReadings(1, true);
    setFilterAnchorEl(null);
  }, [fetchReadings]);



  const selectedUnit = useMemo(() => 
    units.find(u => u.id === formData.cold_storage_unit_id), 
    [units, formData.cold_storage_unit_id]
  );

  // Statistiques calculées
  const stats = useMemo(() => {
    const filteredReadings = readings.filter(r => {
      if (filters.unitId && r.cold_storage_unit_id !== filters.unitId) return false;
      if (filters.compliantOnly && !r.is_compliant) return false;
      if (filters.dateRange.start && new Date(r.reading_date) < filters.dateRange.start) return false;
      if (filters.dateRange.end && new Date(r.reading_date) > filters.dateRange.end) return false;
      return true;
    });

    return {
      totalUnits: units.length,
      recentReadings: filteredReadings.length,
      compliantReadings: filteredReadings.filter(r => r.is_compliant).length,
      averageTemp: filteredReadings.length > 0 ? 
        (filteredReadings.reduce((sum, r) => sum + r.temperature, 0) / filteredReadings.length) : 
        0
    };
  }, [readings, units, filters]);

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

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, 
          gap: { xs: 3, md: 4 }
        }}>
          {/* Formulaire de nouvelle lecture */}
          <Box>
            <Card sx={{ 
              height: 'fit-content', 
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
                
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

                  {selectedUnit && (
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'info.light' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                          <DeviceThermostat fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" color="info.dark">
                            {selectedUnit.name} - {selectedUnit.location}
                          </Typography>
                          <Typography variant="body2" color="info.dark">
                            Température autorisée: {selectedUnit.min_temperature}°C à {selectedUnit.max_temperature}°C
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  )}
                  
                  <Box>
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
                        "✅ Température dans les limites autorisées" :
                        selectedUnit ? "⚠️ Température hors limites autorisées" : 
                        "Saisir la température mesurée"
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: selectedUnit ? 
                            validateTemperature(formData.temperature, formData.cold_storage_unit_id) ? 
                            'success.main' : 'error.main' : 
                            'text.primary'
                        }
                      }}
                    />
                    
                    {selectedUnit && (
                      <>
                        <TemperatureGauge 
                          temp={formData.temperature} 
                          min={selectedUnit.min_temperature} 
                          max={selectedUnit.max_temperature} 
                        />
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            icon={validateTemperature(formData.temperature, formData.cold_storage_unit_id) ? 
                                  <CheckCircle /> : <Cancel />}
                            label={validateTemperature(formData.temperature, formData.cold_storage_unit_id) ? 
                                  'Conforme' : 'Non conforme'}
                            color={validateTemperature(formData.temperature, formData.cold_storage_unit_id) ? 
                                  'success' : 'error'}
                            variant="filled"
                          />
                          <Typography variant="body2" color="text.secondary">
                            {formData.temperature}°C
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_compliant}
                        onChange={(e) => setFormData({...formData, is_compliant: e.target.checked})}
                        icon={<Cancel />}
                        checkedIcon={<CheckCircle />}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>Validation manuelle</Typography>
                        <Chip size="small" 
                              label={formData.is_compliant ? 'Conforme' : 'À vérifier'} 
                              color={formData.is_compliant ? 'success' : 'default'}
                              variant="outlined"
                        />
                      </Box>
                    }
                  />
                  
                  <TextField
                    label="Commentaires et observations"
                    multiline
                    rows={3}
                    value={formData.comments || ''}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    fullWidth
                    placeholder="Actions correctives, anomalies détectées..."
                  />
                  
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={<Save />}
                      fullWidth
                      sx={{ 
                        py: 2,
                        background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0097a7 0%, #00838f 100%)',
                        }
                      }}
                    >
                      Enregistrer la lecture
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          {/* Historique et graphique */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Graphique des courbes de température par enceinte */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                {loading.readings ? (
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
                ) : (
                  <TemperatureCurvesChart readings={readings} units={units} />
                )}
              </CardContent>
            </Card>
            
            {/* Historique des lectures */}
            <Card>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 3,
                  pb: 0
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
                      <History />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Historique des Lectures
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {readings.length} lecture{readings.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Tooltip title="Filtrer">
                      <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                        <FilterList />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Exporter">
                      <IconButton onClick={() => setExportDialogOpen(true)}>
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Date & Heure</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Unité</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Température</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading.readings ? (
                        Array(5).fill(0).map((_, i) => (
                          <TableRow key={`skeleton-${i}`}>
                            <TableCell><Skeleton variant="text" /></TableCell>
                            <TableCell><Skeleton variant="text" /></TableCell>
                            <TableCell><Skeleton variant="text" /></TableCell>
                            <TableCell><Skeleton variant="text" /></TableCell>
                          </TableRow>
                        ))
                      ) : readings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500' }}>
                                <History />
                              </Avatar>
                              <Typography color="text.secondary">
                                Aucune lecture enregistrée
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                Les lectures apparaîtront ici après enregistrement
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        readings.map(reading => (
                          <ReadingRow key={reading.id} reading={reading} units={units} />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {loading.readings && hasMore && (
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
                
                {readings.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      📊 Affichage des {readings.length} dernières lectures • Mise à jour en temps réel
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block">
                      Les lectures récentes (moins d&apos;1h) sont surlignées
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Menu des filtres */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 2, width: 300 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Filtres avancés
              </Typography>
              <IconButton size="small" onClick={() => setFilterAnchorEl(null)}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Unité de stockage</InputLabel>
              <Select
                value={filters.unitId || ''}
                label="Unité de stockage"
                onChange={(e) => handleFilterChange({ unitId: e.target.value || null })}
              >
                <MenuItem value="">Toutes les unités</MenuItem>
                {units.map(unit => (
                  <MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.compliantOnly}
                  onChange={(e) => handleFilterChange({ compliantOnly: e.target.checked })}
                />
              }
              label="Afficher uniquement les lectures conformes"
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Période
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Début"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange({ 
                    dateRange: { 
                      ...filters.dateRange, 
                      start: e.target.value ? new Date(e.target.value) : null 
                    } 
                  })}
                />
                <TextField
                  label="Fin"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange({ 
                    dateRange: { 
                      ...filters.dateRange, 
                      end: e.target.value ? new Date(e.target.value) : null 
                    } 
                  })}
                />
              </Box>
            </Box>
            
            <Button 
              variant="contained" 
              fullWidth 
              onClick={applyFilters}
              startIcon={<FilterList />}
            >
              Appliquer les filtres
            </Button>
          </Box>
        </Menu>
        
        {/* Dialogue d'export */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
          <DialogTitle>Exporter les données</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Sélectionnez le format d'export pour les {readings.length} lectures enregistrées
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Fonctionnalités d'export CSV et PDF disponibles avec l'installation des packages appropriés.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>
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