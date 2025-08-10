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
  IconButton,
  Paper,
  Stack
} from '@mui/material';
import {
  Print,
  LocalOffer,
  DateRange,
  Numbers,
  Preview,
  Save,
  Schedule,
  Info
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 4,
        color: 'primary.main',
        fontWeight: 'bold'
      }}>
        <Print fontSize="large" />
        Impression des DLC Secondaires
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Formulaire d'impression */}
        <Box sx={{ flex: 1, minWidth: 350 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'info.main',
                mb: 3
              }}>
                <LocalOffer />
                Configuration d'Impression
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Date d'expiration"
                  type="date"
                  value={formData.expiry_date ? formData.expiry_date.split('T')[0] : ''}
                  onChange={(e) => setFormData({...formData, expiry_date: new Date(e.target.value).toISOString()})}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <IconButton size="small" disabled>
                        <DateRange />
                      </IconButton>
                    )
                  }}
                />
                
                <TextField
                  label="Nombre d'étiquettes"
                  type="number"
                  value={formData.label_count}
                  onChange={(e) => setFormData({...formData, label_count: Number(e.target.value)})}
                  inputProps={{ min: 1, max: 1000 }}
                  required
                  fullWidth
                  helperText="Entre 1 et 1000 étiquettes"
                  InputProps={{
                    startAdornment: (
                      <IconButton size="small" disabled>
                        <Numbers />
                      </IconButton>
                    )
                  }}
                />
                
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
                            {type.name}
                          </Typography>
                          {type.description && (
                            <Typography variant="caption" color="text.secondary">
                              {type.description}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Aperçu de l'urgence */}
                {previewData.expiryDate && (
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Preview />
                      Aperçu de l'urgence
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Chip
                        label={getUrgencyLabel(previewData.urgencyLevel, previewData.daysRemaining)}
                        color={getUrgencyColor(previewData.urgencyLevel)}
                        size="small"
                        variant="filled"
                      />
                      <Typography variant="body2" color="text.secondary">
                        Expire le {previewData.expiryDate.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                    
                    {previewData.urgencyLevel === 'high' && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        <strong>Attention :</strong> Date d'expiration très proche ou dépassée
                      </Alert>
                    )}
                    {previewData.urgencyLevel === 'medium' && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <strong>À surveiller :</strong> Date d'expiration dans moins d'une semaine
                      </Alert>
                    )}
                  </Card>
                )}
                
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <Schedule /> : <Print />}
                  disabled={loading}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Impression en cours...' : `Imprimer ${formData.label_count} étiquette${formData.label_count > 1 ? 's' : ''}`}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        {/* Aperçu de l'étiquette */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'success.main',
                mb: 3
              }}>
                <Preview />
                Aperçu de l'Étiquette
              </Typography>
              
              <Paper elevation={2} sx={{ p: 3, border: '2px dashed', borderColor: 'grey.300', textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  DLC SECONDAIRE
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      DATE LIMITE DE CONSOMMATION
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
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
                      sx={{ alignSelf: 'center' }}
                    />
                  )}
                  
                  <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'grey.300' }}>
                    <Typography variant="caption" color="text.secondary">
                      Imprimé le {new Date().toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
              
              {formData.label_count > 1 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>{formData.label_count} exemplaires</strong> de cette étiquette seront imprimés
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Informations utiles */}
      <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'info.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info />
            Informations sur les DLC Secondaires
          </Typography>
          <Typography variant="body2" sx={{ color: 'info.dark' }}>
            • <strong>Usage :</strong> Les étiquettes DLC secondaires sont utilisées pour les produits transformés en interne<br/>
            • <strong>Réglementation :</strong> Obligatoires pour tous les produits périssables préparés sur site<br/>
            • <strong>Codes couleur :</strong> Rouge (urgent ≤2j), Orange (attention ≤7j), Vert (normal &gt;7j)<br/>
            • <strong>Conservation :</strong> Conserver une copie numérique de chaque lot d'étiquettes imprimées<br/>
            • <strong>Contrôle :</strong> Vérifier la date avant impression et l'exactitude après impression
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}