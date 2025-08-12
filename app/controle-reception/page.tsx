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
  Delete,
  Thermostat,
  Warning,
  Inventory,
  Save,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  List,
  ListItem,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Badge,
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
  product_controls?: TablesInsert<'product_reception_controls'>[];
  non_conformities?: TablesInsert<'non_conformities'>[];
};

type ControlStep = 'delivery' | 'truck' | 'products' | 'validation';

const storageTypes = [
  { value: 'ambiant', label: 'Ambiant' },
  { value: 'frais', label: 'Frais (0°C à +4°C)' },
  { value: 'surgelé', label: 'Surgelé (-18°C ou moins)' },
];

const nonConformityTypes = [
  'Température non conforme',
  'Date de péremption dépassée',
  'Emballage défectueux',
  'Produit endommagé',
  'Quantité incorrecte',
  'Étiquetage manquant',
  'Autre'
];

const quantityTypes = ['kg', 'g', 'L', 'mL', 'pièce(s)', 'lot(s)', 'carton(s)'];

export default function DeliveryComponent() {
  const { user } = useAuth();
  const { employee } = useEmployee();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<TablesInsert<'suppliers'>[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState<string | false>(false);
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState<ControlStep>('delivery');
  const [completedSteps, setCompletedSteps] = useState<Record<ControlStep, boolean>>({
    delivery: false,
    truck: false,
    products: false,
    validation: false,
  });

  // Form states
  const [deliveryData, setDeliveryData] = useState<Partial<Delivery>>({
    delivery_date: new Date().toISOString(),
    is_compliant: true,
  });
  const [truckControls, setTruckControls] = useState<TablesInsert<'truck_temperature_controls'>[]>([
    { storage_type: 'frais', truck_temperature: 0, is_compliant: false, control_date: new Date().toISOString() },
    { storage_type: 'surgelé', truck_temperature: 0, is_compliant: false, control_date: new Date().toISOString() },
  ]);
  const [productControls, setProductControls] = useState<TablesInsert<'product_reception_controls'>[]>([]);
  const [newProductControl, setNewProductControl] = useState<Partial<TablesInsert<'product_reception_controls'>>>({
    storage_type: 'ambiant',
    is_compliant: true,
    control_date: new Date().toISOString(),
  });
  const [nonConformities, setNonConformities] = useState<TablesInsert<'non_conformities'>[]>([]);
  const [newNonConformity, setNewNonConformity] = useState<Partial<TablesInsert<'non_conformities'>>>({
    non_conformity_type: '',
    quantity_type: 'kg',
  });

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`*, 
          supplier:suppliers(name, contact_person),
          temperature_controls:truck_temperature_controls(*),
          product_controls:product_reception_controls(*),
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

  const handleNextStep = () => {
    if (activeStep === 'delivery') setActiveStep('truck');
    else if (activeStep === 'truck') setActiveStep('products');
    else if (activeStep === 'products') setActiveStep('validation');
  };

  const handlePreviousStep = () => {
    if (activeStep === 'validation') setActiveStep('products');
    else if (activeStep === 'products') setActiveStep('truck');
    else if (activeStep === 'truck') setActiveStep('delivery');
  };

  const handleCompleteStep = (step: ControlStep) => {
    setCompletedSteps(prev => ({ ...prev, [step]: true }));
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, field: 'delivery' | 'product' | 'nonConformity') => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('🔄 Starting photo upload...');
    console.log('📁 File:', file.name, file.size, file.type);
    console.log('🧑‍💼 Current user:', user?.id, user?.email);
    console.log('👤 Current employee:', employee?.id, employee?.first_name, employee?.last_name);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('📤 Attempting upload to path:', filePath);
      console.log('🪣 Bucket: delivery-photos');

      const { error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        console.error('❌ Error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error
        });
        throw uploadError;
      }

      console.log('✅ Upload successful!');

      const { data: { publicUrl } } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL generated:', publicUrl);

      if (field === 'delivery') {
        setDeliveryData({ ...deliveryData, photo_url: publicUrl });
      } else if (field === 'nonConformity') {
        setNewNonConformity({ ...newNonConformity, photo_url: publicUrl });
      }

      console.log('💾 State updated for field:', field);
      enqueueSnackbar('Photo téléchargée avec succès', { variant: 'success' });
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      enqueueSnackbar('Impossible de télécharger la photo', { variant: 'error' });
    }
  };

  const handleAddProductControl = () => {
    if (!newProductControl.product_name || !newProductControl.storage_type) {
      enqueueSnackbar('Veuillez remplir les champs obligatoires', { variant: 'warning' });
      return;
    }

    // Check temperature compliance based on storage type
    let isCompliant = newProductControl.is_compliant;
    if (newProductControl.storage_type === 'frais' && newProductControl.temperature !== null && newProductControl.temperature !== undefined) {
      isCompliant = newProductControl.temperature >= 0 && newProductControl.temperature <= 4;
    } else if (newProductControl.storage_type === 'surgelé' && newProductControl.temperature !== null && newProductControl.temperature !== undefined) {
      isCompliant = newProductControl.temperature <= -18;
    }

    const productToAdd: TablesInsert<'product_reception_controls'> = {
      ...newProductControl,
      product_name: newProductControl.product_name || '',
      storage_type: newProductControl.storage_type || 'ambiant',
      is_compliant: isCompliant || false,
      control_date: new Date().toISOString(),
    };

    setProductControls([...productControls, productToAdd]);
    setNewProductControl({
      storage_type: 'ambiant',
      is_compliant: true,
      control_date: new Date().toISOString(),
    });
  };

  const handleRemoveProductControl = (index: number) => {
    const updatedControls = [...productControls];
    updatedControls.splice(index, 1);
    setProductControls(updatedControls);
  };

  const handleAddNonConformity = () => {
    if (!newNonConformity.non_conformity_type || !newNonConformity.product_name) {
      enqueueSnackbar('Veuillez remplir les champs obligatoires', { variant: 'warning' });
      return;
    }

    const nonConformityToAdd: TablesInsert<'non_conformities'> = {
      ...newNonConformity,
      non_conformity_type: newNonConformity.non_conformity_type || '',
      product_name: newNonConformity.product_name || '',
      quantity: newNonConformity.quantity || null,
      quantity_type: newNonConformity.quantity_type || 'kg',
      description: newNonConformity.description || '',
    };

    setNonConformities([...nonConformities, nonConformityToAdd]);
    setNewNonConformity({
      non_conformity_type: '',
      quantity_type: 'kg',
    });
  };

  const handleRemoveNonConformity = (index: number) => {
    const updatedNonConformities = [...nonConformities];
    updatedNonConformities.splice(index, 1);
    setNonConformities(updatedNonConformities);
  };

  const handleTruckTemperatureChange = (index: number, field: string, value: string | number) => {
    const updatedControls = [...truckControls];
    
    // For temperature field, check compliance
    if (field === 'truck_temperature') {
      const temp = parseFloat(String(value));
      let isCompliant = false;
      
      if (updatedControls[index].storage_type === 'frais') {
        isCompliant = temp >= 0 && temp <= 4;
      } else if (updatedControls[index].storage_type === 'surgelé') {
        isCompliant = temp <= -18;
      }
      
      updatedControls[index] = {
        ...updatedControls[index],
        truck_temperature: isNaN(temp) ? 0 : temp,
        is_compliant: isCompliant,
      };
    } else {
      updatedControls[index] = {
        ...updatedControls[index],
        [field]: value,
      };
    }
    
    setTruckControls(updatedControls);
  };

  const handleCreateDelivery = async () => {
    if (!deliveryData.supplier_id || !deliveryData.delivery_date) {
      enqueueSnackbar('Veuillez remplir tous les champs obligatoires', { variant: 'warning' });
      return;
    }

    setIsCreating(true);
    try {
      // Start transaction
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert([{
          ...deliveryData,
          organization_id: employee?.organization_id || null,
          user_id: user?.id || null,
          employee_id: employee?.id || null,
          is_compliant: truckControls.every(c => c.is_compliant) && 
                        productControls.every(p => p.is_compliant) && 
                        nonConformities.length === 0,
        }])
        .select()
        .single();

      if (deliveryError || !delivery) throw deliveryError || new Error('No delivery returned');

      // Insert truck temperature controls
      if (truckControls.length > 0) {
        const { error: truckError } = await supabase
          .from('truck_temperature_controls')
          .insert(truckControls.map(control => ({
            ...control,
            delivery_id: delivery.id,
            employee_id: employee?.id || null,
            user_id: user?.id || null,
          })));

        if (truckError) throw truckError;
      }

      // Insert product controls
      if (productControls.length > 0) {
        const { error: productError } = await supabase
          .from('product_reception_controls')
          .insert(productControls.map(control => ({
            ...control,
            delivery_id: delivery.id,
            employee_id: employee?.id || null,
            user_id: user?.id || null,
          })));

        if (productError) throw productError;
      }

      // Insert non-conformities
      if (nonConformities.length > 0) {
        const { error: ncError } = await supabase
          .from('non_conformities')
          .insert(nonConformities.map(nc => ({
            ...nc,
            delivery_id: delivery.id,
            employee_id: employee?.id || null,
            user_id: user?.id || null,
          })));

        if (ncError) throw ncError;
      }

      enqueueSnackbar('Livraison enregistrée avec succès', { 
        variant: 'success',
        autoHideDuration: 3000,
      });

      // Reset all form states
      setDeliveryData({
        delivery_date: new Date().toISOString(),
        is_compliant: true,
      });
      setTruckControls([
        { storage_type: 'frais', truck_temperature: 0, is_compliant: false, control_date: new Date().toISOString() },
        { storage_type: 'surgelé', truck_temperature: 0, is_compliant: false, control_date: new Date().toISOString() },
      ]);
      setProductControls([]);
      setNonConformities([]);
      setActiveStep('delivery');
      setCompletedSteps({
        delivery: false,
        truck: false,
        products: false,
        validation: false,
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

  const handleDeleteDelivery = async (id: string) => {
    try {
      // First delete all related records
      await supabase.from('truck_temperature_controls').delete().eq('delivery_id', id);
      await supabase.from('product_reception_controls').delete().eq('delivery_id', id);
      await supabase.from('non_conformities').delete().eq('delivery_id', id);
      
      // Then delete the delivery
      const { error } = await supabase.from('deliveries').delete().eq('id', id);

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

  // Calculate overall compliance for the current delivery in progress
  const isDeliveryCompliant = 
    truckControls.every(c => c.is_compliant) && 
    productControls.every(p => p.is_compliant) && 
    nonConformities.length === 0;

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
          {/* Stepper */}
          <Stepper activeStep={activeStep === 'delivery' ? 0 : 
                              activeStep === 'truck' ? 1 : 
                              activeStep === 'products' ? 2 : 3} 
                  sx={{ mb: 3 }}>
            <Step completed={completedSteps.delivery}>
              <StepLabel>Information Livraison</StepLabel>
            </Step>
            <Step completed={completedSteps.truck}>
              <StepLabel>Température Camion</StepLabel>
            </Step>
            <Step completed={completedSteps.products}>
              <StepLabel>Contrôle Produits</StepLabel>
            </Step>
            <Step completed={completedSteps.validation}>
              <StepLabel>Validation</StepLabel>
            </Step>
          </Stepper>
          
          {/* Delivery Information Step */}
          {activeStep === 'delivery' && (
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
                  value={deliveryData.supplier_id || ''}
                  label="Fournisseur"
                  onChange={(e) => setDeliveryData({ ...deliveryData, supplier_id: e.target.value as string })}
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
                value={deliveryData.delivery_date ? new Date(deliveryData.delivery_date) : null}
                onChange={(date) =>
                  setDeliveryData({
                    ...deliveryData,
                    delivery_date: date ? date.toISOString() : '',
                  })
                }
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />

              <TextField
                label="Numéro de livraison"
                value={deliveryData.delivery_number || ''}
                onChange={(e) =>
                  setDeliveryData({ ...deliveryData, delivery_number: e.target.value })
                }
                fullWidth
              />

              <TextField
                label="Commentaires"
                value={deliveryData.comments || ''}
                onChange={(e) =>
                  setDeliveryData({ ...deliveryData, comments: e.target.value })
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
                  onChange={(e) => handleUploadPhoto(e, 'delivery')}
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
                    {deliveryData.photo_url ? 'Photo sélectionnée' : 'Ajouter une photo de la livraison'}
                  </Button>
                </label>
                {deliveryData.photo_url && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Photo prête à être enregistrée
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          
          {/* Truck Temperature Control Step */}
          {activeStep === 'truck' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Contrôle des températures du camion
              </Typography>
              
              {truckControls.map((control, index) => (
                <Card key={index} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1">
                      {control.storage_type === 'frais' ? 'Zone Frais' : 'Zone Surgelé'}
                    </Typography>
                    
                    <TextField
                      label={`Température (°C) - ${control.storage_type === 'frais' ? '0°C à +4°C' : '-18°C ou moins'}`}
                      type="number"
                      value={control.truck_temperature || ''}
                      onChange={(e) => handleTruckTemperatureChange(index, 'truck_temperature', e.target.value)}
                      fullWidth
                      inputProps={{ step: "0.1" }}
                      error={control.truck_temperature !== 0 && !control.is_compliant}
                      helperText={control.truck_temperature !== 0 && !control.is_compliant ? 
                        `Température non conforme pour ${control.storage_type}` : ''}
                    />
                    
                    {control.truck_temperature !== 0 && (
                      <Alert 
                        severity={control.is_compliant ? "success" : "error"}
                        icon={control.is_compliant ? <CheckCircle /> : <Warning />}
                      >
                        {control.is_compliant ? 
                          "Température conforme" : 
                          "Température non conforme"}
                      </Alert>
                    )}
                  </Box>
                </Card>
              ))}
            </Box>
          )}
          
          {/* Product Control Step */}
          {activeStep === 'products' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6">
                Contrôle des produits
              </Typography>
              
              {/* Product Controls List */}
              {productControls.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {productControls.map((control, index) => (
                    <Card key={index} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle1">
                            {control.product_name}
                            <Chip 
                              label={control.is_compliant ? 'Conforme' : 'Non conforme'} 
                              size="small" 
                              color={control.is_compliant ? 'success' : 'error'}
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                          <Typography variant="body2">
                            Type: {control.storage_type === 'frais' ? 'Frais' : 
                                  control.storage_type === 'surgelé' ? 'Surgelé' : 'Ambiant'}
                            {control.temperature !== null && ` - Température: ${control.temperature}°C`}
                          </Typography>
                          {control.best_before_date && (
                            <Typography variant="body2">
                              DLC: {format(new Date(control.best_before_date), 'PPP', { locale: fr })}
                            </Typography>
                          )}
                          {control.use_by_date && (
                            <Typography variant="body2">
                              DDM: {format(new Date(control.use_by_date), 'PPP', { locale: fr })}
                            </Typography>
                          )}
                        </Box>
                        <IconButton onClick={() => handleRemoveProductControl(index)}>
                          <Delete color="error" />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
              
              {/* Add Product Control Form */}
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Ajouter un produit contrôlé
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Nom du produit *"
                    value={newProductControl.product_name || ''}
                    onChange={(e) => setNewProductControl({...newProductControl, product_name: e.target.value})}
                    fullWidth
                  />
                  
                  <FormControl fullWidth>
                    <InputLabel>Type de stockage *</InputLabel>
                    <Select
                      value={newProductControl.storage_type || 'ambiant'}
                      label="Type de stockage *"
                      onChange={(e) => setNewProductControl({...newProductControl, storage_type: e.target.value as 'ambiant' | 'frais' | 'surgelé'})}
                    >
                      {storageTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {(newProductControl.storage_type === 'frais' || newProductControl.storage_type === 'surgelé') && (
                    <TextField
                      label={`Température (°C) * ${newProductControl.storage_type === 'frais' ? '(0°C à +4°C)' : '(-18°C ou moins)'}`}
                      type="number"
                      value={newProductControl.temperature || ''}
                      onChange={(e) => setNewProductControl({
                        ...newProductControl, 
                        temperature: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      fullWidth
                      inputProps={{ step: "0.1" }}
                    />
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <DatePicker
                      label="Date limite de consommation"
                      value={newProductControl.best_before_date ? new Date(newProductControl.best_before_date) : null}
                      onChange={(date) => setNewProductControl({
                        ...newProductControl, 
                        best_before_date: date ? date.toISOString() : undefined
                      })}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                    
                    <DatePicker
                      label="Date de durabilité minimale"
                      value={newProductControl.use_by_date ? new Date(newProductControl.use_by_date) : null}
                      onChange={(date) => setNewProductControl({
                        ...newProductControl, 
                        use_by_date: date ? date.toISOString() : undefined
                      })}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </Box>
                  
                  <Box>
                    
                    <FormControlLabel
                      control={
                        <RadioGroup
                          row
                          value={newProductControl.is_compliant ? 'true' : 'false'}
                          onChange={(e) => setNewProductControl({
                            ...newProductControl, 
                            is_compliant: e.target.value === 'true'
                          })}
                        >
                          <FormControlLabel value="true" control={<Radio />} label="Conforme" />
                          <FormControlLabel value="false" control={<Radio />} label="Non conforme" />
                        </RadioGroup>
                      }
                      label="Conformité:"
                      labelPlacement="start"
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    onClick={handleAddProductControl}
                    startIcon={<Add />}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Ajouter le produit
                  </Button>
                </Box>
              </Card>
              
              {/* Non-Conformities Section */}
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Signaler une non-conformité
                </Typography>
                
                {nonConformities.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Non-conformités signalées:
                    </Typography>
                    <List dense sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }}>
                      {nonConformities.map((nc, index) => (
                        <ListItem 
                          key={index} 
                          secondaryAction={
                            <IconButton edge="end" onClick={() => handleRemoveNonConformity(index)}>
                              <Delete color="error" />
                            </IconButton>
                          }
                        >
                          <ListItemText 
                            primary={`${nc.product_name} - ${nc.non_conformity_type}`}
                            secondary={nc.description?.substring(0, 50) + (nc.description && nc.description.length > 50 ? '...' : '')}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Type de non-conformité *</InputLabel>
                    <Select
                      value={newNonConformity.non_conformity_type || ''}
                      label="Type de non-conformité *"
                      onChange={(e) => setNewNonConformity({...newNonConformity, non_conformity_type: e.target.value})}
                    >
                      {nonConformityTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Nom du produit concerné *"
                    value={newNonConformity.product_name || ''}
                    onChange={(e) => setNewNonConformity({...newNonConformity, product_name: e.target.value})}
                    fullWidth
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Quantité"
                      type="number"
                      value={newNonConformity.quantity || ''}
                      onChange={(e) => setNewNonConformity({
                        ...newNonConformity, 
                        quantity: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      sx={{ flex: 2 }}
                    />
                    
                    <FormControl sx={{ flex: 1 }}>
                      <InputLabel>Unité</InputLabel>
                      <Select
                        value={newNonConformity.quantity_type || 'kg'}
                        label="Unité"
                        onChange={(e) => setNewNonConformity({...newNonConformity, quantity_type: e.target.value})}
                      >
                        {quantityTypes.map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <TextField
                    label="Description"
                    multiline
                    rows={3}
                    value={newNonConformity.description || ''}
                    onChange={(e) => setNewNonConformity({...newNonConformity, description: e.target.value})}
                    fullWidth
                    placeholder="Décrivez la non-conformité en détail..."
                  />
                  
                  {newNonConformity.non_conformity_type === 'Autre' && (
                    <TextField
                      label="Précisez la cause"
                      value={newNonConformity.other_cause || ''}
                      onChange={(e) => setNewNonConformity({...newNonConformity, other_cause: e.target.value})}
                      fullWidth
                    />
                  )}
                  
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="nonconformity-photo-upload"
                      type="file"
                      onChange={(e) => handleUploadPhoto(e, 'nonConformity')}
                    />
                    <label htmlFor="nonconformity-photo-upload">
                      <Button
                        component="span"
                        variant="outlined"
                        startIcon={<CameraAlt />}
                        sx={{ mr: 2 }}
                      >
                        {newNonConformity.photo_url ? 'Photo ajoutée' : 'Ajouter photo'}
                      </Button>
                    </label>
                    
                    <Button
                      variant="contained"
                      onClick={handleAddNonConformity}
                      startIcon={<Warning />}
                    >
                      Ajouter non-conformité
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Box>
          )}
          
          {/* Validation Step */}
          {activeStep === 'validation' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6">
                Validation de la livraison
              </Typography>
              
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Récapitulatif de la livraison
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" color="text.secondary">
                      Fournisseur:
                    </Typography>
                    <Typography variant="body1">
                      {suppliers.find(s => s.id === deliveryData.supplier_id)?.name || 'Non spécifié'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" color="text.secondary">
                      Date de livraison:
                    </Typography>
                    <Typography variant="body1">
                      {deliveryData.delivery_date ? format(new Date(deliveryData.delivery_date), 'PPPp', { locale: fr }) : 'Non spécifié'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" color="text.secondary">
                      Numéro de livraison:
                    </Typography>
                    <Typography variant="body1">
                      {deliveryData.delivery_number || 'Non spécifié'}
                    </Typography>
                  </Box>
                  
                  {deliveryData.photo_url && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" color="text.secondary">
                        Photo jointe:
                      </Typography>
                      <Button
                        href={deliveryData.photo_url}
                        target="_blank"
                        rel="noopener"
                        size="small"
                        startIcon={<CameraAlt />}
                      >
                        Voir photo
                      </Button>
                    </Box>
                  )}
                </Box>
              </Card>
              
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Contrôles température camion
                </Typography>
                
                {truckControls.length > 0 ? (
                  <List dense>
                    {truckControls.map((control, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Zone ${control.storage_type === 'frais' ? 'Frais' : 'Surgelé'}: ${control.truck_temperature}°C`}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {control.is_compliant ? (
                                <CheckCircle color="success" fontSize="small" />
                              ) : (
                                <Cancel color="error" fontSize="small" />
                              )}
                              <Typography variant="body2" color={control.is_compliant ? 'success.main' : 'error.main'}>
                                {control.is_compliant ? 'Conforme' : 'Non conforme'}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aucun contrôle de température enregistré
                  </Typography>
                )}
              </Card>
              
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Produits contrôlés ({productControls.length})
                </Typography>
                
                {productControls.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {productControls.map((control, index) => (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 1,
                        bgcolor: control.is_compliant ? 'action.hover' : 'error.light',
                        borderRadius: 1
                      }}>
                        <Typography variant="body2">
                          {control.product_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {control.temperature !== null && (
                            <Typography variant="body2">
                              {control.temperature}°C
                            </Typography>
                          )}
                          {control.is_compliant ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <Cancel color="error" fontSize="small" />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aucun produit contrôlé
                  </Typography>
                )}
              </Card>
              
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Non-conformités signalées ({nonConformities.length})
                </Typography>
                
                {nonConformities.length > 0 ? (
                  <List dense>
                    {nonConformities.map((nc, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${nc.product_name} - ${nc.non_conformity_type}`}
                          secondary={nc.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aucune non-conformité signalée
                  </Typography>
                )}
              </Card>
              
              <Alert 
                severity={isDeliveryCompliant ? "success" : "error"}
                icon={isDeliveryCompliant ? <CheckCircle /> : <Warning />}
                sx={{ mt: 2 }}
              >
                {isDeliveryCompliant ? 
                  "Livraison conforme - Prête à être enregistrée" : 
                  "Livraison non conforme - Vérifiez les éléments signalés"}
              </Alert>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          borderTop: '1px solid rgba(0,0,0,0.12)',
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          gap: { xs: 1, sm: 0 },
          justifyContent: 'space-between'
        }}>
          <Box>
            {activeStep !== 'delivery' && (
              <Button 
                onClick={handlePreviousStep}
                color="inherit"
                sx={{ mr: 1 }}
              >
                Retour
              </Button>
            )}
          </Box>
          
          <Box>
            {activeStep !== 'validation' ? (
              <Button
                onClick={() => {
                  handleCompleteStep(activeStep);
                  handleNextStep();
                }}
                variant="contained"
              >
                Suivant
              </Button>
            ) : (
              <Button
                onClick={handleCreateDelivery}
                variant="contained"
                color={isDeliveryCompliant ? "success" : "error"}
                disabled={isCreating}
                startIcon={isCreating ? <CircularProgress size={20} /> : <Save />}
              >
                {isCreating ? 'Enregistrement...' : 'Enregistrer la livraison'}
              </Button>
            )}
          </Box>
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
                  
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                    <Badge 
                      badgeContent={delivery.temperature_controls?.length || 0} 
                      color="primary"
                      showZero
                    >
                      <Thermostat color="action" />
                    </Badge>
                    <Badge 
                      badgeContent={delivery.product_controls?.length || 0} 
                      color="primary"
                      showZero
                    >
                      <Inventory color="action" />
                    </Badge>
                    <Badge 
                      badgeContent={delivery.non_conformities?.length || 0} 
                      color="error"
                      showZero
                    >
                      <Warning color="action" />
                    </Badge>
                  </Box>
                  
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
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Badge 
                          badgeContent={delivery.temperature_controls?.length || 0} 
                          color="primary"
                          showZero
                        >
                          <Thermostat color="action" />
                        </Badge>
                        <Badge 
                          badgeContent={delivery.product_controls?.length || 0} 
                          color="primary"
                          showZero
                        >
                          <Inventory color="action" />
                        </Badge>
                        <Badge 
                          badgeContent={delivery.non_conformities?.length || 0} 
                          color="error"
                          showZero
                        >
                          <Warning color="action" />
                        </Badge>
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
                  
                  {/* Delivery Details */}
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
                      
                      {delivery.photo_url && (
                        <Button
                          href={delivery.photo_url}
                          target="_blank"
                          rel="noopener"
                          size="small"
                          startIcon={<CameraAlt />}
                        >
                          Voir photo de la livraison
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Temperature Controls */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Températures camion
                      </Typography>
                      {delivery.temperature_controls?.length ? (
                        <List dense>
                          {delivery.temperature_controls.map((control, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={`Zone ${control.storage_type === 'frais' ? 'Frais' : 'Surgelé'}: ${control.truck_temperature}°C`}
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {control.is_compliant ? (
                                      <CheckCircle color="success" fontSize="small" />
                                    ) : (
                                      <Cancel color="error" fontSize="small" />
                                    )}
                                    <Typography variant="body2" color={control.is_compliant ? 'success.main' : 'error.main'}>
                                      {control.is_compliant ? 'Conforme' : 'Non conforme'}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Aucun contrôle de température enregistré
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Product Controls */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Produits contrôlés ({delivery.product_controls?.length || 0})
                      </Typography>
                      {delivery.product_controls?.length ? (
                        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                          {delivery.product_controls.map((control, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={control.product_name}
                                secondary={
                                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="body2">
                                      Type: {control.storage_type === 'frais' ? 'Frais' : 
                                            control.storage_type === 'surgelé' ? 'Surgelé' : 'Ambiant'}
                                      {control.temperature !== null && ` - Température: ${control.temperature}°C`}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {control.is_compliant ? (
                                        <CheckCircle color="success" fontSize="small" />
                                      ) : (
                                        <Cancel color="error" fontSize="small" />
                                      )}
                                      <Typography variant="body2" color={control.is_compliant ? 'success.main' : 'error.main'}>
                                        {control.is_compliant ? 'Conforme' : 'Non conforme'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Aucun produit contrôlé
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Non-Conformities */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Non-conformités ({delivery.non_conformities?.length || 0})
                      </Typography>
                      {delivery.non_conformities?.length ? (
                        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                          {delivery.non_conformities.map((nc, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={`${nc.product_name} - ${nc.non_conformity_type}`}
                                secondary={
                                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    {nc.description && (
                                      <Typography variant="body2">
                                        {nc.description}
                                      </Typography>
                                    )}
                                    {nc.quantity && (
                                      <Typography variant="body2">
                                        Quantité: {nc.quantity} {nc.quantity_type}
                                      </Typography>
                                    )}
                                    {nc.photo_url && (
                                      <Button
                                        href={nc.photo_url}
                                        target="_blank"
                                        rel="noopener"
                                        size="small"
                                        startIcon={<CameraAlt />}
                                        sx={{ mt: 1 }}
                                      >
                                        Voir photo
                                      </Button>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Aucune non-conformité signalée
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
}