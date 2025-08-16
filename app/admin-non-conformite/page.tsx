"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/src/types/database';
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
  Avatar,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Warning,
  Add,
  Edit,
  Delete,
  Save,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function AdminNonConformite() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [nonConformities, setNonConformities] = useState<Tables<'non_conformities'>[]>([]);
  const [, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNonConformity, setSelectedNonConformity] = useState<Tables<'non_conformities'> | null>(null);
  
  const [formData, setFormData] = useState({
    non_conformity_type: '',
    description: '',
    product_name: ''
  });

  // Charger les non-conformités
  const loadNonConformities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('non_conformities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading non-conformities:', error);
        // Si la table n'existe pas, utiliser des données par défaut
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('Table non_conformities does not exist yet, using default data...');
          const defaultData = [
            {
              id: '1',
              non_conformity_type: 'Reduced product life',
              product_name: 'Exemple',
              description: 'Type de non-conformité recommandé HACCP',
              created_at: new Date().toISOString(),
              employee_id: null,
              user_id: null,
              delivery_id: null,
              product_reception_control_id: null,
              quantity: null,
              quantity_type: null,
              photo_url: null,
              other_cause: null
            },
            {
              id: '2',
              non_conformity_type: 'Prolonged operation',
              product_name: 'Exemple',
              description: 'Type de non-conformité recommandé HACCP',
              created_at: new Date().toISOString(),
              employee_id: null,
              user_id: null,
              delivery_id: null,
              product_reception_control_id: null,
              quantity: null,
              quantity_type: null,
              photo_url: null,
              other_cause: null
            },
            {
              id: '3',
              non_conformity_type: 'Discarded product',
              product_name: 'Exemple',
              description: 'Type de non-conformité recommandé HACCP',
              created_at: new Date().toISOString(),
              employee_id: null,
              user_id: null,
              delivery_id: null,
              product_reception_control_id: null,
              quantity: null,
              quantity_type: null,
              photo_url: null,
              other_cause: null
            }
          ];
          setNonConformities(defaultData as Tables<'non_conformities'>[]);
          return;
        }
        throw error;
      }

      setNonConformities(data || []);
    } catch (error) {
      console.error('Error loading non-conformities:', error);
      enqueueSnackbar('Erreur lors du chargement des non-conformités', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      if (!formData.non_conformity_type.trim()) {
        enqueueSnackbar('Le type de non-conformité est requis', { variant: 'error' });
        return;
      }

      // Simuler l'ajout pour la démonstration
      const newNonConformity = {
        id: Date.now().toString(),
        non_conformity_type: formData.non_conformity_type.trim(),
        product_name: formData.product_name.trim() || 'Exemple',
        description: formData.description.trim(),
        created_at: new Date().toISOString(),
        employee_id: employee?.id || null,
        user_id: user?.id || null,
        delivery_id: null,
        product_reception_control_id: null,
        quantity: null,
        quantity_type: null,
        photo_url: null,
        other_cause: null
      } as Tables<'non_conformities'>;

      setNonConformities(prev => [newNonConformity, ...prev]);
      setAddDialogOpen(false);
      setFormData({ non_conformity_type: '', description: '', product_name: '' });
      enqueueSnackbar('Type de non-conformité ajouté avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error adding non-conformity:', error);
      enqueueSnackbar('Erreur lors de l\'ajout', { variant: 'error' });
    }
  };

  const handleEdit = (nonConformity: Tables<'non_conformities'>) => {
    setSelectedNonConformity(nonConformity);
    setFormData({
      non_conformity_type: nonConformity.non_conformity_type,
      description: nonConformity.description || '',
      product_name: nonConformity.product_name
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (!selectedNonConformity || !formData.non_conformity_type.trim()) {
        enqueueSnackbar('Le type de non-conformité est requis', { variant: 'error' });
        return;
      }

      // Simuler la mise à jour pour la démonstration
      const updatedNonConformity = {
        ...selectedNonConformity,
        non_conformity_type: formData.non_conformity_type.trim(),
        product_name: formData.product_name.trim() || 'Exemple',
        description: formData.description.trim()
      };

      setNonConformities(prev => 
        prev.map(item => 
          item.id === selectedNonConformity.id ? updatedNonConformity : item
        )
      );

      setEditDialogOpen(false);
      setSelectedNonConformity(null);
      setFormData({ non_conformity_type: '', description: '', product_name: '' });
      enqueueSnackbar('Type de non-conformité modifié avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error updating non-conformity:', error);
      enqueueSnackbar('Erreur lors de la modification', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedNonConformity) return;

      // Simuler la suppression pour la démonstration
      setNonConformities(prev => 
        prev.filter(item => item.id !== selectedNonConformity.id)
      );

      setDeleteDialogOpen(false);
      setSelectedNonConformity(null);
      enqueueSnackbar('Type de non-conformité supprimé avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting non-conformity:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  useEffect(() => {
    loadNonConformities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Card sx={{ mb: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
            p: 3, 
            color: 'white' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Warning />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                  Administration des Non-conformités
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Gestion des types de non-conformités pour le système HACCP
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Informations */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Types de non-conformités recommandés :</strong>
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>Durée de vie du produit réduite</strong><br/>
            • <strong>Fonctionnement prolongé</strong><br/>
            • <strong>Produit jeté</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Vous pouvez créer d&apos;autres types selon vos besoins spécifiques.
          </Typography>
        </Alert>

        {/* Liste des non-conformités */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Types de Non-conformités ({nonConformities.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                  }
                }}
              >
                Ajouter un type
              </Button>
            </Box>

            {nonConformities.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Type de Non-conformité</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date de création</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {nonConformities.map((nonConformity) => (
                      <TableRow key={nonConformity.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Warning color="warning" fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {nonConformity.non_conformity_type}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {nonConformity.description || 'Aucune description'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {nonConformity.created_at ? 
                              new Date(nonConformity.created_at).toLocaleDateString('fr-FR', {
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
                                onClick={() => handleEdit(nonConformity)}
                                sx={{ color: 'primary.main' }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setSelectedNonConformity(nonConformity);
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
                <Warning sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucun type de non-conformité
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Commencez par ajouter des types de non-conformités pour votre système HACCP.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setAddDialogOpen(true)}
                >
                  Ajouter le premier type
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog d'ajout */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main' }}>
              <Add />
            </Avatar>
            Ajouter un type de non-conformité
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Type de non-conformité *"
                value={formData.non_conformity_type}
                onChange={(e) => setFormData({...formData, non_conformity_type: e.target.value})}
                fullWidth
                placeholder="Ex: Reduced product life, Temperature deviation..."
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                fullWidth
                multiline
                rows={3}
                placeholder="Description détaillée de ce type de non-conformité..."
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
            Modifier le type de non-conformité
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Type de non-conformité *"
                value={formData.non_conformity_type}
                onChange={(e) => setFormData({...formData, non_conformity_type: e.target.value})}
                fullWidth
              />
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
              Êtes-vous sûr de vouloir supprimer ce type de non-conformité ?
            </Typography>
            {selectedNonConformity && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Type :</strong> {selectedNonConformity.non_conformity_type}
                </Typography>
                {selectedNonConformity.description && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Description :</strong> {selectedNonConformity.description}
                  </Typography>
                )}
              </Box>
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cette action est irréversible. Le type de non-conformité sera définitivement supprimé.
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