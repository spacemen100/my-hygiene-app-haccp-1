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
} from '@mui/icons-material';

type Checklist = Tables<'checklists'>;
type ChecklistInsert = TablesInsert<'checklists'>;
type ChecklistUpdate = TablesUpdate<'checklists'>;

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
  
  // Form state
  const [formData, setFormData] = useState<ChecklistInsert>({
    name: '',
    description: null,
    category: 'hygiene',
    frequency: 'daily',
    is_active: true,
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
      });
    } else {
      setEditingChecklist(null);
      setFormData({
        name: '',
        description: null,
        category: 'hygiene',
        frequency: 'daily',
        is_active: true,
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

      {/* Add Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
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
                          onClick={() => handleOpenDialog(checklist)}
                          sx={{ color: 'primary.main' }}
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
        PaperProps={{
          sx: { borderRadius: 3 }
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
    </Container>
  );
}