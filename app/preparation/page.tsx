"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete,
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  Euro as EuroIcon,
  Scale as ScaleIcon,
  Category as CategoryIcon,
  LocalOffer as TagIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { supabase } from '@/lib/supabase';
import { useEmployee } from '@/contexts/EmployeeContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSnackbar } from 'notistack';

interface Preparation {
  id: string;
  organization_id: string;
  designation: string;
  lot_number?: string;
  dlc?: string;
  allergens: string[];
  selling_price: number;
  price_unit: string;
  state: string;
  category: string;
  quantity: number;
  quantity_unit: string;
  save_to_preparations: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employee_id?: string;
  user_id?: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

const PRICE_UNITS = [
  { value: 'kg', label: 'Kg' },
  { value: 'litre', label: 'Litre' },
  { value: 'piece', label: 'Pièce' },
  { value: 'lot', label: 'Lot' },
  { value: 'filet', label: 'Filet' },
  { value: 'barquette', label: 'Barquette' },
  { value: 'portion', label: 'Portion' },
];

const STATES = [
  { value: 'fresh', label: 'Frais', color: 'success' },
  { value: 'frozen', label: 'Surgelé', color: 'info' },
  { value: 'vacuum_packed', label: 'Sous vide', color: 'secondary' },
  { value: 'vacuum_frozen', label: 'Sous vide surgelé', color: 'primary' },
  { value: 'defrosted', label: 'Décongelé', color: 'warning' },
  { value: 'cooked', label: 'Cuit', color: 'default' },
  { value: 'precooked', label: 'Précuit', color: 'default' },
];

const CATEGORIES = [
  { value: 'meat', label: 'Viande', icon: '🥩' },
  { value: 'poultry', label: 'Volaille', icon: '🐔' },
  { value: 'game', label: 'Gibier', icon: '🦌' },
  { value: 'fish', label: 'Poisson', icon: '🐟' },
  { value: 'seafood', label: 'Fruits de mer', icon: '🦐' },
  { value: 'charcuterie', label: 'Charcuterie', icon: '🥓' },
  { value: 'vegetable', label: 'Légume', icon: '🥕' },
  { value: 'fruit', label: 'Fruit', icon: '🍎' },
  { value: 'dairy', label: 'Produit laitier', icon: '🧀' },
  { value: 'pastry', label: 'Pâtisserie', icon: '🧁' },
  { value: 'sauce', label: 'Sauce', icon: '🍯' },
  { value: 'other', label: 'Autre', icon: '📦' },
];

const QUANTITY_UNITS = [
  { value: 'kg', label: 'Kg' },
  { value: 'g', label: 'g' },
  { value: 'litre', label: 'Litre' },
  { value: 'ml', label: 'ml' },
  { value: 'piece', label: 'Pièce' },
  { value: 'unit', label: 'Unité' },
];

const COMMON_ALLERGENS = [
  'Gluten',
  'Lactose',
  'Œufs',
  'Fruits à coque',
  'Arachides',
  'Soja',
  'Poisson',
  'Crustacés',
  'Mollusques',
  'Céleri',
  'Moutarde',
  'Graines de sésame',
  'Anhydride sulfureux',
  'Lupin',
];

export default function PreparationPage() {
  const { employee } = useEmployee();
  const { enqueueSnackbar } = useSnackbar();

  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPreparation, setEditingPreparation] = useState<Preparation | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    designation: '',
    lot_number: '',
    dlc: null as Date | null,
    allergens: [] as string[],
    selling_price: 0,
    price_unit: 'piece',
    state: 'fresh',
    category: 'other',
    quantity: 0,
    quantity_unit: 'kg',
    save_to_preparations: false,
  });

  const fetchPreparations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('preparations')
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPreparations(data || []);
    } catch (error) {
      console.error('Error fetching preparations:', error);
      enqueueSnackbar('Erreur lors du chargement des préparations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchPreparations();
  }, [fetchPreparations]);

  const handleSubmit = async () => {
    if (!formData.designation.trim()) {
      enqueueSnackbar('La désignation est obligatoire', { variant: 'error' });
      return;
    }

    if (formData.selling_price <= 0) {
      enqueueSnackbar('Le prix de vente doit être supérieur à 0', { variant: 'error' });
      return;
    }

    if (formData.quantity <= 0) {
      enqueueSnackbar('La quantité doit être supérieure à 0', { variant: 'error' });
      return;
    }

    try {
      const preparationData = {
        designation: formData.designation.trim(),
        lot_number: formData.lot_number.trim() || null,
        dlc: formData.dlc ? formData.dlc.toISOString().split('T')[0] : null,
        allergens: formData.allergens,
        selling_price: formData.selling_price,
        price_unit: formData.price_unit,
        state: formData.state,
        category: formData.category,
        quantity: formData.quantity,
        quantity_unit: formData.quantity_unit,
        save_to_preparations: formData.save_to_preparations,
        employee_id: employee?.id || null,
        organization_id: employee?.organization_id,
      };

      if (editingPreparation) {
        const { error } = await supabase
          .from('preparations')
          .update(preparationData)
          .eq('id', editingPreparation.id);

        if (error) throw error;
        enqueueSnackbar('Préparation modifiée avec succès', { variant: 'success' });
      } else {
        const { error } = await supabase
          .from('preparations')
          .insert([preparationData]);

        if (error) throw error;
        enqueueSnackbar('Préparation créée avec succès', { variant: 'success' });
      }

      handleCloseDialog();
      fetchPreparations();
    } catch (error) {
      console.error('Error saving preparation:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde', { variant: 'error' });
    }
  };

  const handleEdit = (preparation: Preparation) => {
    setEditingPreparation(preparation);
    setFormData({
      designation: preparation.designation,
      lot_number: preparation.lot_number || '',
      dlc: preparation.dlc ? new Date(preparation.dlc) : null,
      allergens: preparation.allergens,
      selling_price: preparation.selling_price,
      price_unit: preparation.price_unit,
      state: preparation.state,
      category: preparation.category,
      quantity: preparation.quantity,
      quantity_unit: preparation.quantity_unit,
      save_to_preparations: preparation.save_to_preparations,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (preparationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette préparation ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('preparations')
        .update({ is_active: false })
        .eq('id', preparationId);

      if (error) throw error;

      enqueueSnackbar('Préparation supprimée avec succès', { variant: 'success' });
      fetchPreparations();
    } catch (error) {
      console.error('Error deleting preparation:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  const handleOpenDialog = () => {
    setEditingPreparation(null);
    setFormData({
      designation: '',
      lot_number: '',
      dlc: null,
      allergens: [],
      selling_price: 0,
      price_unit: 'piece',
      state: 'fresh',
      category: 'other',
      quantity: 0,
      quantity_unit: 'kg',
      save_to_preparations: false,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPreparation(null);
  };

  const getStateConfig = (state: string) => {
    return STATES.find(s => s.value === state) || STATES[0];
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, width: '100%', maxWidth: '1400px', mx: 'auto', px: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
          color: 'white',
          p: { xs: 2, md: 4 },
          mb: { xs: 2, md: 4 },
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                width: { xs: 56, md: 80 },
                height: { xs: 56, md: 80 },
              }}
            >
              <RestaurantIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                Gestion des Préparations
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Créez et gérez vos préparations culinaires
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            Nouvelle Préparation
          </Button>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {preparations.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Préparations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {preparations.filter(p => p.state === 'fresh').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Frais
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                {preparations.filter(p => p.state === 'frozen').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Surgelés
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {preparations.filter(p => p.dlc && new Date(p.dlc) < new Date()).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                DLC Dépassées
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preparations List */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          Liste des Préparations
        </Typography>
        
        {preparations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <RestaurantIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune préparation enregistrée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Commencez par créer votre première préparation
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
              Nouvelle Préparation
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Désignation</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>État</TableCell>
                  <TableCell>Quantité</TableCell>
                  <TableCell>Prix</TableCell>
                  <TableCell>DLC</TableCell>
                  <TableCell>Allergènes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preparations.map((preparation) => {
                  const stateConfig = getStateConfig(preparation.state);
                  const categoryConfig = getCategoryConfig(preparation.category);
                  const isDlcExpired = preparation.dlc && new Date(preparation.dlc) < new Date();

                  return (
                    <TableRow key={preparation.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {preparation.designation}
                          </Typography>
                          {preparation.lot_number && (
                            <Typography variant="caption" color="text.secondary">
                              Lot: {preparation.lot_number}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{categoryConfig.icon}</span>
                          <Typography variant="body2">{categoryConfig.label}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stateConfig.label}
                          size="small"
                          color={stateConfig.color as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {preparation.quantity} {preparation.quantity_unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {preparation.selling_price}€/{preparation.price_unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {preparation.dlc ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isDlcExpired && <WarningIcon color="error" fontSize="small" />}
                            <Typography
                              variant="body2"
                              color={isDlcExpired ? 'error' : 'text.primary'}
                              sx={{ fontWeight: isDlcExpired ? 600 : 400 }}
                            >
                              {format(new Date(preparation.dlc), 'dd/MM/yyyy', { locale: fr })}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {preparation.allergens.length > 0 ? (
                            preparation.allergens.slice(0, 2).map((allergen) => (
                              <Chip
                                key={allergen}
                                label={allergen}
                                size="small"
                                variant="outlined"
                                color="warning"
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Aucun
                            </Typography>
                          )}
                          {preparation.allergens.length > 2 && (
                            <Chip
                              label={`+${preparation.allergens.length - 2}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(preparation)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(preparation.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPreparation ? 'Modifier la préparation' : 'Nouvelle préparation'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Designation */}
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                required
                label="Désignation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Nom du plat ou de la préparation"
              />
            </Grid>
            
            {/* Lot Number */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Numéro de lot"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                placeholder="Optionnel"
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={formData.category}
                  label="Catégorie"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{category.icon}</span>
                        {category.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* State */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>État</InputLabel>
                <Select
                  value={formData.state}
                  label="État"
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  {STATES.map((state) => (
                    <MenuItem key={state.value} value={state.value}>
                      {state.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Quantité"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScaleIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Quantity Unit */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Unité de quantité</InputLabel>
                <Select
                  value={formData.quantity_unit}
                  label="Unité de quantité"
                  onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })}
                >
                  {QUANTITY_UNITS.map((unit) => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Selling Price */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Prix de vente"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EuroIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Price Unit */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Unité de prix</InputLabel>
                <Select
                  value={formData.price_unit}
                  label="Unité de prix"
                  onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
                >
                  {PRICE_UNITS.map((unit) => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* DLC */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Date limite de consommation"
                value={formData.dlc}
                onChange={(date) => setFormData({ ...formData, dlc: date })}
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </Grid>

            {/* Save to preparations switch */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.save_to_preparations}
                    onChange={(e) => setFormData({ ...formData, save_to_preparations: e.target.checked })}
                  />
                }
                label="Sauvegarder dans les préparations"
              />
            </Grid>

            {/* Allergens */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={COMMON_ALLERGENS}
                value={formData.allergens}
                onChange={(_, value) => setFormData({ ...formData, allergens: value })}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      color="warning"
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Allergènes"
                    placeholder="Sélectionnez les allergènes"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <WarningIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPreparation ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}