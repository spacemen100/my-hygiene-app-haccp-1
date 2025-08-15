"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ChecklistRtl as ChecklistIcon,
  List as ListIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

type Checklist = Tables<'checklists'>;
type ChecklistInsert = TablesInsert<'checklists'>;
type ChecklistUpdate = TablesUpdate<'checklists'>;
type ChecklistItem = Tables<'checklist_items'>;
type ChecklistItemInsert = TablesInsert<'checklist_items'>;
type ChecklistItemUpdate = TablesUpdate<'checklist_items'>;

export default function AdminChecklistPage() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<Checklist | null>(null);
  
  // Items management state
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [itemFormData, setItemFormData] = useState<ChecklistItemInsert>({
    checklist_id: '',
    name: '',
    description: null,
    order_index: 0,
  });
  
  // Form state
  const [formData, setFormData] = useState<ChecklistInsert>({
    name: '',
    description: null,
    category: 'hygiene',
    frequency: 'daily',
    is_active: true,
    organization_id: employee?.organization_id || '',
  });

  const categories = [
    { value: 'hygiene', label: 'Hygiène' },
    { value: 'cleaning', label: 'Nettoyage' },
    { value: 'temperature', label: 'Température' },
    { value: 'reception', label: 'Réception' },
    { value: 'storage', label: 'Stockage' },
    { value: 'preparation', label: 'Préparation' },
    { value: 'service', label: 'Service' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Autre' },
  ];

  const frequencies = [
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'on_demand', label: 'À la demande' },
  ];

  useEffect(() => {
    loadChecklists();
  }, []);

  useEffect(() => {
    if (employee?.organization_id) {
      setFormData(prev => ({
        ...prev,
        organization_id: employee.organization_id || ''
      }));
    }
  }, [employee?.organization_id]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('name');

      if (error) throw error;
      setChecklists(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des checklists:', err);
      setError('Erreur lors du chargement des checklists');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (checklist: Checklist | null = null) => {
    if (checklist) {
      setEditingChecklist(checklist);
      setFormData({
        name: checklist.name,
        description: checklist.description,
        category: checklist.category,
        frequency: checklist.frequency,
        is_active: checklist.is_active ?? true,
        organization_id: checklist.organization_id,
      });
    } else {
      setEditingChecklist(null);
      setFormData({
        name: '',
        description: null,
        category: 'hygiene',
        frequency: 'daily',
        is_active: true,
        organization_id: employee?.organization_id || '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChecklist(null);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.name.trim()) {
        setError('Le nom de la checklist est obligatoire');
        return;
      }

      if (editingChecklist) {
        // Update existing checklist
        const { error } = await supabase
          .from('checklists')
          .update({
            ...formData as ChecklistUpdate,
            employee_id: employee?.id || null,
            user_id: user?.id || null
          })
          .eq('id', editingChecklist.id);

        if (error) throw error;
        setSuccess('Checklist mise à jour avec succès');
      } else {
        // Create new checklist
        const { error } = await supabase
          .from('checklists')
          .insert([{
            ...formData,
            employee_id: employee?.id || null,
            user_id: user?.id || null,
            organization_id: employee?.organization_id || null,
          }]);

        if (error) throw error;
        setSuccess('Checklist créée avec succès');
      }

      await loadChecklists();
      handleCloseDialog();
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!checklistToDelete) return;

    try {
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', checklistToDelete.id);

      if (error) throw error;

      setSuccess('Checklist supprimée avec succès');
      await loadChecklists();
      setDeleteDialogOpen(false);
      setChecklistToDelete(null);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  // Items management functions
  const handleOpenItems = async (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    await loadChecklistItems(checklist.id);
    setItemsDialogOpen(true);
  };

  const loadChecklistItems = async (checklistId: string) => {
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('order_index');

      if (error) throw error;
      setChecklistItems(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des items:', err);
      setError('Erreur lors du chargement des items');
    }
  };

  const handleOpenItemDialog = (item: ChecklistItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setItemFormData({
        checklist_id: item.checklist_id,
        name: item.name,
        description: item.description,
        order_index: item.order_index || 0,
      });
    } else {
      setEditingItem(null);
      setItemFormData({
        checklist_id: selectedChecklist?.id || '',
        name: '',
        description: null,
        order_index: checklistItems.length,
      });
    }
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    try {
      setError(null);

      if (!itemFormData.name.trim()) {
        setError('Le nom de l\'item est obligatoire');
        return;
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('checklist_items')
          .update({
            ...itemFormData as ChecklistItemUpdate,
            employee_id: employee?.id || null,
            user_id: user?.id || null
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        setSuccess('Item mis à jour avec succès');
      } else {
        // Create new item
        const { error } = await supabase
          .from('checklist_items')
          .insert([{
            ...itemFormData,
            employee_id: employee?.id || null,
            user_id: user?.id || null,
          }]);

        if (error) throw error;
        setSuccess('Item créé avec succès');
      }

      await loadChecklistItems(selectedChecklist?.id || '');
      setItemDialogOpen(false);
      setEditingItem(null);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'item:', err);
      setError('Erreur lors de la sauvegarde de l\'item');
    }
  };

  const handleDeleteItem = async (item: ChecklistItem) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setSuccess('Item supprimé avec succès');
      await loadChecklistItems(selectedChecklist?.id || '');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'item:', err);
      setError('Erreur lors de la suppression de l\'item');
    }
  };

  const handleCreateDefaultChecklist = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!employee?.organization_id) {
        setError('Organisation non trouvée');
        return;
      }

      // Créer la checklist par défaut
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklists')
        .insert([{
          name: 'Checklist HACCP de base',
          description: 'Points de contrôle essentiels pour la sécurité alimentaire',
          category: 'hygiene',
          frequency: 'daily',
          is_active: true,
          organization_id: employee.organization_id,
          employee_id: employee.id,
          user_id: user?.id || null,
        }])
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Créer les items par défaut
      const defaultItems = [
        {
          name: 'Stockage au sol',
          description: 'Aucun stockage sur le sol',
          order_index: 0,
        },
        {
          name: 'Dates d\'expiration',
          description: 'Dates d\'expiration vérifiées dans mes frigos/congélateurs',
          order_index: 1,
        },
        {
          name: 'Étiquetage des produits',
          description: 'Tous les produits ouverts sont filmés/étiquetés',
          order_index: 2,
        },
        {
          name: 'Port de bijoux',
          description: 'Le personnel de cuisine ne porte aucun bijou/montre',
          order_index: 3,
        },
        {
          name: 'Zone de stockage',
          description: 'Aucun carton dans la zone de stockage',
          order_index: 4,
        },
        {
          name: 'Tenue du personnel',
          description: 'Le personnel de cuisine porte une tenue propre',
          order_index: 5,
        },
      ];

      const itemsToInsert = defaultItems.map(item => ({
        ...item,
        checklist_id: checklistData.id,
        employee_id: employee.id,
        user_id: user?.id || null,
      }));

      const { error: itemsError } = await supabase
        .from('checklist_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      setSuccess('Checklist HACCP par défaut créée avec succès avec 6 points de contrôle !');
      await loadChecklists();
      
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Erreur lors de la création de la checklist par défaut:', err);
      setError('Erreur lors de la création de la checklist par défaut');
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };

  const getFrequencyLabel = (frequency: string) => {
    const freq = frequencies.find(f => f.value === frequency);
    return freq?.label || frequency;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChecklistIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Administration des Checklists
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Gestion des checklists HACCP - Créer, modifier et supprimer
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <ChecklistIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Checklists
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {checklists.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <ChecklistIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Actives
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {checklists.filter(c => c.is_active).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <ChecklistIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Quotidiennes
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {checklists.filter(c => c.frequency === 'daily').length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <ChecklistIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Catégories
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {[...new Set(checklists.map(c => c.category))].length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Add Buttons */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ChecklistIcon />}
          onClick={handleCreateDefaultChecklist}
          sx={{ 
            px: 3, 
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          Checklist HACCP par défaut
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            px: 3, 
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          Nouvelle Checklist
        </Button>
      </Box>

      {/* Checklists Table */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Catégorie</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fréquence</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date de création</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checklists.map((checklist) => (
                  <TableRow key={checklist.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <ChecklistIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {checklist.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryLabel(checklist.category)}
                        size="small"
                        sx={{ bgcolor: 'primary.50', color: 'primary.main' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getFrequencyLabel(checklist.frequency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {checklist.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={checklist.is_active ? 'Active' : 'Inactive'}
                        color={checklist.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(checklist.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenItems(checklist)}
                          sx={{ color: 'info.main' }}
                          title="Gérer les items"
                        >
                          <ListIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(checklist)}
                          sx={{ color: 'primary.main' }}
                          title="Modifier"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setChecklistToDelete(checklist);
                            setDeleteDialogOpen(true);
                          }}
                          sx={{ color: 'error.main' }}
                          title="Supprimer"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {checklists.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Aucune checklist trouvée
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3 }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {editingChecklist ? 'Modifier la Checklist' : 'Nouvelle Checklist'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, pt: 1 }}>
            <TextField
              label="Nom de la checklist *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
            />

            <FormControl>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                label="Catégorie"
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Fréquence</InputLabel>
              <Select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                label="Fréquence"
              >
                {frequencies.map((frequency) => (
                  <MenuItem key={frequency.value} value={frequency.value}>
                    {frequency.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
              fullWidth
              multiline
              rows={3}
              sx={{ gridColumn: '1 / -1' }}
            />

            <Box sx={{ gridColumn: '1 / -1' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Checklist active"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>
            {editingChecklist ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la checklist &quot;{checklistToDelete?.name}&quot; ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Items Management Dialog */}
      <Dialog 
        open={itemsDialogOpen} 
        onClose={() => setItemsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, height: '80vh' }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              <ListIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Points de contrôle</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedChecklist?.name}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenItemDialog()}
              sx={{ borderRadius: 2 }}
            >
              Nouveau point de contrôle
            </Button>
          </Box>

          {checklistItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                <AssignmentIcon />
              </Avatar>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun point de contrôle
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                Cette checklist n&apos;a pas encore de points de contrôle configurés
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenItemDialog()}
              >
                Ajouter le premier point
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {checklistItems.map((item, index) => (
                <Card key={item.id} variant="outlined">
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white', 
                        borderRadius: '50%', 
                        width: 24, 
                        height: 24, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        flexShrink: 0,
                        mt: 0.5
                      }}>
                        {index + 1}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                          ✅ {item.name}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {item.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 6, height: 6, bgcolor: 'success.main', borderRadius: '50%' }} />
                            Oui - Conforme ✓
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 6, height: 6, bgcolor: 'error.main', borderRadius: '50%' }} />
                            Non
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 6, height: 6, bgcolor: 'grey.400', borderRadius: '50%' }} />
                            Non évalué
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenItemDialog(item)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(item)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setItemsDialogOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Item Create/Edit Dialog */}
      <Dialog 
        open={itemDialogOpen} 
        onClose={() => setItemDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3 }
          }
        }}
      >
        <DialogTitle>
          {editingItem ? 'Modifier le point de contrôle' : 'Nouveau point de contrôle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="Nom du point de contrôle *"
              value={itemFormData.name}
              onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
              fullWidth
              placeholder="Ex: Stockage au sol"
            />

            <TextField
              label="Description"
              value={itemFormData.description || ''}
              onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value || null })}
              fullWidth
              multiline
              rows={3}
              placeholder="Ex: Aucun stockage sur le sol"
            />

            <TextField
              label="Ordre d'affichage"
              type="number"
              value={itemFormData.order_index}
              onChange={(e) => setItemFormData({ ...itemFormData, order_index: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Détermine l'ordre d'affichage dans la checklist"
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Options de réponse automatiques :</strong><br />
                • ✅ Oui - Conforme<br />
                • ❌ Non<br />
                • ➖ Non évalué
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setItemDialogOpen(false)} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSaveItem} startIcon={<SaveIcon />}>
            {editingItem ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}