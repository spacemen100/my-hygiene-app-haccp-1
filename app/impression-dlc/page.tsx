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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Print,
  LocalOffer,
  Numbers,
  Preview,
  Schedule,
  Info,
  CalendarMonth,
  Category,
  Close,
  HelpOutline
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
  const [guideModalOpen, setGuideModalOpen] = useState(false);
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
    if (days === 0) return 'Expire aujourd&apos;hui';
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
      enqueueSnackbar('Erreur lors de l&apos;enregistrement', { variant: 'error' });
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                Génération d&apos;étiquettes avec dates limites de consommation
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
          <Button
            variant="outlined"
            startIcon={<HelpOutline />}
            onClick={() => setGuideModalOpen(true)}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Mode d&apos;emploi
          </Button>
        </Box>
      </Paper>

      <Container maxWidth="xl">
        
        {/* Statistiques rapides */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          <Box>
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
          </Box>
          
          <Box>
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
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Type d&apos;étiquette
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
          </Box>
          
          <Box>
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
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
          {/* Formulaire d impression */}
          <Box>
            <Card sx={{ height: 'fit-content', transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: '#9c27b020', color: '#9c27b0' }}>
                    <LocalOffer />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Configuration d&apos;impression
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paramétrez vos étiquettes DLC secondaires
                    </Typography>
                  </Box>
                </Box>
                
                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                    <Box>
                      <TextField
                        label="Date d'expiration"
                        type="date"
                        value={formData.expiry_date ? formData.expiry_date.split('T')[0] : ''}
                        onChange={(e) => setFormData({...formData, expiry_date: new Date(e.target.value).toISOString()})}
                        required
                        fullWidth
                        slotProps={{
                          inputLabel: { shrink: true }
                        }}
                      />
                    </Box>
                    
                    <Box>
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
                    </Box>
                    
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <FormControl fullWidth>
                        <InputLabel>Type d&apos;étiquette</InputLabel>
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
                    </Box>

                    {/* Alertes d urgence */}
                    {previewData.urgencyLevel === 'high' && (
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Alert severity="error">
                          <strong>Attention :</strong> Date d&apos;expiration très proche ou dépassée
                        </Alert>
                      </Box>
                    )}
                    
                    {previewData.urgencyLevel === 'medium' && (
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Alert severity="warning">
                          <strong>À surveiller :</strong> Date d&apos;expiration dans moins d&apos;une semaine
                        </Alert>
                      </Box>
                    )}
                  </Box>
                  
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
          </Box>
          
          {/* Aperçu de l'étiquette */}
          <Box>
            <Card sx={{ height: 'fit-content', transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
                    <Preview />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Aperçu de l&apos;Étiquette
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
          </Box>
        </Box>

        {/* Modal Guide */}
        <Dialog 
          open={guideModalOpen} 
          onClose={() => setGuideModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            pb: 2
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
            <IconButton onClick={() => setGuideModalOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
              Procédure interne – Gestion des DLC secondaires
            </Typography>

            <Stack spacing={4}>
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'info.main' }}>
                  1️⃣ Définitions
                </Typography>
                <Stack spacing={1} sx={{ pl: 2 }}>
                  <Typography variant="body2"><strong>DLC (Date Limite de Consommation) :</strong> Date au-delà de laquelle le produit ne doit plus être consommé.</Typography>
                  <Typography variant="body2"><strong>DLC secondaire :</strong> Date limite après ouverture, transformation ou préparation d&apos;un produit.</Typography>
                  <Typography variant="body2"><strong>J+X :</strong> Nombre de jours après la transformation ou l&apos;ouverture.</Typography>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
                  2️⃣ Règles générales
                </Typography>
                <Stack spacing={1} sx={{ pl: 2 }}>
                  <Typography variant="body2">• En l&apos;absence d&apos;analyse microbiologique, un produit transformé se conserve maximum 3 jours (J+3).</Typography>
                  <Typography variant="body2">• La DLC secondaire ne peut jamais dépasser la DLC initiale du produit.</Typography>
                  <Typography variant="body2">• Pour les produits ouverts, suivre strictement les recommandations du fabricant.</Typography>
                  <Typography variant="body2">• Tous les produits ouverts, déconditionnés, ou préparés doivent être étiquetés avec :</Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2">- Date de fabrication / ouverture</Typography>
                    <Typography variant="body2">- DLC secondaire</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'warning.main' }}>
                    ⚠️ Écrire uniquement la date du jour n&apos;est pas suffisant.
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'secondary.main' }}>
                  3️⃣ Bonnes pratiques par catégorie
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Catégorie</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>DLC secondaire</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Viande hachée destinée à la cuisson</Typography>
                      <Typography variant="body2">J+1</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Charcuterie crue ou cuite tranchée sur place</Typography>
                      <Typography variant="body2">Jour J</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Produits de la mer crus</Typography>
                      <Typography variant="body2">J+1</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Ovo-produits (œufs liquides, etc.)</Typography>
                      <Typography variant="body2">J+1 à J+2</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Mayonnaise maison</Typography>
                      <Typography variant="body2">Jour J</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
                  4️⃣ Interdictions
                </Typography>
                <Stack spacing={1} sx={{ pl: 2 }}>
                  <Typography variant="body2">❌ Ne jamais cuire ou surgeler un produit dont la DLC secondaire est dépassée.</Typography>
                  <Typography variant="body2">❌ Ne pas prolonger la durée de vie d&apos;un produit par une nouvelle transformation.</Typography>
                  <Typography variant="body2">❌ Ne pas conserver un produit transformé, décongelé ou déconditionné au-delà de sa DLC secondaire.</Typography>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'warning.main' }}>
                  5️⃣ Assemblage de plusieurs produits
                </Typography>
                <Typography variant="body2" sx={{ pl: 2 }}>
                  En cas de mélange, c&apos;est la DLC secondaire la plus courte qui s&apos;applique, même si c&apos;est un seul ingrédient parmi plusieurs.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'info.main' }}>
                  6️⃣ Contrôles et suivi
                </Typography>
                <Stack spacing={1} sx={{ pl: 2 }}>
                  <Typography variant="body2">• Utiliser des étiquettes claires (imprimées ou manuscrites lisibles).</Typography>
                  <Typography variant="body2">• Noter jour/mois/année et heure si nécessaire.</Typography>
                  <Typography variant="body2">• Effectuer un contrôle quotidien des DLC secondaires en stock.</Typography>
                  <Typography variant="body2">• Retirer immédiatement tout produit dont la DLC secondaire est dépassée.</Typography>
                </Stack>
              </Box>

              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', mt: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  💡 Rappel : Le respect des DLC secondaires est essentiel pour garantir la sécurité alimentaire et éviter les risques de contamination microbiologique.
                </Typography>
              </Paper>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGuideModalOpen(false)} variant="contained">
              Compris
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}