"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';
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
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  AcUnit,
  TrendingDown,
  Timer,
  CheckCircle,
  Cancel,
  Save,
  Schedule
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function CoolingTracking() {
  const [formData, setFormData] = useState<TablesInsert<'cooling_records'>>({
    start_date: new Date().toISOString(),
    end_date: null,
    product_name: '',
    product_type: '',
    start_core_temperature: 0,
    end_core_temperature: null,
    is_compliant: null,
    comments: null,
    organization_id: null,
    user_id: null,
  });
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const formatDateTimeForInput = (isoString: string) => {
    return isoString.substring(0, 16);
  };

  const calculateCoolingRate = () => {
    if (formData.end_core_temperature === null || !formData.end_date) return null;
    
    const startTime = new Date(formData.start_date).getTime();
    const endTime = new Date(formData.end_date).getTime();
    const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
    
    if (timeDiffHours <= 0) return null;
    
    const tempDiff = formData.start_core_temperature - formData.end_core_temperature;
    return tempDiff / timeDiffHours; // °C/h
  };

  const getCoolingStatus = () => {
    const rate = calculateCoolingRate();
    if (!rate || !formData.end_core_temperature) return 'pending';
    
    // Règle générale : refroidissement de 65°C à 10°C en 6h max (HACCP)
    if (formData.start_core_temperature >= 65 && formData.end_core_temperature <= 10) {
      const startTime = new Date(formData.start_date).getTime();
      const endTime = formData.end_date ? new Date(formData.end_date).getTime() : Date.now();
      const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
      
      if (timeDiffHours <= 6) return 'compliant';
    }
    
    return formData.end_core_temperature <= 10 ? 'warning' : 'non-compliant';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const status = getCoolingStatus();
      const updatedFormData = {
        ...formData,
        is_compliant: status === 'compliant' || status === 'warning'
      };
      
      const { error } = await supabase
        .from('cooling_records')
        .insert([updatedFormData]);
      
      if (error) throw error;
      
      enqueueSnackbar('Enregistrement de refroidissement réussi!', { variant: 'success' });
      
      // Reset form
      setFormData({
        start_date: new Date().toISOString(),
        end_date: null,
        product_name: '',
        product_type: '',
        start_core_temperature: 0,
        end_core_temperature: null,
        is_compliant: null,
        comments: null,
        organization_id: null,
        user_id: null,
      });
    } catch (error) {
      console.error('Error saving cooling record:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const coolingRate = calculateCoolingRate();
  const coolingStatus = getCoolingStatus();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 4,
        color: 'primary.main',
        fontWeight: 'bold'
      }}>
        <TrendingDown fontSize="large" />
        Suivi de Refroidissement
      </Typography>
      
      <Card elevation={3}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Nom du produit"
              value={formData.product_name}
              onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              required
              fullWidth
              variant="outlined"
            />
            
            <TextField
              label="Type de produit"
              value={formData.product_type}
              onChange={(e) => setFormData({...formData, product_type: e.target.value})}
              required
              fullWidth
              variant="outlined"
              placeholder="Ex: Volaille, Porc, Bœuf..."
            />
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  label="Température initiale (°C)"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  value={formData.start_core_temperature}
                  onChange={(e) => setFormData({...formData, start_core_temperature: Number(e.target.value)})}
                  required
                  fullWidth
                  helperText="Température à cœur au début"
                />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  label="Température finale (°C)"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  value={formData.end_core_temperature || ''}
                  onChange={(e) => setFormData({...formData, end_core_temperature: e.target.value ? Number(e.target.value) : null})}
                  fullWidth
                  helperText="Température à cœur à la fin"
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  label="Date et heure de début"
                  type="datetime-local"
                  value={formatDateTimeForInput(formData.start_date)}
                  onChange={(e) => setFormData({...formData, start_date: new Date(e.target.value).toISOString()})}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  label="Date et heure de fin"
                  type="datetime-local"
                  value={formData.end_date ? formatDateTimeForInput(formData.end_date) : ''}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>

            {/* Indicateurs de refroidissement */}
            {formData.end_core_temperature !== null && formData.end_date && (
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AcUnit />
                  Analyse du refroidissement
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  {coolingRate && (
                    <Chip
                      icon={<Timer />}
                      label={`Vitesse: ${coolingRate.toFixed(1)} °C/h`}
                      color="info"
                      variant="outlined"
                    />
                  )}
                  
                  <Chip
                    icon={coolingStatus === 'compliant' ? <CheckCircle /> : <Cancel />}
                    label={
                      coolingStatus === 'compliant' ? 'Conforme HACCP' :
                      coolingStatus === 'warning' ? 'Acceptable' :
                      coolingStatus === 'non-compliant' ? 'Non conforme' : 'En cours'
                    }
                    color={
                      coolingStatus === 'compliant' ? 'success' :
                      coolingStatus === 'warning' ? 'warning' :
                      coolingStatus === 'non-compliant' ? 'error' : 'default'
                    }
                  />
                </Box>

                {/* Barre de progression du refroidissement */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Progression du refroidissement
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, ((formData.start_core_temperature - formData.end_core_temperature) / 
                           Math.max(1, formData.start_core_temperature - 10)) * 100)}
                    color={coolingStatus === 'compliant' ? 'success' : coolingStatus === 'warning' ? 'warning' : 'error'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Alert 
                  severity={
                    coolingStatus === 'compliant' ? 'success' :
                    coolingStatus === 'warning' ? 'warning' :
                    coolingStatus === 'non-compliant' ? 'error' : 'info'
                  }
                  sx={{ mt: 1 }}
                >
                  {coolingStatus === 'compliant' && 
                    'Refroidissement conforme aux règles HACCP (65°C → 10°C en moins de 6h)'}
                  {coolingStatus === 'warning' && 
                    'Température finale atteinte mais délai HACCP dépassé'}
                  {coolingStatus === 'non-compliant' && 
                    'Refroidissement non conforme - température finale trop élevée'}
                  {coolingStatus === 'pending' && 
                    'Refroidissement en cours...'}
                </Alert>
              </Card>
            )}
            
            <FormControl fullWidth>
              <InputLabel>Conformité manuelle</InputLabel>
              <Select
                value={formData.is_compliant === null ? '' : String(formData.is_compliant)}
                label="Conformité manuelle"
                onChange={(e) => setFormData({...formData, is_compliant: e.target.value === '' ? null : e.target.value === 'true'})}
              >
                <MenuItem value="">Non évalué</MenuItem>
                <MenuItem value="true">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" />
                    Conforme
                  </Box>
                </MenuItem>
                <MenuItem value="false">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cancel color="error" />
                    Non conforme
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Commentaires"
              multiline
              rows={3}
              value={formData.comments || ''}
              onChange={(e) => setFormData({...formData, comments: e.target.value})}
              fullWidth
              placeholder="Observations, incidents, mesures correctives..."
            />
            
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={loading ? <Schedule /> : <Save />}
              disabled={loading}
              fullWidth
              sx={{ mt: 2 }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Informations HACCP */}
      <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'info.dark' }}>
            📋 Rappel HACCP - Refroidissement rapide
          </Typography>
          <Typography variant="body2" sx={{ color: 'info.dark' }}>
            • <strong>Objectif :</strong> Passer de 65°C à 10°C en moins de 6 heures<br/>
            • <strong>Zone critique :</strong> Entre 65°C et 10°C (multiplication bactérienne)<br/>
            • <strong>Contrôle :</strong> Mesure de température à cœur obligatoire<br/>
            • <strong>Action :</strong> Si non-conformité, analyser les causes et prendre des mesures correctives
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}