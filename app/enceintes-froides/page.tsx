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
  Alert
} from '@mui/material';
import {
  AcUnit,
  Thermostat,
  CheckCircle,
  Cancel,
  Save
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
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    }
  };

  const selectedUnit = units.find(u => u.id === formData.cold_storage_unit_id);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 4,
        color: 'primary.main',
        fontWeight: 'bold'
      }}>
        <AcUnit fontSize="large" />
        Enceintes Froides
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Formulaire de nouvelle lecture */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'info.main',
                mb: 3
              }}>
                <Thermostat />
                Nouvelle Lecture
              </Typography>
              
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
                        {unit.name} ({unit.location}) - {unit.type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedUnit && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Température autorisée: {selectedUnit.min_temperature}°C à {selectedUnit.max_temperature}°C
                  </Alert>
                )}
                
                <TextField
                  label="Température (°C)"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  value={formData.temperature}
                  onChange={(e) => handleTemperatureChange(e.target.value)}
                  required
                  fullWidth
                  error={selectedUnit && !validateTemperature(formData.temperature, formData.cold_storage_unit_id)}
                  helperText={selectedUnit && !validateTemperature(formData.temperature, formData.cold_storage_unit_id) 
                    ? "Température hors limites autorisées" 
                    : ""}
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_compliant}
                      onChange={(e) => setFormData({...formData, is_compliant: e.target.checked})}
                      icon={<Cancel />}
                      checkedIcon={<CheckCircle />}
                    />
                  }
                  label="Conforme"
                />
                
                <TextField
                  label="Commentaires"
                  multiline
                  rows={3}
                  value={formData.comments || ''}
                  onChange={(e) => setFormData({...formData, comments: e.target.value})}
                  fullWidth
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Enregistrer
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        {/* Tableau des dernières lectures */}
        <Box sx={{ flex: 1, minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'info.main',
                mb: 3
              }}>
                <Thermostat />
                Dernières Lectures
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Unité</strong></TableCell>
                      <TableCell><strong>Température</strong></TableCell>
                      <TableCell><strong>Statut</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {readings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            Aucune lecture enregistrée
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      readings.map(reading => {
                        const unit = units.find(u => u.id === reading.cold_storage_unit_id);
                        return (
                          <TableRow key={reading.id} hover>
                            <TableCell>
                              {new Date(reading.reading_date).toLocaleString('fr-FR', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {unit ? unit.name : 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {unit ? unit.location : ''}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                fontWeight="medium"
                                color={reading.is_compliant ? 'success.main' : 'error.main'}
                              >
                                {reading.temperature}°C
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                icon={reading.is_compliant ? <CheckCircle /> : <Cancel />}
                                label={reading.is_compliant ? 'Conforme' : 'Non conforme'}
                                color={reading.is_compliant ? 'success' : 'error'}
                                variant={reading.is_compliant ? 'outlined' : 'filled'}
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
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Affichage des 10 dernières lectures
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}