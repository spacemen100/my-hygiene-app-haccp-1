"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/src/types/database';
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
  Grid,
  Stack
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

export default function ColdStorage() {
  const [units, setUnits] = useState<Tables<'cold_storage_units'>[]>([]);
  const [readings, setReadings] = useState<Tables<'cold_storage_temperature_readings'>[]>([]);
  const [formData, setFormData] = useState<TablesInsert<'cold_storage_temperature_readings'>>({
    reading_date: new Date().toISOString(),
    temperature: 0,
    is_compliant: true,
    cold_storage_unit_id: null,
    comments: null,
    user_id: null,
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchUnits();
    fetchReadings();
  }, []);

  const fetchUnits = async () => {
    const { data, error } = await supabase.from('cold_storage_units').select('*');
    if (!error && data) setUnits(data);
  };

  const fetchReadings = async () => {
    const { data, error } = await supabase
      .from('cold_storage_temperature_readings')
      .select('*')
      .order('reading_date', { ascending: false })
      .limit(10);
    if (!error && data) setReadings(data);
  };

  const validateTemperature = (temp: number, unitId: string | null | undefined) => {
    if (!unitId) return true;
    const unit = units.find(u => u.id === unitId);
    if (!unit) return true;
    return temp >= unit.min_temperature && temp <= unit.max_temperature;
  };

  const handleTemperatureChange = (value: string) => {
    const temp = Number(value);
    const isCompliant = validateTemperature(temp, formData.cold_storage_unit_id);
    setFormData({
      ...formData, 
      temperature: temp,
      is_compliant: isCompliant
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('cold_storage_temperature_readings')
        .insert([formData]);
      
      if (error) throw error;
      
      enqueueSnackbar('Lecture enregistrée avec succès!', { variant: 'success' });
      fetchReadings();
      // Reset form
      setFormData({
        reading_date: new Date().toISOString(),
        temperature: 0,
        is_compliant: true,
        cold_storage_unit_id: null,
        comments: null,
        user_id: null,
      });
    } catch (error) {
      console.error('Error saving reading:', error);
      enqueueSnackbar('Erreur lors de l&apos;enregistrement', { variant: 'error' });
    }
  };

  const selectedUnit = units.find(u => u.id === formData.cold_storage_unit_id);

  // Calculer les statistiques
  const stats = {
    totalUnits: units.length,
    recentReadings: readings.length,
    compliantReadings: readings.filter(r => r.is_compliant).length,
    averageTemp: readings.length > 0 ? 
      (readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length).toFixed(1) : 
      'N/A'
  };

  const getTemperatureColor = (temp: number, unit: Tables<'cold_storage_units'> | undefined) => {
    if (!unit) return 'text.primary';
    if (temp < unit.min_temperature || temp > unit.max_temperature) return 'error.main';
    return 'success.main';
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header avec gradient moderne */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              width: 80,
              height: 80,
            }}
          >
            <AcUnit fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Enceintes Froides
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              Surveillance et contrôle des températures de stockage
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
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

      <Container maxWidth="xl">
        
        {/* Statistiques rapides */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Unités actives
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.totalUnits}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#00bcd420', color: '#00bcd4' }}>
                    <DeviceThermostat />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Lectures récentes
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.recentReadings}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
                    <History />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Conformité
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.recentReadings > 0 ? 
                        Math.round((stats.compliantReadings / stats.recentReadings) * 100) + '%' : 
                        'N/A'
                      }
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: stats.compliantReadings === stats.recentReadings ? '#4caf5020' : '#ff980020', 
                                color: stats.compliantReadings === stats.recentReadings ? '#4caf50' : '#ff9800' }}>
                    {stats.compliantReadings === stats.recentReadings ? <CheckCircle /> : <Cancel />}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Température moy.
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.averageTemp}°C
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196f320', color: '#2196f3' }}>
                    <Sensors />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Formulaire de nouvelle lecture */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: 'fit-content', transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
              <CardContent sx={{ p: 4 }}>
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
                      slotProps={{
                        htmlInput: { step: "0.1" }
                      }}
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
                            getTemperatureColor(formData.temperature, selectedUnit) : 
                            'text.primary'
                        }
                      }}
                    />
                    
                    {/* Indicateur visuel de température */}
                    {selectedUnit && (
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
                    placeholder="Actions correctives, anomalies détectées, conditions particulières..."
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
          </Grid>
          
          {/* Historique des lectures */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: 'fit-content', transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
                    <History />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Historique des Lectures
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {readings.length} lecture{readings.length !== 1 ? 's' : ''} récente{readings.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
                
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
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
                      {readings.length === 0 ? (
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
                        readings.map(reading => {
                          const unit = units.find(u => u.id === reading.cold_storage_unit_id);
                          const isRecent = new Date().getTime() - new Date(reading.reading_date).getTime() < 3600000; // < 1h
                          return (
                            <TableRow key={reading.id} hover sx={{ 
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
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {readings.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      📊 Affichage des 10 dernières lectures • Mise à jour en temps réel
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block">
                      Les lectures récentes (moins d&apos;1h) sont surlignées
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Guide et bonnes pratiques */}
        <Card sx={{ mt: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)', 
            p: 3, 
            borderBottom: '1px solid', 
            borderColor: 'divider' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <AcUnit />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Bonnes Pratiques - Enceintes Froides HACCP
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Surveillance continue et conformité réglementaire
                </Typography>
              </Box>
            </Box>
          </Box>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  🎯 Fréquence de Contrôle
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• <strong>Minimum 2 fois par jour</strong> : matin et soir</Typography>
                  <Typography variant="body2">• <strong>Après chaque ouverture prolongée</strong> de l&apos;enceinte</Typography>
                  <Typography variant="body2">• <strong>En cas d&apos;alarme</strong> ou de dysfonctionnement</Typography>
                  <Typography variant="body2">• <strong>Lors de variations climatiques</strong> importantes</Typography>
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
                  ⚠️ Actions en Cas de Non-Conformité
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• <strong>Vérifier immédiatement</strong> le bon fonctionnement de l&apos;équipement</Typography>
                  <Typography variant="body2">• <strong>Isoler les produits</strong> potentiellement compromis</Typography>
                  <Typography variant="body2">• <strong>Documenter l&apos;incident</strong> et les actions correctives</Typography>
                  <Typography variant="body2">• <strong>Contacter la maintenance</strong> si nécessaire</Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}