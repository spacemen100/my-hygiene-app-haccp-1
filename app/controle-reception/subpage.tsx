"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  CameraAlt,
  CheckCircle,
  Cancel,
  Warning,
  Description,
  Thermostat,
  Inventory,
  Add,
  Delete,
  Close
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function DeliveryControlSystem() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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
        <Inventory fontSize="large" />
        Contrôle des Livraisons
      </Typography>
      
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab 
              icon={<Inventory />} 
              label="Produit Ambiant" 
              iconPosition="start" 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<Thermostat />} 
              label="Produit Frais" 
              iconPosition="start" 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<Thermostat />} 
              label="Produit Surgelé" 
              iconPosition="start" 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<Warning />} 
              label="Non-conformités" 
              iconPosition="start" 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<Description />} 
              label="Doc/Info" 
              iconPosition="start" 
              sx={{ minHeight: 64 }}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <AmbientProductControl />}
          {activeTab === 1 && <FreshProductControl />}
          {activeTab === 2 && <FrozenProductControl />}
          {activeTab === 3 && <NonConformitiesControl />}
          {activeTab === 4 && <DocInfoControl />}
        </Box>
      </Paper>
    </Container>
  );
};

// Composant pour contrôler un produit ambiant
const AmbientProductControl = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { employee } = useEmployee();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<TablesInsert<'product_reception_controls'>>>({
    product_name: '',
    storage_type: 'ambiant',
    best_before_date: undefined,
    use_by_date: undefined,
    is_compliant: false,
    control_date: new Date().toISOString()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('product_reception_controls')
        .insert([{
          ...formData,
          control_date: new Date().toISOString(),
          is_compliant: formData.is_compliant || false,
          employee_id: employee?.id || null,
          user_id: user?.id || null
        }]);
      
      if (error) throw error;
      enqueueSnackbar('Contrôle produit ambiant enregistré avec succès', { variant: 'success' });
      // Reset form
      setFormData({
        product_name: '',
        storage_type: 'ambiant',
        best_before_date: undefined,
        use_by_date: undefined,
        is_compliant: false,
        control_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'warning.main',
          mb: 3
        }}>
          <Inventory />
          Contrôle Produit Ambiant
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Nom du produit"
            value={formData.product_name}
            onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            required
            fullWidth
            variant="outlined"
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                label="Date limite de consommation"
                type="date"
                value={formData.best_before_date || ''}
                onChange={(e) => setFormData({...formData, best_before_date: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                label="Date de péremption"
                type="date"
                value={formData.use_by_date || ''}
                onChange={(e) => setFormData({...formData, use_by_date: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          <FormControl component="fieldset">
            <FormLabel component="legend">Conformité du produit *</FormLabel>
            <RadioGroup
              row
              value={formData.is_compliant}
              onChange={(e) => setFormData({...formData, is_compliant: e.target.value === 'true'})}
            >
              <FormControlLabel 
                value={true} 
                control={<Radio />} 
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircle color="success" />Conforme</Box>} 
              />
              <FormControlLabel 
                value={false} 
                control={<Radio />} 
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Cancel color="error" />Non conforme</Box>} 
              />
            </RadioGroup>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            sx={{ alignSelf: 'flex-start' }}
          >
            Prendre une photo
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 2 }}
          >
            Enregistrer le contrôle
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Composant pour contrôler un produit frais
const FreshProductControl = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { employee } = useEmployee();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<TablesInsert<'product_reception_controls'>>>({
    product_name: '',
    storage_type: 'frais',
    temperature: undefined,
    best_before_date: undefined,
    use_by_date: undefined,
    is_compliant: false,
    control_date: new Date().toISOString()
  });

  const isTemperatureCompliant = (temp: number) => {
    return temp >= 0 && temp <= 4;
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const temp = parseFloat(e.target.value);
    setFormData({
      ...formData, 
      temperature: !isNaN(temp) ? temp : undefined,
      is_compliant: !isNaN(temp) ? isTemperatureCompliant(temp) : false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('product_reception_controls')
        .insert([{
          ...formData,
          control_date: new Date().toISOString(),
          is_compliant: formData.is_compliant || false,
          employee_id: employee?.id || null,
          user_id: user?.id || null
        }]);
      
      if (error) throw error;
      enqueueSnackbar('Contrôle produit frais enregistré avec succès', { variant: 'success' });
      setFormData({
        product_name: '',
        storage_type: 'frais',
        temperature: undefined,
        best_before_date: undefined,
        use_by_date: undefined,
        is_compliant: false,
        control_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    }
  };

  return (
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
          Contrôle Produit Frais
        </Typography>
        
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
            label="Température (°C)"
            type="number"
            inputProps={{ step: "0.1" }}
            value={formData.temperature || ''}
            onChange={handleTemperatureChange}
            required
            fullWidth
            helperText="Température réglementaire : 0°C à 4°C"
            error={formData.temperature !== undefined && formData.temperature !== null && !isTemperatureCompliant(formData.temperature)}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                label="Date limite de consommation"
                type="date"
                value={formData.best_before_date || ''}
                onChange={(e) => setFormData({...formData, best_before_date: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                label="Date de péremption"
                type="date"
                value={formData.use_by_date || ''}
                onChange={(e) => setFormData({...formData, use_by_date: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          {formData.temperature !== undefined && formData.temperature !== null && (
            <Alert 
              severity={isTemperatureCompliant(formData.temperature) ? "success" : "error"}
              sx={{ mt: 1 }}
            >
              {isTemperatureCompliant(formData.temperature) 
                ? "Température conforme" 
                : "Température non conforme - doit être entre 0°C et 4°C"}
            </Alert>
          )}

          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            sx={{ alignSelf: 'flex-start' }}
          >
            Prendre une photo
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 2 }}
          >
            Enregistrer le contrôle
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Composant pour contrôler un produit surgelé
const FrozenProductControl = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { employee } = useEmployee();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<TablesInsert<'product_reception_controls'>>>({
    product_name: '',
    storage_type: 'surgelé',
    temperature: undefined,
    best_before_date: undefined,
    use_by_date: undefined,
    is_compliant: false,
    control_date: new Date().toISOString()
  });

  const isTemperatureCompliant = (temp: number) => {
    return temp <= -18;
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const temp = parseFloat(e.target.value);
    setFormData({
      ...formData, 
      temperature: !isNaN(temp) ? temp : undefined,
      is_compliant: !isNaN(temp) ? isTemperatureCompliant(temp) : false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('product_reception_controls')
        .insert([{
          ...formData,
          control_date: new Date().toISOString(),
          is_compliant: formData.is_compliant || false,
          employee_id: employee?.id || null,
          user_id: user?.id || null
        }]);
      
      if (error) throw error;
      enqueueSnackbar('Contrôle produit surgelé enregistré avec succès', { variant: 'success' });
      setFormData({
        product_name: '',
        storage_type: 'surgelé',
        temperature: undefined,
        best_before_date: undefined,
        use_by_date: undefined,
        is_compliant: false,
        control_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'primary.main',
          mb: 3
        }}>
          <Thermostat />
          Contrôle Produit Surgelé
        </Typography>
        
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
            label="Température (°C)"
            type="number"
            inputProps={{ step: "0.1" }}
            value={formData.temperature || ''}
            onChange={handleTemperatureChange}
            required
            fullWidth
            helperText="Température réglementaire : -18°C ou moins"
            error={formData.temperature !== undefined && formData.temperature !== null && !isTemperatureCompliant(formData.temperature)}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                label="Date limite de consommation"
                type="date"
                value={formData.best_before_date || ''}
                onChange={(e) => setFormData({...formData, best_before_date: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                label="Date de péremption"
                type="date"
                value={formData.use_by_date || ''}
                onChange={(e) => setFormData({...formData, use_by_date: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          {formData.temperature !== undefined && formData.temperature !== null && (
            <Alert 
              severity={isTemperatureCompliant(formData.temperature) ? "success" : "error"}
              sx={{ mt: 1 }}
            >
              {isTemperatureCompliant(formData.temperature) 
                ? "Température conforme" 
                : "Température non conforme - doit être -18°C ou moins"}
            </Alert>
          )}

          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            sx={{ alignSelf: 'flex-start' }}
          >
            Prendre une photo
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 2 }}
          >
            Enregistrer le contrôle
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Composant pour gérer les non-conformités
const NonConformitiesControl = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { employee } = useEmployee();
  const { user } = useAuth();
  const [nonConformities, setNonConformities] = useState<TablesInsert<'non_conformities'>[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNonConformity, setNewNonConformity] = useState<Partial<TablesInsert<'non_conformities'>>>({
    non_conformity_type: '',
    product_name: '',
    quantity: undefined,
    quantity_type: 'kg',
    description: '',
    other_cause: ''
  });

  const nonConformityTypes = [
    'Température non conforme',
    'Date de péremption dépassée',
    'Emballage défectueux',
    'Produit endommagé',
    'Quantité incorrecte',
    'Étiquetage manquant',
    'Autre'
  ];

  const quantityTypes = ['kg', 'g', 'L', 'mL', 'pièce(s)', 'lot(s)'];

  const handleAddNonConformity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('non_conformities')
        .insert([{
          ...newNonConformity,
          employee_id: employee?.id || null,
          user_id: user?.id || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setNonConformities([...nonConformities, data]);
      setNewNonConformity({
        non_conformity_type: '',
        product_name: '',
        quantity: undefined,
        quantity_type: 'kg',
        description: '',
        other_cause: ''
      });
      setShowAddForm(false);
      enqueueSnackbar('Non-conformité signalée avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar('Erreur lors du signalement', { variant: 'error' });
    }
  };

  const handleDeleteNonConformity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('non_conformities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setNonConformities(nonConformities.filter(nc => nc.id !== id));
      enqueueSnackbar('Non-conformité supprimée', { variant: 'success' });
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'error.main'
        }}>
          <Warning />
          Non-conformités
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<Add />}
          onClick={() => setShowAddForm(true)}
        >
          Signaler une non-conformité
        </Button>
      </Box>

      {nonConformities.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Warning sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Aucune non-conformité signalée
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nonConformities.map((nc) => (
            <Card key={nc.id} sx={{ border: '1px solid', borderColor: 'error.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" color="error.main">
                      {nc.non_conformity_type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Produit: {nc.product_name}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => nc.id && handleDeleteNonConformity(nc.id)}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
                
                {nc.quantity && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Quantité: {nc.quantity} {nc.quantity_type}
                  </Typography>
                )}
                
                {nc.description && (
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {nc.description}
                  </Typography>
                )}
                
                {nc.other_cause && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Autre cause:</strong> {nc.other_cause}
                  </Typography>
                )}
                
                <Typography variant="caption" color="text.secondary">
                  Signalé le {nc.created_at ? new Date(nc.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={showAddForm} onClose={() => setShowAddForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Signaler une non-conformité
          <IconButton onClick={() => setShowAddForm(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddNonConformity} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type de non-conformité *</InputLabel>
              <Select
                value={newNonConformity.non_conformity_type || ''}
                label="Type de non-conformité *"
                onChange={(e) => setNewNonConformity({...newNonConformity, non_conformity_type: e.target.value})}
                required
              >
                {nonConformityTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Nom du produit"
              value={newNonConformity.product_name || ''}
              onChange={(e) => setNewNonConformity({...newNonConformity, product_name: e.target.value})}
              required
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 2 }}>
                <TextField
                  label="Quantité"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  value={newNonConformity.quantity || ''}
                  onChange={(e) => setNewNonConformity({...newNonConformity, quantity: parseFloat(e.target.value) || undefined})}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth>
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
            </Box>

            <TextField
              label="Description"
              multiline
              rows={3}
              value={newNonConformity.description || ''}
              onChange={(e) => setNewNonConformity({...newNonConformity, description: e.target.value})}
              fullWidth
              placeholder="Décrivez la non-conformité..."
            />

            {newNonConformity.non_conformity_type === 'Autre' && (
              <TextField
                label="Précisez la cause"
                value={newNonConformity.other_cause || ''}
                onChange={(e) => setNewNonConformity({...newNonConformity, other_cause: e.target.value})}
                fullWidth
                placeholder="Précisez..."
              />
            )}

            <Button
              variant="outlined"
              startIcon={<CameraAlt />}
              sx={{ alignSelf: 'flex-start' }}
            >
              Prendre une photo
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddForm(false)}>Annuler</Button>
          <Button onClick={handleAddNonConformity} variant="contained" color="error">
            Signaler
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Composant pour la documentation et les informations
const DocInfoControl = () => {
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: 'info.main',
        mb: 3
      }}>
        <Description />
        Documentation & Informations
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'info.dark' }}>
                Températures Réglementaires
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Produits frais: 0°C à 4°C" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Produits surgelés: -18°C ou moins" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Produits ambiants: Température ambiante" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'success.dark' }}>
                Procédure de Contrôle
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="1. Vérifier la température du camion" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="2. Contrôler chaque produit individuellement" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="3. Vérifier les dates de péremption" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Documenter toute non-conformité" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="5. Prendre des photos si nécessaire" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'warning.dark' }}>
                Types de Non-conformités
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Température non conforme" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Date de péremption dépassée" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Emballage défectueux" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Produit endommagé" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Quantité incorrecte" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Étiquetage manquant" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'error.dark' }}>
                Actions en cas de Non-conformité
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="1. Signaler immédiatement" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="2. Isoler le produit concerné" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="3. Documenter avec photos" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Contacter le fournisseur" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="5. Suivre la procédure de retour" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      <Paper sx={{ mt: 3, p: 3, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          Contacts Utiles
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle2">Responsable Qualité:</Typography>
            <Typography variant="body2">Tel: 01 23 45 67 89</Typography>
            <Typography variant="body2">Email: qualite@entreprise.com</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle2">Service Livraisons:</Typography>
            <Typography variant="body2">Tel: 01 23 45 67 90</Typography>
            <Typography variant="body2">Email: livraisons@entreprise.com</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};