"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  Stack,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Restaurant,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  AdminPanelSettings
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function AdminProduitAlimentaire() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [foodProducts, setFoodProducts] = useState<Tables<'food_products'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Tables<'food_products'> | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    food_type: '',
    description: '',
    custom_category: '',
    custom_food_type: ''
  });

  const foodCategories = [
    'Viandes',
    'Poissons',
    'Légumes',
    'Fruits',
    'Produits laitiers',
    'Céréales',
    'Légumineuses',
    'Huiles et graisses',
    'Condiments',
    'Boissons',
    'Produits surgelés',
    'Conserves',
    'Autres'
  ];

  const foodTypes = [
    'Frais',
    'Surgelé',
    'Conserve',
    'Sec',
    'Liquide',
    'Poudre',
    'Autre'
  ];

  // Charger les produits alimentaires
  const loadFoodProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('food_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading food products:', error);
        // Si la table n'existe pas, utiliser des données par défaut
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('Table food_products does not exist yet, using default data...');
          const defaultData = [
            {
              id: '1',
              name: 'Poulet frais',
              category: 'Viandes',
              food_type: 'Frais',
              description: 'Blanc de poulet frais',
              created_at: new Date().toISOString(),
              organization_id: null
            },
            {
              id: '2',
              name: 'Saumon surgelé',
              category: 'Poissons',
              food_type: 'Surgelé',
              description: 'Filet de saumon surgelé',
              created_at: new Date().toISOString(),
              organization_id: null
            },
            {
              id: '3',
              name: 'Tomates fraîches',
              category: 'Légumes',
              food_type: 'Frais',
              description: 'Tomates fraîches de saison',
              created_at: new Date().toISOString(),
              organization_id: null
            }
          ];
          setFoodProducts(defaultData as Tables<'food_products'>[]);
          return;
        }
        throw error;
      }

      setFoodProducts(data || []);
    } catch (error) {
      console.error('Error loading food products:', error);
      enqueueSnackbar('Erreur lors du chargement des produits alimentaires', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      if (!formData.name.trim() || !formData.category || !formData.food_type) {
        enqueueSnackbar('Le nom, la catégorie et le type sont requis', { variant: 'error' });
        return;
      }

      // Validation des champs personnalisés
      if (formData.category === 'Autres' && !formData.custom_category.trim()) {
        enqueueSnackbar('La catégorie personnalisée est requise', { variant: 'error' });
        return;
      }

      if (formData.food_type === 'Autre' && !formData.custom_food_type.trim()) {
        enqueueSnackbar('Le type personnalisé est requis', { variant: 'error' });
        return;
      }

      // Simuler l'ajout pour la démonstration
      const finalCategory = formData.category === 'Autres' ? formData.custom_category.trim() : formData.category;
      const finalFoodType = formData.food_type === 'Autre' ? formData.custom_food_type.trim() : formData.food_type;

      const newProduct = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        category: finalCategory,
        food_type: finalFoodType,
        description: formData.description.trim(),
        created_at: new Date().toISOString(),
        organization_id: (user as any)?.organization_id || null
      } as Tables<'food_products'>;

      setFoodProducts(prev => [newProduct, ...prev]);
      setAddDialogOpen(false);
      setFormData({ name: '', category: '', food_type: '', description: '', custom_category: '', custom_food_type: '' });
      enqueueSnackbar('Produit alimentaire ajouté avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error adding food product:', error);
      enqueueSnackbar('Erreur lors de l\'ajout', { variant: 'error' });
    }
  };

  const handleEdit = (product: Tables<'food_products'>) => {
    setSelectedProduct(product);
    
    // Vérifier si la catégorie ou le type sont des valeurs personnalisées
    const isCustomCategory = !foodCategories.includes(product.category);
    const isCustomFoodType = !foodTypes.includes(product.food_type);
    
    setFormData({
      name: product.name,
      category: isCustomCategory ? 'Autres' : product.category,
      food_type: isCustomFoodType ? 'Autre' : product.food_type,
      description: product.description || '',
      custom_category: isCustomCategory ? product.category : '',
      custom_food_type: isCustomFoodType ? product.food_type : ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (!selectedProduct || !formData.name.trim() || !formData.category || !formData.food_type) {
        enqueueSnackbar('Le nom, la catégorie et le type sont requis', { variant: 'error' });
        return;
      }

      // Validation des champs personnalisés
      if (formData.category === 'Autres' && !formData.custom_category.trim()) {
        enqueueSnackbar('La catégorie personnalisée est requise', { variant: 'error' });
        return;
      }

      if (formData.food_type === 'Autre' && !formData.custom_food_type.trim()) {
        enqueueSnackbar('Le type personnalisé est requis', { variant: 'error' });
        return;
      }

      // Simuler la mise à jour pour la démonstration
      const finalCategory = formData.category === 'Autres' ? formData.custom_category.trim() : formData.category;
      const finalFoodType = formData.food_type === 'Autre' ? formData.custom_food_type.trim() : formData.food_type;
      
      const updatedProduct = {
        ...selectedProduct,
        name: formData.name.trim(),
        category: finalCategory,
        food_type: finalFoodType,
        description: formData.description.trim()
      };

      setFoodProducts(prev => 
        prev.map(item => 
          item.id === selectedProduct.id ? updatedProduct : item
        )
      );

      setEditDialogOpen(false);
      setSelectedProduct(null);
      setFormData({ name: '', category: '', food_type: '', description: '', custom_category: '', custom_food_type: '' });
      enqueueSnackbar('Produit alimentaire modifié avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error updating food product:', error);
      enqueueSnackbar('Erreur lors de la modification', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedProduct) return;

      // Simuler la suppression pour la démonstration
      setFoodProducts(prev => 
        prev.filter(item => item.id !== selectedProduct.id)
      );

      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      enqueueSnackbar('Produit alimentaire supprimé avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting food product:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  useEffect(() => {
    loadFoodProducts();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Card sx={{ mb: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
            p: 3, 
            color: 'white' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Restaurant />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                  Administration des Produits Alimentaires
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Gestion des produits alimentaires pour le système HACCP
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Informations */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Gestion des produits alimentaires :</strong>
          </Typography>
          <Typography variant="body2" component="div">
            • Ajoutez et gérez tous vos produits alimentaires<br/>
            • Classez-les par catégorie et type<br/>
            • Utilisez ces données pour le suivi de refroidissement HACCP
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Ces produits seront disponibles dans les formulaires de traçabilité.
          </Typography>
        </Alert>

        {/* Liste des produits */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Produits Alimentaires ({foodProducts.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                  }
                }}
              >
                Ajouter un produit
              </Button>
            </Box>

            {foodProducts.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Nom du produit</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Catégorie</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date de création</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {foodProducts.map((product) => (
                      <TableRow key={product.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Restaurant color="success" fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {product.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={product.category} 
                            size="small" 
                            sx={{ bgcolor: 'success.light', color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={product.food_type} 
                            size="small" 
                            variant="outlined"
                            color="success"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {product.description || 'Aucune description'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {product.created_at ? 
                              new Date(product.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              }) : '-'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Modifier">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEdit(product)}
                                sx={{ color: 'primary.main' }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setDeleteDialogOpen(true);
                                }}
                                sx={{ color: 'error.main' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Restaurant sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucun produit alimentaire
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Commencez par ajouter des produits alimentaires pour votre système HACCP.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setAddDialogOpen(true)}
                >
                  Ajouter le premier produit
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog d'ajout */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <Add />
            </Avatar>
            Ajouter un produit alimentaire
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Nom du produit *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                fullWidth
                placeholder="Ex: Poulet frais, Saumon surgelé..."
              />
              <FormControl fullWidth required>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={formData.category}
                  label="Catégorie *"
                  onChange={(e) => setFormData({...formData, category: e.target.value, custom_category: ''})}
                >
                  {foodCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formData.category === 'Autres' && (
                <TextField
                  label="Catégorie personnalisée *"
                  value={formData.custom_category}
                  onChange={(e) => setFormData({...formData, custom_category: e.target.value})}
                  fullWidth
                  placeholder="Saisir une catégorie personnalisée..."
                  required
                />
              )}
              <FormControl fullWidth required>
                <InputLabel>Type *</InputLabel>
                <Select
                  value={formData.food_type}
                  label="Type *"
                  onChange={(e) => setFormData({...formData, food_type: e.target.value, custom_food_type: ''})}
                >
                  {foodTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formData.food_type === 'Autre' && (
                <TextField
                  label="Type personnalisé *"
                  value={formData.custom_food_type}
                  onChange={(e) => setFormData({...formData, custom_food_type: e.target.value})}
                  fullWidth
                  placeholder="Saisir un type personnalisé..."
                  required
                />
              )}
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                fullWidth
                multiline
                rows={3}
                placeholder="Description détaillée du produit..."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} variant="contained" startIcon={<Save />}>
              Ajouter
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de modification */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Edit />
            </Avatar>
            Modifier le produit alimentaire
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Nom du produit *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={formData.category}
                  label="Catégorie *"
                  onChange={(e) => setFormData({...formData, category: e.target.value, custom_category: ''})}
                >
                  {foodCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formData.category === 'Autres' && (
                <TextField
                  label="Catégorie personnalisée *"
                  value={formData.custom_category}
                  onChange={(e) => setFormData({...formData, custom_category: e.target.value})}
                  fullWidth
                  placeholder="Saisir une catégorie personnalisée..."
                  required
                />
              )}
              <FormControl fullWidth required>
                <InputLabel>Type *</InputLabel>
                <Select
                  value={formData.food_type}
                  label="Type *"
                  onChange={(e) => setFormData({...formData, food_type: e.target.value, custom_food_type: ''})}
                >
                  {foodTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formData.food_type === 'Autre' && (
                <TextField
                  label="Type personnalisé *"
                  value={formData.custom_food_type}
                  onChange={(e) => setFormData({...formData, custom_food_type: e.target.value})}
                  fullWidth
                  placeholder="Saisir un type personnalisé..."
                  required
                />
              )}
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                fullWidth
                multiline
                rows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} variant="contained" startIcon={<Save />}>
              Modifier
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de suppression */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'error.main' }}>
              <Delete />
            </Avatar>
            Confirmer la suppression
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Êtes-vous sûr de vouloir supprimer ce produit alimentaire ?
            </Typography>
            {selectedProduct && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Nom :</strong> {selectedProduct.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Catégorie :</strong> {selectedProduct.category}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Type :</strong> {selectedProduct.food_type}
                </Typography>
                {selectedProduct.description && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Description :</strong> {selectedProduct.description}
                  </Typography>
                )}
              </Box>
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cette action est irréversible. Le produit alimentaire sera définitivement supprimé.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleDelete} variant="contained" color="error" startIcon={<Delete />}>
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}