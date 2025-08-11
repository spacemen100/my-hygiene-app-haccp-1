'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Science as ProductsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/components/AuthProvider';
import { useEmployee } from '@/contexts/EmployeeContext';

// Types pour les produits de nettoyage
interface CleaningProduct {
  id: string;
  organization_id: string | null;
  name: string;
  brand: string | null;
  type: string | null;
  usage_instructions: string | null;
  safety_instructions: string | null;
  is_active: boolean;
  created_at: string;
  employee_id: string | null;
  user_id: string | null;
}

interface ProductFormData {
  name: string;
  brand: string;
  type: string;
  usage_instructions: string;
  safety_instructions: string;
  is_active: boolean;
}

// Types de produits prédéfinis
const PRODUCT_TYPES = [
  'Détergent',
  'Désinfectant',
  'Dégraissant',
  'Détartrant',
  'Savon',
  'Rinçage',
  'Multi-usage',
  'Spécialisé',
  'Autre'
];

export default function AdminProduitsNettoyagePage() {
  const { session } = useAuth();
  const { employee: currentEmployee } = useEmployee();
  const { enqueueSnackbar } = useSnackbar();

  // États pour les produits
  const [products, setProducts] = useState<CleaningProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  
  // États pour les dialogues
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CleaningProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<CleaningProduct | null>(null);
  
  // Formulaire
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    brand: '',
    type: '',
    usage_instructions: '',
    safety_instructions: '',
    is_active: true
  });
  
  const [saving, setSaving] = useState(false);

  // Récupérer les produits
  const fetchProducts = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cleaning_products')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      enqueueSnackbar('Erreur lors de la récupération des produits', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, enqueueSnackbar]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filtrer les produits selon l'état actif/inactif
  const filteredProducts = products.filter(product => 
    showInactive ? !product.is_active : product.is_active
  );

  // Ouvrir le dialogue pour un nouveau produit
  const handleNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      brand: '',
      type: '',
      usage_instructions: '',
      safety_instructions: '',
      is_active: true
    });
    setOpenDialog(true);
  };

  // Ouvrir le dialogue pour modifier un produit
  const handleEditProduct = (product: CleaningProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      brand: product.brand || '',
      type: product.type || '',
      usage_instructions: product.usage_instructions || '',
      safety_instructions: product.safety_instructions || '',
      is_active: product.is_active
    });
    setOpenDialog(true);
  };

  // Ouvrir le dialogue de visualisation
  const handleViewProduct = (product: CleaningProduct) => {
    setViewingProduct(product);
    setOpenViewDialog(true);
  };

  // Sauvegarder un produit
  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !session?.user?.id) {
      enqueueSnackbar('Le nom du produit est requis', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);

      const productData = {
        name: productForm.name.trim(),
        brand: productForm.brand.trim() || null,
        type: productForm.type.trim() || null,
        usage_instructions: productForm.usage_instructions.trim() || null,
        safety_instructions: productForm.safety_instructions.trim() || null,
        is_active: productForm.is_active,
        user_id: session.user.id,
        employee_id: currentEmployee?.id || null,
        organization_id: currentEmployee?.organization_id || null,
      };

      if (editingProduct) {
        // Modification
        const { error } = await supabase
          .from('cleaning_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        enqueueSnackbar('Produit modifié avec succès', { variant: 'success' });
      } else {
        // Création
        const { error } = await supabase
          .from('cleaning_products')
          .insert(productData);

        if (error) throw error;
        enqueueSnackbar('Produit créé avec succès', { variant: 'success' });
      }

      setOpenDialog(false);
      fetchProducts();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du produit:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde du produit', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Activer/Désactiver un produit
  const handleToggleActive = async (product: CleaningProduct) => {
    try {
      const { error } = await supabase
        .from('cleaning_products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;

      enqueueSnackbar(
        `Produit ${!product.is_active ? 'activé' : 'désactivé'} avec succès`, 
        { variant: 'success' }
      );
      fetchProducts();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      enqueueSnackbar('Erreur lors du changement de statut', { variant: 'error' });
    }
  };

  // Supprimer un produit
  const handleDeleteProduct = async (product: CleaningProduct) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cleaning_products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      enqueueSnackbar('Produit supprimé avec succès', { variant: 'success' });
      fetchProducts();
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      enqueueSnackbar('Erreur lors de la suppression du produit', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* En-tête */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white',
          p: { xs: '1.5rem 1rem', sm: '2rem 1.5rem', md: '2.5rem 2rem' },
          mb: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          borderRadius: { xs: 0, sm: 2, md: 3 },
          mx: { xs: '-0.75rem', sm: 0 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ProductsIcon sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
          <Typography 
            variant="h1" 
            component="h1"
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              lineHeight: 1.2
            }}
          >
            Administrateur des Produits de Nettoyage
          </Typography>
        </Box>
        <Typography 
          variant="h2" 
          component="p"
          sx={{ 
            opacity: 0.95,
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.125rem' },
            fontWeight: 400,
            lineHeight: 1.4
          }}
        >
          Gérez les produits de nettoyage utilisés dans votre organisation
        </Typography>
      </Paper>

      {/* Actions principales */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2, 
        mb: { xs: 2, md: 3 },
        flexWrap: 'wrap'
      }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewProduct}
          sx={{
            bgcolor: '#2196f3',
            '&:hover': { bgcolor: '#1976d2' }
          }}
        >
          Nouveau Produit
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                color="warning"
              />
            }
            label={showInactive ? "Produits inactifs" : "Produits actifs"}
          />
          <Chip 
            label={`${filteredProducts.length} produit${filteredProducts.length !== 1 ? 's' : ''}`}
            color="primary" 
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Liste des produits */}
      {filteredProducts.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {showInactive 
            ? "Aucun produit inactif trouvé."
            : "Aucun produit de nettoyage configuré. Commencez par créer un nouveau produit."
          }
        </Alert>
      ) : (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {filteredProducts.map((product) => (
            <Card 
              key={product.id}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                },
                opacity: product.is_active ? 1 : 0.7
              }}
            >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ 
                      fontWeight: 600,
                      lineHeight: 1.3,
                      flex: 1,
                      mr: 1
                    }}>
                      {product.name}
                    </Typography>
                    <Chip 
                      label={product.is_active ? 'Actif' : 'Inactif'}
                      color={product.is_active ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  
                  {product.brand && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                      Marque: {product.brand}
                    </Typography>
                  )}
                  
                  {product.type && (
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={product.type}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  )}
                  
                  {product.usage_instructions && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <InfoIcon sx={{ fontSize: 14 }} />
                        Instructions d&apos;utilisation:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.875rem',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {product.usage_instructions}
                      </Typography>
                    </Box>
                  )}
                  
                  {product.safety_instructions && (
                    <Box>
                      <Typography variant="caption" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <WarningIcon sx={{ fontSize: 14 }} />
                        Consignes de sécurité:
                      </Typography>
                      <Typography variant="body2" color="error.main" sx={{ 
                        fontSize: '0.875rem',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {product.safety_instructions}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Voir détails">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewProduct(product)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditProduct(product)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteProduct(product)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Tooltip title={product.is_active ? "Désactiver" : "Activer"}>
                    <IconButton 
                      size="small"
                      onClick={() => handleToggleActive(product)}
                      color={product.is_active ? "success" : "default"}
                    >
                      {product.is_active ? <ViewIcon /> : <HideIcon />}
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
          ))}
        </Box>
      )}

      {/* Dialog pour créer/modifier un produit */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          {editingProduct ? 'Modifier le produit' : 'Nouveau produit de nettoyage'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom du produit"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              fullWidth
              required
              autoFocus
            />
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Marque"
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                sx={{ flex: 1, minWidth: 200 }}
              />
              
              <FormControl sx={{ flex: 1, minWidth: 200 }}>
                <InputLabel>Type de produit</InputLabel>
                <Select
                  value={productForm.type}
                  onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                  label="Type de produit"
                >
                  {PRODUCT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              label="Instructions d'utilisation"
              value={productForm.usage_instructions}
              onChange={(e) => setProductForm({ ...productForm, usage_instructions: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Dosage, mode d'emploi, conditions d'utilisation..."
            />
            
            <TextField
              label="Consignes de sécurité"
              value={productForm.safety_instructions}
              onChange={(e) => setProductForm({ ...productForm, safety_instructions: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="EPI requis, précautions d'usage, premiers secours..."
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                />
              }
              label="Produit actif"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveProduct}
            variant="contained"
            disabled={saving || !productForm.name.trim()}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de visualisation */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          Détails du produit
        </DialogTitle>
        <DialogContent>
          {viewingProduct && (
            <Box sx={{ mt: 1 }}>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Nom"
                    secondary={viewingProduct.name}
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={viewingProduct.is_active ? 'Actif' : 'Inactif'}
                      color={viewingProduct.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                {viewingProduct.brand && (
                  <ListItem>
                    <ListItemText
                      primary="Marque"
                      secondary={viewingProduct.brand}
                    />
                  </ListItem>
                )}
                
                {viewingProduct.type && (
                  <ListItem>
                    <ListItemText
                      primary="Type"
                      secondary={viewingProduct.type}
                    />
                  </ListItem>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                {viewingProduct.usage_instructions && (
                  <ListItem sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <InfoIcon color="primary" sx={{ fontSize: 20 }} />
                          <Typography variant="subtitle2">Instructions d&apos;utilisation</Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {viewingProduct.usage_instructions}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                
                {viewingProduct.safety_instructions && (
                  <ListItem sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <WarningIcon color="error" sx={{ fontSize: 20 }} />
                          <Typography variant="subtitle2" color="error">Consignes de sécurité</Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="error.main" sx={{ whiteSpace: 'pre-line' }}>
                          {viewingProduct.safety_instructions}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <ListItemText
                    primary="Date de création"
                    secondary={new Date(viewingProduct.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>
            Fermer
          </Button>
          {viewingProduct && (
            <Button 
              onClick={() => {
                setOpenViewDialog(false);
                handleEditProduct(viewingProduct);
              }}
              variant="outlined"
              startIcon={<EditIcon />}
            >
              Modifier
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}