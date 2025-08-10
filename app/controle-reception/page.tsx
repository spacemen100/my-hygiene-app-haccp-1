'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Snackbar,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Assignment as ClipboardCheck,
  Photo as PhotoIcon,
  Save as SaveIcon,
  ArrowBack,
} from '@mui/icons-material';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types basés sur le schéma de base de données
interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

interface DeliveryFormData {
  supplier_id: string;
  delivery_number: string;
  delivery_date: string;
  comments: string;
  photo_url?: string;
}

interface TruckTemperatureControl {
  truck_temperature: number;
  storage_type: string;
  is_compliant: boolean;
}

interface ProductReceptionControl {
  product_name: string;
  temperature?: number;
  storage_type: string;
  is_compliant: boolean;
  best_before_date?: string;
  use_by_date?: string;
}

interface NonConformity {
  product_name: string;
  non_conformity_type: string;
  quantity?: number;
  quantity_type?: string;
  description?: string;
  other_cause?: string;
  photo_url?: string;
}

const steps = [
  'Informations générales',
  'Contrôle température camion',
  'Contrôle produits',
  'Non-conformités (optionnel)',
];

export default function NouveauControleReceptionPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // États des formulaires
  const [deliveryData, setDeliveryData] = useState<DeliveryFormData>({
    supplier_id: '',
    delivery_number: '',
    delivery_date: new Date().toISOString().split('T')[0],
    comments: '',
  });

  const [truckControl, setTruckControl] = useState<TruckTemperatureControl>({
    truck_temperature: 0,
    storage_type: 'refrigerator',
    is_compliant: true,
  });

  const [productControls, setProductControls] = useState<ProductReceptionControl[]>([
    {
      product_name: '',
      storage_type: 'refrigerator',
      is_compliant: true,
    },
  ]);

  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);
  const [hasNonConformities, setHasNonConformities] = useState(false);

  // Charger les fournisseurs
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setSuppliers(data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des fournisseurs:', err);
        setError('Erreur lors du chargement des fournisseurs');
      }
    };

    fetchSuppliers();
  }, [supabase, router]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const addProductControl = () => {
    setProductControls([
      ...productControls,
      {
        product_name: '',
        storage_type: 'refrigerator',
        is_compliant: true,
      },
    ]);
  };

  const removeProductControl = (index: number) => {
    setProductControls(productControls.filter((_, i) => i !== index));
  };

  const addNonConformity = () => {
    setNonConformities([
      ...nonConformities,
      {
        product_name: '',
        non_conformity_type: 'temperature',
        description: '',
      },
    ]);
  };

  const removeNonConformity = (index: number) => {
    setNonConformities(nonConformities.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Utilisateur non authentifié');
      }

      // 1. Créer la livraison
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          ...deliveryData,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      // 2. Créer le contrôle température camion
      const { error: truckError } = await supabase
        .from('truck_temperature_controls')
        .insert({
          ...truckControl,
          delivery_id: delivery.id,
          control_date: new Date().toISOString(),
        });

      if (truckError) throw truckError;

      // 3. Créer les contrôles produits
      for (const productControl of productControls) {
        if (productControl.product_name.trim()) {
          const { error: productError } = await supabase
            .from('product_reception_controls')
            .insert({
              ...productControl,
              delivery_id: delivery.id,
              control_date: new Date().toISOString(),
            });

          if (productError) throw productError;
        }
      }

      // 4. Créer les non-conformités si nécessaire
      if (hasNonConformities && nonConformities.length > 0) {
        for (const nonConformity of nonConformities) {
          if (nonConformity.product_name.trim()) {
            const { error: ncError } = await supabase
              .from('non_conformities')
              .insert({
                ...nonConformity,
                delivery_id: delivery.id,
              });

            if (ncError) throw ncError;
          }
        }
      }

      setSuccess('Contrôle à réception enregistré avec succès !');
      setTimeout(() => {
        router.push('/controle-reception');
      }, 2000);

    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l&apos;enregistrement du contrôle');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth required>
              <InputLabel>Fournisseur</InputLabel>
              <Select
                value={deliveryData.supplier_id}
                onChange={(e) => setDeliveryData({ ...deliveryData, supplier_id: e.target.value })}
                label="Fournisseur"
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Numéro de bon de livraison"
              value={deliveryData.delivery_number}
              onChange={(e) => setDeliveryData({ ...deliveryData, delivery_number: e.target.value })}
              required
            />

            <TextField
              fullWidth
              label="Date et heure de livraison"
              type="datetime-local"
              value={deliveryData.delivery_date}
              onChange={(e) => setDeliveryData({ ...deliveryData, delivery_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              fullWidth
              label="Commentaires"
              multiline
              rows={3}
              value={deliveryData.comments}
              onChange={(e) => setDeliveryData({ ...deliveryData, comments: e.target.value })}
              placeholder="Observations générales sur la livraison..."
            />

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PhotoIcon />}
                onClick={() => {
                  // TODO: Implémenter upload photo
                  alert('Fonctionnalité photo à implémenter');
                }}
              >
                Ajouter une photo
              </Button>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contrôle température du camion
            </Typography>

            <TextField
              fullWidth
              label="Température du camion (°C)"
              type="number"
              value={truckControl.truck_temperature}
              onChange={(e) => setTruckControl({ ...truckControl, truck_temperature: parseFloat(e.target.value) })}
              inputProps={{ step: 0.1 }}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Type de stockage</InputLabel>
              <Select
                value={truckControl.storage_type}
                onChange={(e) => setTruckControl({ ...truckControl, storage_type: e.target.value })}
                label="Type de stockage"
              >
                <MenuItem value="refrigerator">Réfrigérateur (+2°C à +8°C)</MenuItem>
                <MenuItem value="freezer">Congélateur (-18°C)</MenuItem>
                <MenuItem value="dry">Sec (température ambiante)</MenuItem>
                <MenuItem value="hot">Chaud (+63°C)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={truckControl.is_compliant}
                  onChange={(e) => setTruckControl({ ...truckControl, is_compliant: e.target.checked })}
                />
              }
              label="Température conforme"
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Contrôle des produits</Typography>
              <Button variant="outlined" onClick={addProductControl}>
                Ajouter un produit
              </Button>
            </Box>

            {productControls.map((product, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">Produit {index + 1}</Typography>
                      {productControls.length > 1 && (
                        <Button size="small" color="error" onClick={() => removeProductControl(index)}>
                          Supprimer
                        </Button>
                      )}
                    </Box>

                    <TextField
                      fullWidth
                      label="Nom du produit"
                      value={product.product_name}
                      onChange={(e) => {
                        const newProducts = [...productControls];
                        newProducts[index].product_name = e.target.value;
                        setProductControls(newProducts);
                      }}
                      required
                    />

                    <TextField
                      fullWidth
                      label="Température mesurée (°C)"
                      type="number"
                      value={product.temperature || ''}
                      onChange={(e) => {
                        const newProducts = [...productControls];
                        newProducts[index].temperature = e.target.value ? parseFloat(e.target.value) : undefined;
                        setProductControls(newProducts);
                      }}
                      inputProps={{ step: 0.1 }}
                    />

                    <FormControl fullWidth>
                      <InputLabel>Type de stockage</InputLabel>
                      <Select
                        value={product.storage_type}
                        onChange={(e) => {
                          const newProducts = [...productControls];
                          newProducts[index].storage_type = e.target.value;
                          setProductControls(newProducts);
                        }}
                        label="Type de stockage"
                      >
                        <MenuItem value="refrigerator">Réfrigérateur</MenuItem>
                        <MenuItem value="freezer">Congélateur</MenuItem>
                        <MenuItem value="dry">Sec</MenuItem>
                        <MenuItem value="hot">Chaud</MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Date limite de consommation"
                        type="date"
                        value={product.use_by_date || ''}
                        onChange={(e) => {
                          const newProducts = [...productControls];
                          newProducts[index].use_by_date = e.target.value;
                          setProductControls(newProducts);
                        }}
                        InputLabelProps={{ shrink: true }}
                      />

                      <TextField
                        label="Date limite d&apos;utilisation optimale"
                        type="date"
                        value={product.best_before_date || ''}
                        onChange={(e) => {
                          const newProducts = [...productControls];
                          newProducts[index].best_before_date = e.target.value;
                          setProductControls(newProducts);
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={product.is_compliant}
                          onChange={(e) => {
                            const newProducts = [...productControls];
                            newProducts[index].is_compliant = e.target.checked;
                            setProductControls(newProducts);
                          }}
                        />
                      }
                      label="Produit conforme"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={hasNonConformities}
                  onChange={(e) => {
                    setHasNonConformities(e.target.checked);
                    if (!e.target.checked) {
                      setNonConformities([]);
                    }
                  }}
                />
              }
              label="Des non-conformités ont été détectées"
            />

            {hasNonConformities && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Non-conformités</Typography>
                  <Button variant="outlined" onClick={addNonConformity}>
                    Ajouter une non-conformité
                  </Button>
                </Box>

                {nonConformities.map((nc, index) => (
                  <Card key={index} variant="outlined" sx={{ borderColor: 'error.main' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" color="error">
                            Non-conformité {index + 1}
                          </Typography>
                          <Button size="small" color="error" onClick={() => removeNonConformity(index)}>
                            Supprimer
                          </Button>
                        </Box>

                        <TextField
                          fullWidth
                          label="Produit concerné"
                          value={nc.product_name}
                          onChange={(e) => {
                            const newNCs = [...nonConformities];
                            newNCs[index].product_name = e.target.value;
                            setNonConformities(newNCs);
                          }}
                          required
                        />

                        <FormControl fullWidth>
                          <InputLabel>Type de non-conformité</InputLabel>
                          <Select
                            value={nc.non_conformity_type}
                            onChange={(e) => {
                              const newNCs = [...nonConformities];
                              newNCs[index].non_conformity_type = e.target.value;
                              setNonConformities(newNCs);
                            }}
                            label="Type de non-conformité"
                          >
                            <MenuItem value="temperature">Température</MenuItem>
                            <MenuItem value="packaging">Emballage</MenuItem>
                            <MenuItem value="expiry_date">Date de péremption</MenuItem>
                            <MenuItem value="quality">Qualité</MenuItem>
                            <MenuItem value="hygiene">Hygiène</MenuItem>
                            <MenuItem value="documentation">Documentation</MenuItem>
                            <MenuItem value="other">Autre</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          label="Description détaillée"
                          multiline
                          rows={3}
                          value={nc.description || ''}
                          onChange={(e) => {
                            const newNCs = [...nonConformities];
                            newNCs[index].description = e.target.value;
                            setNonConformities(newNCs);
                          }}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <TextField
                            label="Quantité"
                            type="number"
                            value={nc.quantity || ''}
                            onChange={(e) => {
                              const newNCs = [...nonConformities];
                              newNCs[index].quantity = e.target.value ? parseFloat(e.target.value) : undefined;
                              setNonConformities(newNCs);
                            }}
                          />

                          <TextField
                            label="Unité"
                            value={nc.quantity_type || ''}
                            onChange={(e) => {
                              const newNCs = [...nonConformities];
                              newNCs[index].quantity_type = e.target.value;
                              setNonConformities(newNCs);
                            }}
                            placeholder="kg, pièces, litres..."
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        );

      default:
        return 'Étape inconnue';
    }
  };

  if (loading && suppliers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <ClipboardCheck />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Nouveau contrôle à réception
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Enregistrement d&apos;un nouveau contrôle qualité
            </Typography>
          </Box>
        </Box>
        
        <Button
          component={Link}
          href="/controle-reception"
          startIcon={<ArrowBack />}
          sx={{ color: 'white', borderColor: 'white' }}
          variant="outlined"
        >
          Retour à la liste
        </Button>
      </Paper>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Précédent
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer le contrôle'}
              </Button>
            ) : (
              <Button onClick={handleNext} variant="contained">
                Suivant
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Snackbars pour les messages */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}