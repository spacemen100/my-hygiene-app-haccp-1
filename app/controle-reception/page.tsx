"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';
import {
  CameraAlt,
  CheckCircle,
  Cancel,
  Description,
  LocalShipping,
  Add,
  Close,
  CloudUpload,
  ExpandMore,
  Edit,
  Delete,
} from '@mui/icons-material';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type Delivery = TablesInsert<'deliveries'> & {
  supplier?: {
    name: string;
    contact_person: string;
  };
  temperature_controls?: any[];
  non_conformities?: any[];
};

export default function DeliveryComponent() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDelivery, setNewDelivery] = useState<Partial<Delivery>>({
    delivery_date: new Date().toISOString(),
    is_compliant: true,
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [expandedDelivery, setExpandedDelivery] = useState<string | false>(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchDeliveries();
    fetchSuppliers();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`*, 
          supplier:suppliers(name, contact_person),
          temperature_controls:truck_temperature_controls(*),
          non_conformities:non_conformities(*)`)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      enqueueSnackbar('Impossible de charger les livraisons', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      enqueueSnackbar('Impossible de charger les fournisseurs', { variant: 'error' });
    }
  };

  const handleCreateDelivery = async () => {
    if (!newDelivery.supplier_id || !newDelivery.delivery_date) {
      enqueueSnackbar('Veuillez remplir tous les champs obligatoires', { variant: 'warning' });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .insert([{
          ...newDelivery,
          organization_id: 'your-organization-id',
          user_id: 'current-user-id',
        }])
        .select();

      if (error) throw error;

      enqueueSnackbar('Livraison enregistrée avec succès', { 
        variant: 'success',
        autoHideDuration: 3000,
      });

      setNewDelivery({
        delivery_date: new Date().toISOString(),
        is_compliant: true,
      });
      setOpenDialog(false);
      fetchDeliveries();
    } catch (error) {
      console.error('Error creating delivery:', error);
      enqueueSnackbar('Impossible de créer la livraison', { 
        variant: 'error',
        autoHideDuration: 4000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(filePath);

      setNewDelivery({ ...newDelivery, photo_url: publicUrl });
      enqueueSnackbar('Photo téléchargée avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Error uploading photo:', error);
      enqueueSnackbar('Impossible de télécharger la photo', { variant: 'error' });
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      enqueueSnackbar('Livraison supprimée avec succès', { variant: 'success' });
      fetchDeliveries();
    } catch (error) {
      console.error('Error deleting delivery:', error);
      enqueueSnackbar('Impossible de supprimer la livraison', { variant: 'error' });
    }
  };

  const handleExpandDelivery = (deliveryId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedDelivery(isExpanded ? deliveryId : false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping fontSize="large" />
          Gestion des Livraisons
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{ ml: 'auto' }}
        >
          Nouvelle Livraison
        </Button>
      </Box>

      {/* New Delivery Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.12)',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" />
            <Typography variant="h6">Nouvelle Livraison</Typography>
          </Box>
          <IconButton onClick={() => setOpenDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3,
            mb: 3
          }}>
            <FormControl fullWidth>
              <InputLabel id="supplier-label">Fournisseur *</InputLabel>
              <Select
                labelId="supplier-label"
                value={newDelivery.supplier_id || ''}
                label="Fournisseur"
                onChange={(e) => setNewDelivery({ ...newDelivery, supplier_id: e.target.value as string })}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Date de livraison *"
              value={newDelivery.delivery_date ? new Date(newDelivery.delivery_date) : null}
              onChange={(date) =>
                setNewDelivery({
                  ...newDelivery,
                  delivery_date: date ? date.toISOString() : '',
                })
              }
              renderInput={(params) => <TextField {...params} fullWidth />}
            />

            <TextField
              label="Numéro de livraison"
              value={newDelivery.delivery_number || ''}
              onChange={(e) =>
                setNewDelivery({ ...newDelivery, delivery_number: e.target.value })
              }
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="compliance-label">Conformité</InputLabel>
              <Select
                labelId="compliance-label"
                value={newDelivery.is_compliant ? 'true' : 'false'}
                label="Conformité"
                onChange={(e) =>
                  setNewDelivery({ ...newDelivery, is_compliant: e.target.value === 'true' })
                }
              >
                <MenuItem value="true">Conforme</MenuItem>
                <MenuItem value="false">Non conforme</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Commentaires"
              value={newDelivery.comments || ''}
              onChange={(e) =>
                setNewDelivery({ ...newDelivery, comments: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
              sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}
            />

            <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="delivery-photo-upload"
                type="file"
                onChange={handleUploadPhoto}
              />
              <label htmlFor="delivery-photo-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  {newDelivery.photo_url ? 'Photo sélectionnée' : 'Ajouter une photo'}
                </Button>
              </label>
              {newDelivery.photo_url && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Photo prête à être enregistrée
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid rgba(0,0,0,0.12)',
          px: 3,
          py: 2
        }}>
          <Button 
            onClick={() => setOpenDialog(false)} 
            color="inherit"
            sx={{ mr: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateDelivery}
            color="primary"
            variant="contained"
            disabled={isCreating}
            startIcon={isCreating ? <CircularProgress size={20} /> : null}
          >
            {isCreating ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deliveries List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : deliveries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Aucune livraison enregistrée
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{ mt: 2 }}
          >
            Créer une livraison
          </Button>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2 
        }}>
          {deliveries.map((delivery) => (
            <Accordion
              key={delivery.id}
              expanded={expandedDelivery === delivery.id}
              onChange={handleExpandDelivery(delivery.id)}
              elevation={3}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  backgroundColor: expandedDelivery === delivery.id ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <Box sx={{ 
                  width: '100%', 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr', md: '1.5fr 1fr 1fr 1fr 0.5fr' },
                  gap: 1,
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography variant="subtitle1" noWrap>
                      {delivery.supplier?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(delivery.delivery_date), 'PPPp', { locale: fr })}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" noWrap>
                    {delivery.delivery_number || 'N/A'}
                  </Typography>
                  
                  <Box>
                    {delivery.is_compliant ? (
                      <Chip 
                        label="Conforme" 
                        color="success" 
                        size="small" 
                        icon={<CheckCircle fontSize="small" />}
                      />
                    ) : (
                      <Chip 
                        label="Non conforme" 
                        color="error" 
                        size="small" 
                        icon={<Cancel fontSize="small" />}
                      />
                    )}
                  </Box>
                  
                  <Box>
                    {delivery.photo_url ? (
                      <Button
                        href={delivery.photo_url}
                        target="_blank"
                        rel="noopener"
                        size="small"
                        startIcon={<CameraAlt fontSize="small" />}
                      >
                        Voir photo
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        Aucune photo
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    gap: 1
                  }}>
                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDelivery(delivery.id);
                        }}
                      >
                        <Delete fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ 
                borderTop: '1px solid rgba(0,0,0,0.12)',
                pt: 2
              }}>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3
                }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Détails de la livraison
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Fournisseur:
                        </Typography>
                        <Typography variant="body1">
                          {delivery.supplier?.name}
                        </Typography>
                        <Typography variant="body2">
                          {delivery.supplier?.contact_person}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Commentaires:
                        </Typography>
                        <Typography variant="body1">
                          {delivery.comments || 'Aucun commentaire'}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                      <Button 
                        size="small"
                        startIcon={<Edit fontSize="small" />}
                      >
                        Modifier
                      </Button>
                    </CardActions>
                  </Card>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Contrôles associés
                    </Typography>
                    
                    {delivery.temperature_controls?.length ? (
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            Température camion:
                          </Typography>
                          {delivery.temperature_controls.map((control) => (
                            <Box key={control.id} sx={{ mt: 1 }}>
                              <Typography variant="body1">
                                {control.truck_temperature}°C ({control.storage_type})
                              </Typography>
                              <Typography variant="body2">
                                {control.is_compliant ? 'Conforme' : 'Non conforme'}
                              </Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    ) : null}
                    
                    {delivery.non_conformities?.length ? (
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            Non-conformités:
                          </Typography>
                          {delivery.non_conformities.map((nc) => (
                            <Box key={nc.id} sx={{ mt: 1 }}>
                              <Typography variant="body1">
                                {nc.product_name} - {nc.non_conformity_type}
                              </Typography>
                              <Typography variant="body2">
                                {nc.description}
                              </Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    ) : null}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
}