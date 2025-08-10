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
  Alert,
  Divider,
  Chip,
  Paper,
  Stack,
  Avatar,
  Grid2 as Grid
} from '@mui/material';
import {
  Print,
  LocalOffer,
  Numbers,
  Preview,
  Schedule,
  Info,
  CalendarMonth,
  Category
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function LabelPrinting() {
  const [formData, setFormData] = useState<TablesInsert<'label_printings'>>({
    print_date: new Date().toISOString(),
    expiry_date: '',
    label_count: 1,
    product_label_type_id: null,
    organization_id: null,
  });
  const [labelTypes, setLabelTypes] = useState<Tables<'product_label_types'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    expiryDate: Date | null;
    daysRemaining: number | null;
    urgencyLevel: 'low' | 'medium' | 'high' | null;
  }>({
    expiryDate: null,
    daysRemaining: null,
    urgencyLevel: null
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchLabelTypes();
  }, []);

  useEffect(() => {
    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date);
      const today = new Date();
      const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let urgencyLevel: 'low' | 'medium' | 'high' | null = null;
      if (daysRemaining <= 2) urgencyLevel = 'high';
      else if (daysRemaining <= 7) urgencyLevel = 'medium';
      else urgencyLevel = 'low';

      setPreviewData({
        expiryDate,
        daysRemaining,
        urgencyLevel
      });
    } else {
      setPreviewData({
        expiryDate: null,
        daysRemaining: null,
        urgencyLevel: null
      });
    }
  }, [formData.expiry_date]);

  const fetchLabelTypes = async () => {
    try {
      const { data, error } = await supabase.from('product_label_types').select('*');
      if (!error && data) setLabelTypes(data);
    } catch (error) {
      console.error('Error fetching label types:', error);
    }
  };

  const getUrgencyColor = (urgency: 'low' | 'medium' | 'high' | null) => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getUrgencyLabel = (urgency: 'low' | 'medium' | 'high' | null, days: number | null) => {
    if (days === null) return 'Non défini';
    if (days < 0) return 'Expiré';
    if (days === 0) return 'Expire aujourd\'hui';
    if (days === 1) return 'Expire demain';
    switch (urgency) {
      case 'high': return `Urgent (${days}j)`;
      case 'medium': return `À surveiller (${days}j)`;
      case 'low': return `Normal (${days}j)`;
      default: return `${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('label_printings')
        .insert([formData]);
      
      if (error) throw error;
      
      enqueueSnackbar(`Impression de ${formData.label_count} étiquette${formData.label_count > 1 ? 's' : ''} enregistrée avec succès!`, { variant: 'success' });
      
      // Reset form
      setFormData({
        print_date: new Date().toISOString(),
        expiry_date: '',
        label_count: 1,
        product_label_type_id: null,
        organization_id: null,
      });
    } catch (error) {
      console.error('Error saving printing:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header avec gradient moderne */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
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
            <Print fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Impression des DLC Secondaires
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              Génération d'étiquettes avec dates limites de consommation
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Dernière impression : {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
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
                      Étiquettes à imprimer
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {formData.label_count}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9c27b020', color: '#9c27b0' }}>
                    <Numbers />
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
                      Jours restants
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {previewData.daysRemaining || '-'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#ff980020', color: '#ff9800' }}>
                    <CalendarMonth />
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
                      Type d'étiquette
                    </Typography>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                      {labelTypes.find(t => t.id === formData.product_label_type_id)?.category || 'Non défini'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
                    <Category />
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
                      Urgence
                    </Typography>
                    <Chip
                      label={getUrgencyLabel(previewData.urgencyLevel, previewData.daysRemaining)}
                      color={getUrgencyColor(previewData.urgencyLevel)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: previewData.urgencyLevel === 'high' ? '#f4433620' : 
                              previewData.urgencyLevel === 'medium' ? '#ff980020' : '#4caf5020',
                      color: previewData.urgencyLevel === 'high' ? '#f44336' : 
                             previewData.urgencyLevel === 'medium' ? '#ff9800' : '#4caf50'
                    }}
                  >
                    <Schedule />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Formulaire d impression */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: 'fit-content', transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: '#9c27b020', color: '#9c27b0' }}>
                    <LocalOffer />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Configuration d impression
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paramétrez vos étiquettes DLC secondaires
                    </Typography>
                  </Box>
                </Box>
                
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Date d expiration"
                        type="date"
                        value={formData.expiry_date ? formData.expiry_date.split('T')[0] : ''}
                        onChange={(e) => setFormData({...formData, expiry_date: new Date(e.target.value).toISOString()})}
                        required
                        fullWidth
                        slotProps={{
                          inputLabel: { shrink: true }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Nombre d'étiquettes"
                        type="number"
                        value={formData.label_count}
                        onChange={(e) => setFormData({...formData, label_count: Number(e.target.value)})}
                        slotProps={{
                          htmlInput: { min: 1, max: 1000 }
                        }}
                        required
                        fullWidth
                        helperText="Entre 1 et 1000 étiquettes"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Type d'étiquette</InputLabel>
                        <Select
                          value={formData.product_label_type_id || ''}
                          label="Type d'étiquette"
                          onChange={(e) => setFormData({...formData, product_label_type_id: e.target.value})}
                        >
                          <MenuItem value="">
                            <em>Sélectionner un type</em>
                          </MenuItem>
                          {labelTypes.map(type => (
                            <MenuItem key={type.id} value={type.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Typography variant="body1" sx={{ flexGrow: 1 }}>
                                  {type.category} - {type.sub_category}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {type.shelf_life_days}j
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Alertes d urgence */}
                    {previewData.urgencyLevel === 'high' && (
                      <Grid item xs={12}>
                        <Alert severity="error">
                          <strong>Attention :</strong> Date d expiration très proche ou dépassée
                        </Alert>
                      </Grid>
                    )}
                    
                    {previewData.urgencyLevel === 'medium' && (
                      <Grid item xs={12}>
                        <Alert severity="warning">
                          <strong>À surveiller :</strong> Date d expiration dans moins d une semaine
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                  
                  <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={loading ? <Schedule /> : <Print />}
                      disabled={loading}
                      fullWidth
                      sx={{ 
                        py: 2,
                        background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)',
                        }
                      }}
                    >
                      {loading ? 'Impression en cours...' : `Imprimer ${formData.label_count} étiquette${formData.label_count > 1 ? 's' : ''}`}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Aperçu de l'étiquette */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 'fit-content', transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
                    <Preview />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Aperçu de l'Étiquette
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Prévisualisation en temps réel
                    </Typography>
                  </Box>
                </Box>
                
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 4, 
                    border: '2px dashed', 
                    borderColor: 'grey.300', 
                    textAlign: 'center',
                    bgcolor: 'grey.50',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                    DLC SECONDAIRE
                  </Typography>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        DATE LIMITE DE CONSOMMATION
                      </Typography>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: previewData.urgencyLevel === 'high' ? 'error.main' : 
                                 previewData.urgencyLevel === 'medium' ? 'warning.main' : 'success.main'
                        }}
                      >
                        {formData.expiry_date ? 
                          new Date(formData.expiry_date).toLocaleDateString('fr-FR') : 
                          'JJ/MM/AAAA'
                        }
                      </Typography>
                    </Box>
                    
                    {previewData.urgencyLevel && (
                      <Chip
                        label={getUrgencyLabel(previewData.urgencyLevel, previewData.daysRemaining)}
                        color={getUrgencyColor(previewData.urgencyLevel)}
                        sx={{ alignSelf: 'center', fontWeight: 600 }}
                      />
                    )}
                    
                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'grey.300' }}>
                      <Typography variant="caption" color="text.secondary">
                        Imprimé le {new Date().toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
                
                {formData.label_count > 1 && (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                      <strong>{formData.label_count} exemplaires</strong> de cette étiquette seront imprimés
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Guide et informations */}
        <Card sx={{ mt: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
            p: 3, 
            borderBottom: '1px solid', 
            borderColor: 'divider' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <Info />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Guide des DLC Secondaires
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bonnes pratiques et réglementation en vigueur
                </Typography>
              </Box>
            </Box>
          </Box>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  🎯 Usage et Réglementation
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• Les étiquettes DLC secondaires sont obligatoires pour tous les produits transformés en interne</Typography>
                  <Typography variant="body2">• Elles permettent de respecter la traçabilité alimentaire selon la réglementation HACCP</Typography>
                  <Typography variant="body2">• La date limite de consommation doit être clairement visible et lisible</Typography>
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'warning.main' }}>
                  ⚠️ Codes Couleur d urgence
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Rouge" color="error" size="small" />
                    <Typography variant="body2">Urgent (≤ 2 jours)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Orange" color="warning" size="small" />
                    <Typography variant="body2">Attention (≤ 7 jours)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Vert" color="success" size="small" />
                    <Typography variant="body2">Normal (&gt; 7 jours)</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}