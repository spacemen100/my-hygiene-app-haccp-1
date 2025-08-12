"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
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
  Avatar,
  useTheme,
  useMediaQuery,
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
  temperature_controls?: TablesInsert<'truck_temperature_controls'>[];
  non_conformities?: TablesInsert<'non_conformities'>[];
};

export default function DeliveryComponent() {
  const { user } = useAuth();
  const { employee } = useEmployee();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDelivery, setNewDelivery] = useState<Partial<Delivery>>({
    delivery_date: new Date().toISOString(),
    is_compliant: true,
  });
  const [suppliers, setSuppliers] = useState<TablesInsert<'suppliers'>[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState<string | false>(false);
  const { enqueueSnackbar } = useSnackbar();
  const { employee } = useEmployee();

  const fetchDeliveries = useCallback(async () => {
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
  }, [enqueueSnackbar]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      enqueueSnackbar('Impossible de charger les fournisseurs', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchDeliveries();
    fetchSuppliers();
  }, [fetchDeliveries, fetchSuppliers]);

  const handleCreateDelivery = async () => {
    if (!newDelivery.supplier_id || !newDelivery.delivery_date) {
      enqueueSnackbar('Veuillez remplir tous les champs obligatoires', { variant: 'warning' });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('deliveries')
        .insert([{
          ...newDelivery,
          organization_id: employee?.organization_id || null,
          user_id: user?.id || null,
          employee_id: employee?.id || null,
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

  const handleExpandDelivery = (deliveryId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedDelivery(isExpanded ? deliveryId : false);
  };

  return (
    <Box sx={{ 
      flexGrow: 1,
      width: '100%',
      maxWidth: { xs: '100vw', lg: '1400px' },
      mx: 'auto',
      px: { xs: 0, sm: 1, md: 2 }
    }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          p: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 0, sm: 2, md: 3 },
          mx: { xs: -1, sm: 0 },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 1 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                width: { xs: 56, md: 80 },
                height: { xs: 56, md: 80 },
              }}
            >
              <LocalShipping fontSize="large" />
            </Avatar>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  lineHeight: 1.2,
                  mb: 1
                }}
              >
                Gestion des Livraisons
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Contrôle qualité des réceptions
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: { xs: '0.875rem', md: '1rem' },
              px: { xs: 2, md: 3 },
              py: { xs: 1, md: 1.5 },
              minHeight: '44px',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Nouvelle </Box>Livraison
          </Button>
        </Box>
      </Paper>

      {/* New Delivery Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 0, sm: 3 },
            margin: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.12)',
          py: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" />
            <Typography 
              variant="h6"
              sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}
            >
              Nouvelle Livraison
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenDialog(false)}
            sx={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
            gap: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3 }
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
              slotProps={{
                textField: { fullWidth: true }
              }}
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
              sx={{ gridColumn: '1 / -1' }}
            />

            <Box sx={{ gridColumn: '1 / -1' }}>
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
                  sx={{ 
                    py: { xs: 1.5, sm: 2 },
                    minHeight: '44px'
                  }}
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
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          gap: { xs: 1, sm: 0 },
          flexDirection: { xs: 'column-reverse', sm: 'row' }
        }}>
          <Button 
            onClick={() => setOpenDialog(false)} 
            color="inherit"
            sx={{ 
              mr: { xs: 0, sm: 2 },
              minHeight: '44px',
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateDelivery}
            color="primary"
            variant="contained"
            disabled={isCreating}
            startIcon={isCreating ? <CircularProgress size={20} /> : null}
            sx={{
              minHeight: '44px',
              width: { xs: '100%', sm: 'auto' }
            }}
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
        <Paper sx={{ 
          p: { xs: 2, sm: 4 }, 
          textAlign: 'center',
          mx: { xs: -1, sm: 0 },
          borderRadius: { xs: 0, sm: 1 }
        }}>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}
          >
            Aucune livraison enregistrée
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              mt: 2,
              minHeight: '44px',
              px: { xs: 2, sm: 3 }
            }}
          >
            Créer une livraison
          </Button>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: { xs: 1.5, sm: 2 }
        }}>
          {deliveries.map((delivery) => (
            <Accordion
              key={delivery.id}
              expanded={expandedDelivery === delivery.id}
              onChange={delivery.id ? handleExpandDelivery(delivery.id) : undefined}
              elevation={3}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  backgroundColor: expandedDelivery === delivery.id ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  },
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 1 }
                }}
              >
                <Box sx={{ 
                  width: '100%', 
                  display: 'grid',
                  gridTemplateColumns: { 
                    xs: '1fr', 
                    sm: '2fr 1fr', 
                    md: '1.5fr 1fr 1fr 1fr 0.5fr' 
                  },
                  gap: { xs: 1, sm: 2 },
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        fontWeight: 600
                      }}
                      noWrap
                    >
                      {delivery.supplier?.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {format(new Date(delivery.delivery_date), 'PPPp', { locale: fr })}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      display: { xs: 'none', md: 'block' }
                    }}
                    noWrap
                  >
                    {delivery.delivery_number || 'N/A'}
                  </Typography>
                  
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {delivery.is_compliant ? (
                      <Chip 
                        label="Conforme" 
                        color="success" 
                        size="small" 
                        icon={<CheckCircle fontSize="small" />}
                        sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                      />
                    ) : (
                      <Chip 
                        label="Non conforme" 
                        color="error" 
                        size="small" 
                        icon={<Cancel fontSize="small" />}
                        sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    {delivery.photo_url ? (
                      <Button
                        href={delivery.photo_url}
                        target="_blank"
                        rel="noopener"
                        size="small"
                        startIcon={<CameraAlt fontSize="small" />}
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          minHeight: '32px'
                        }}
                      >
                        <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Voir </Box>Photo
                      </Button>
                    ) : (
                      <Typography 
                        variant="body2" 
                        color="text.disabled"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        Aucune photo
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ 
                    display: { xs: 'none', sm: 'flex' }, 
                    justifyContent: 'flex-end',
                    gap: 1
                  }}>
                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (delivery.id) handleDeleteDelivery(delivery.id);
                        }}
                        sx={{ minHeight: '40px', minWidth: '40px' }}
                      >
                        <Delete fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ 
                borderTop: '1px solid rgba(0,0,0,0.12)',
                pt: { xs: 1.5, sm: 2 },
                px: { xs: 1, sm: 2 }
              }}>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: { xs: 2, sm: 3 }
                }}>
                  
                  {/* Mobile-specific status and actions */}
                  <Box sx={{ 
                    display: { xs: 'block', sm: 'none' },
                    gridColumn: '1 / -1',
                    pb: 2,
                    borderBottom: '1px solid rgba(0,0,0,0.12)'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: 2
                    }}>
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
                        {delivery.photo_url && (
                          <Button
                            href={delivery.photo_url}
                            target="_blank"
                            rel="noopener"
                            size="small"
                            startIcon={<CameraAlt fontSize="small" />}
                            sx={{ ml: 1, fontSize: '0.75rem' }}
                          >
                            Photo
                          </Button>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (delivery.id) handleDeleteDelivery(delivery.id);
                        }}
                        sx={{ minHeight: '44px', minWidth: '44px' }}
                      >
                        <Delete fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  </Box>
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