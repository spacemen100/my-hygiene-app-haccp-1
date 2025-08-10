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
  LinearProgress,
  Avatar,
  Grid,
  Stack,
  Paper
} from '@mui/material';
import {
  AcUnit,
  TrendingDown,
  Timer,
  CheckCircle,
  Cancel,
  Save,
  Schedule,
  Thermostat,
  Speed,
  AccessTime,
  TrendingUp
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
    if (formData.end_core_temperature === null || formData.end_core_temperature === undefined || !formData.end_date) return null;
    
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

  // Calculer les statistiques
  const stats = {
    tempStart: formData.start_core_temperature || 0,
    tempEnd: formData.end_core_temperature || null,
    coolingRate: coolingRate,
    timeRemaining: formData.end_date && formData.start_date ? 
      Math.max(0, (new Date(formData.start_date).getTime() + 6 * 60 * 60 * 1000) - Date.now()) / (1000 * 60 * 60) : null
  };

  const getProgressValue = () => {
    if (!formData.end_core_temperature || formData.start_core_temperature <= 10) return 0;
    return Math.min(100, ((formData.start_core_temperature - formData.end_core_temperature) / 
           Math.max(1, formData.start_core_temperature - 10)) * 100);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header avec gradient moderne */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
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
            <TrendingDown fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Suivi de Refroidissement HACCP
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              Contrôle de la chaîne du froid et conformité réglementaire
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Objectif HACCP : 65°C → 10°C en moins de 6 heures
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
                      Temp. de départ
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.tempStart}°C
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#f4433620', color: '#f44336' }}>
                    <TrendingUp />
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
                      Temp. actuelle
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.tempEnd !== null ? `${stats.tempEnd}°C` : '-'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196f320', color: '#2196f3' }}>
                    <Thermostat />
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
                      Vitesse refroid.
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.coolingRate ? `${stats.coolingRate.toFixed(1)}°C/h` : '-'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9c27b020', color: '#9c27b0' }}>
                    <Speed />
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
                    <Chip
                      label={
                        coolingStatus === 'compliant' ? 'Conforme' :
                        coolingStatus === 'warning' ? 'Acceptable' :
                        coolingStatus === 'non-compliant' ? 'Non conforme' : 'En cours'
                      }
                      color={
                        coolingStatus === 'compliant' ? 'success' :
                        coolingStatus === 'warning' ? 'warning' :
                        coolingStatus === 'non-compliant' ? 'error' : 'default'
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: coolingStatus === 'compliant' ? '#4caf5020' : 
                            coolingStatus === 'warning' ? '#ff980020' : 
                            coolingStatus === 'non-compliant' ? '#f4433620' : '#grey20',
                    color: coolingStatus === 'compliant' ? '#4caf50' : 
                           coolingStatus === 'warning' ? '#ff9800' : 
                           coolingStatus === 'non-compliant' ? '#f44336' : '#grey'
                  }}>
                    <AccessTime />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Formulaire principal */}
        <Card sx={{ transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: '#2196f320', color: '#2196f3' }}>
                <AcUnit />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Enregistrement de Refroidissement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Traçabilité du processus de refroidissement HACCP
                </Typography>
              </Box>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nom du produit"
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    required
                    fullWidth
                    placeholder="Ex: Rôti de porc, Escalopes de volaille..."
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Type de produit"
                    value={formData.product_type}
                    onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                    required
                    fullWidth
                    placeholder="Ex: Volaille, Porc, Bœuf..."
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Température initiale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={formData.start_core_temperature}
                    onChange={(e) => setFormData({...formData, start_core_temperature: Number(e.target.value)})}
                    required
                    fullWidth
                    helperText="Température à cœur au début du refroidissement"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Température finale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={formData.end_core_temperature || ''}
                    onChange={(e) => setFormData({...formData, end_core_temperature: e.target.value ? Number(e.target.value) : null})}
                    fullWidth
                    helperText="Température à cœur à la fin (optionnel si en cours)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Date et heure de début"
                    type="datetime-local"
                    value={formatDateTimeForInput(formData.start_date)}
                    onChange={(e) => setFormData({...formData, start_date: new Date(e.target.value).toISOString()})}
                    required
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Date et heure de fin"
                    type="datetime-local"
                    value={formData.end_date ? formatDateTimeForInput(formData.end_date) : ''}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                    helperText="Laisser vide si le refroidissement est en cours"
                  />
                </Grid>

                {/* Section d analyse du refroidissement */}
                {formData.end_core_temperature !== null && formData.end_core_temperature !== undefined && formData.end_date && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <AcUnit />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Analyse du Refroidissement
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Validation automatique HACCP
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        {coolingRate && (
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                              <Timer color="primary" sx={{ mb: 1 }} />
                              <Typography variant="caption" color="text.secondary" display="block">
                                Vitesse de refroidissement
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {coolingRate.toFixed(1)} °C/h
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <TrendingDown color="info" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Écart de température
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {(formData.start_core_temperature - formData.end_core_temperature).toFixed(1)}°C
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <AccessTime color="warning" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Durée processus
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            {coolingStatus === 'compliant' ? <CheckCircle color="success" sx={{ mb: 1 }} /> : <Cancel color="error" sx={{ mb: 1 }} />}
                            <Typography variant="caption" color="text.secondary" display="block">
                              Conformité HACCP
                            </Typography>
                            <Chip
                              label={
                                coolingStatus === 'compliant' ? 'Conforme' :
                                coolingStatus === 'warning' ? 'Acceptable' :
                                coolingStatus === 'non-compliant' ? 'Non conforme' : 'En cours'
                              }
                              color={
                                coolingStatus === 'compliant' ? 'success' :
                                coolingStatus === 'warning' ? 'warning' :
                                coolingStatus === 'non-compliant' ? 'error' : 'default'
                              }
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Barre de progression */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Progression du refroidissement
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={getProgressValue()}
                          color={coolingStatus === 'compliant' ? 'success' : coolingStatus === 'warning' ? 'warning' : 'error'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {getProgressValue().toFixed(0)}% de refroidissement accompli
                        </Typography>
                      </Box>

                      <Alert 
                        severity={
                          coolingStatus === 'compliant' ? 'success' :
                          coolingStatus === 'warning' ? 'warning' :
                          coolingStatus === 'non-compliant' ? 'error' : 'info'
                        }
                      >
                        {coolingStatus === 'compliant' && 
                          'Refroidissement conforme aux règles HACCP (65°C → 10°C en moins de 6h)'}
                        {coolingStatus === 'warning' && 
                          'Température finale atteinte mais délai HACCP dépassé'}
                        {coolingStatus === 'non-compliant' && 
                          'Refroidissement non conforme - température finale trop élevée'}
                        {coolingStatus === 'pending' && 
                          'Refroidissement en cours - données incomplètes'}
                      </Alert>
                    </Card>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    label="Commentaires et observations"
                    multiline
                    rows={3}
                    value={formData.comments || ''}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    fullWidth
                    placeholder="Actions correctives, conditions particulières, observations..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={loading ? <Schedule /> : <Save />}
                      disabled={loading}
                      fullWidth
                      sx={{ 
                        py: 2,
                        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        }
                      }}
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer le suivi de refroidissement'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {/* Guide HACCP */}
        <Card sx={{ mt: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
            p: 3, 
            borderBottom: '1px solid', 
            borderColor: 'divider' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <AcUnit />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Guide du Refroidissement HACCP
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Règles et bonnes pratiques pour la sécurité alimentaire
                </Typography>
              </Box>
            </Box>
          </Box>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  🎯 Objectifs HACCP
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• <strong>Température cible :</strong> Passer de 65°C à 10°C</Typography>
                  <Typography variant="body2">• <strong>Délai maximum :</strong> 6 heures maximum</Typography>
                  <Typography variant="body2">• <strong>Zone critique :</strong> Entre 65°C et 10°C (multiplication bactérienne)</Typography>
                  <Typography variant="body2">• <strong>Mesure obligatoire :</strong> Contrôle de température à cœur</Typography>
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
                  ⚠️ Actions Correctives
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• <strong>Non-conformité détectée :</strong> Analyser les causes immédiates</Typography>
                  <Typography variant="body2">• <strong>Équipement défaillant :</strong> Vérifier le fonctionnement des équipements</Typography>
                  <Typography variant="body2">• <strong>Produit compromis :</strong> Évaluer la sécurité sanitaire</Typography>
                  <Typography variant="body2">• <strong>Documentation :</strong> Enregistrer toutes les mesures prises</Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}