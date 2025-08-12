"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';

type CleaningTask = Tables<'cleaning_tasks'>;
type CleaningTaskInsert = TablesInsert<'cleaning_tasks'>;
type CleaningTaskUpdate = TablesUpdate<'cleaning_tasks'>;
type CleaningZone = Tables<'cleaning_zones'>;
type CleaningSubZone = Tables<'cleaning_sub_zones'>;
type CleaningProduct = Tables<'cleaning_products'>;
type CleaningEquipment = Tables<'cleaning_equipment'>;
type CleaningMethod = Tables<'cleaning_methods'>;

export default function AdminPlanNettoyagePage() {
  const { selectedEmployee } = useEmployee();
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [zones, setZones] = useState<CleaningZone[]>([]);
  const [subZones, setSubZones] = useState<CleaningSubZone[]>([]);
  const [products, setProducts] = useState<CleaningProduct[]>([]);
  const [equipment, setEquipment] = useState<CleaningEquipment[]>([]);
  const [methods, setMethods] = useState<CleaningMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CleaningTask | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<CleaningTask | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CleaningTaskInsert>({
    name: '',
    frequency: 'daily',
    frequency_days: null,
    action_to_perform: '',
    cleaning_zone_id: null,
    cleaning_sub_zone_id: null,
    cleaning_product_id: null,
    cleaning_equipment_id: null,
    cleaning_method_id: null,
    responsible_role: null,
    is_active: true,
  });

  const frequencies = [
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'custom', label: 'Personnalisée (jours)' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all necessary data
      const [
        tasksResult,
        zonesResult,
        subZonesResult,
        productsResult,
        equipmentResult,
        methodsResult
      ] = await Promise.all([
        supabase.from('cleaning_tasks').select('*').order('name'),
        supabase.from('cleaning_zones').select('*').order('name'),
        supabase.from('cleaning_sub_zones').select('*').order('name'),
        supabase.from('cleaning_products').select('*').eq('is_active', true).order('name'),
        supabase.from('cleaning_equipment').select('*').eq('is_active', true).order('name'),
        supabase.from('cleaning_methods').select('*').order('name'),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (zonesResult.error) throw zonesResult.error;
      if (subZonesResult.error) throw subZonesResult.error;
      if (productsResult.error) throw productsResult.error;
      if (equipmentResult.error) throw equipmentResult.error;
      if (methodsResult.error) throw methodsResult.error;

      setTasks(tasksResult.data || []);
      setZones(zonesResult.data || []);
      setSubZones(subZonesResult.data || []);
      setProducts(productsResult.data || []);
      setEquipment(equipmentResult.data || []);
      setMethods(methodsResult.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (task: CleaningTask | null = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.name,
        frequency: task.frequency,
        frequency_days: task.frequency_days,
        action_to_perform: task.action_to_perform,
        cleaning_zone_id: task.cleaning_zone_id,
        cleaning_sub_zone_id: task.cleaning_sub_zone_id,
        cleaning_product_id: task.cleaning_product_id,
        cleaning_equipment_id: task.cleaning_equipment_id,
        cleaning_method_id: task.cleaning_method_id,
        responsible_role: task.responsible_role,
        is_active: task.is_active ?? true,
      });
    } else {
      setEditingTask(null);
      setFormData({
        name: '',
        frequency: 'daily',
        frequency_days: null,
        action_to_perform: '',
        cleaning_zone_id: null,
        cleaning_sub_zone_id: null,
        cleaning_product_id: null,
        cleaning_equipment_id: null,
        cleaning_method_id: null,
        responsible_role: null,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
    // Ne pas réinitialiser les messages d'erreur/succès ici pour qu'ils restent visibles
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.name.trim() || !formData.action_to_perform.trim()) {
        setError('Le nom et l\'action à effectuer sont obligatoires');
        return;
      }

      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from('cleaning_tasks')
          .update({
            ...formData as CleaningTaskUpdate,
            employee_id: selectedEmployee?.id || null
          })
          .eq('id', editingTask.id);

        if (error) throw error;
        setSuccess('Tâche mise à jour avec succès');
      } else {
        // Create new task
        const { error } = await supabase
          .from('cleaning_tasks')
          .insert([{
            ...formData,
            employee_id: selectedEmployee?.id || null
          }]);

        if (error) throw error;
        setSuccess('Tâche créée avec succès');
      }

      await loadData();
      handleCloseDialog();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;

    try {
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('cleaning_tasks')
        .delete()
        .eq('id', taskToDelete.id);

      if (error) throw error;

      setSuccess('Tâche supprimée avec succès');
      await loadData();
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const getZoneName = (zoneId: string | null) => {
    if (!zoneId) return '-';
    const zone = zones.find(z => z.id === zoneId);
    return zone?.name || '-';
  };

  const getSubZoneName = (subZoneId: string | null) => {
    if (!subZoneId) return '-';
    const subZone = subZones.find(sz => sz.id === subZoneId);
    return subZone?.name || '-';
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return '-';
    const product = products.find(p => p.id === productId);
    return product?.name || '-';
  };

  const getEquipmentName = (equipmentId: string | null) => {
    if (!equipmentId) return '-';
    const eq = equipment.find(e => e.id === equipmentId);
    return eq?.name || '-';
  };

  const getMethodName = (methodId: string | null) => {
    if (!methodId) return '-';
    const method = methods.find(m => m.id === methodId);
    return method?.name || '-';
  };

  const getFrequencyLabel = (frequency: string, frequencyDays?: number | null) => {
    const freq = frequencies.find(f => f.value === frequency);
    if (frequency === 'custom' && frequencyDays) {
      return `Tous les ${frequencyDays} jour(s)`;
    }
    return freq?.label || frequency;
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            <AdminIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Administration du Plan de Nettoyage
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Gestion des tâches de nettoyage - Créer, modifier et supprimer
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
          Nouvelle Tâche
        </Button>
      </Box>

      {/* Tasks Table */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Zone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sous-zone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fréquence</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Produit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Équipement</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Méthode</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {task.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{getZoneName(task.cleaning_zone_id)}</TableCell>
                    <TableCell>{getSubZoneName(task.cleaning_sub_zone_id)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getFrequencyLabel(task.frequency, task.frequency_days)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.action_to_perform}
                      </Typography>
                    </TableCell>
                    <TableCell>{getProductName(task.cleaning_product_id)}</TableCell>
                    <TableCell>{getEquipmentName(task.cleaning_equipment_id)}</TableCell>
                    <TableCell>{getMethodName(task.cleaning_method_id)}</TableCell>
                    <TableCell>
                      <Chip
                        label={task.is_active ? 'Actif' : 'Inactif'}
                        color={task.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(task)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setTaskToDelete(task);
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
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Aucune tâche de nettoyage trouvée
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
          {editingTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, pt: 1 }}>
            <TextField
              label="Nom de la tâche *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
            />

            <FormControl>
              <InputLabel>Zone</InputLabel>
              <Select
                value={formData.cleaning_zone_id || ''}
                onChange={(e) => setFormData({ ...formData, cleaning_zone_id: e.target.value || null })}
                label="Zone"
              >
                <MenuItem value="">
                  <em>Aucune</em>
                </MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Sous-zone</InputLabel>
              <Select
                value={formData.cleaning_sub_zone_id || ''}
                onChange={(e) => setFormData({ ...formData, cleaning_sub_zone_id: e.target.value || null })}
                label="Sous-zone"
              >
                <MenuItem value="">
                  <em>Aucune</em>
                </MenuItem>
                {subZones.map((subZone) => (
                  <MenuItem key={subZone.id} value={subZone.id}>
                    {subZone.name}
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
                {frequencies.map((freq) => (
                  <MenuItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.frequency === 'custom' && (
              <TextField
                label="Nombre de jours"
                type="number"
                value={formData.frequency_days || ''}
                onChange={(e) => setFormData({ ...formData, frequency_days: e.target.value ? parseInt(e.target.value) : null })}
                fullWidth
              />
            )}

            <TextField
              label="Action à effectuer *"
              value={formData.action_to_perform}
              onChange={(e) => setFormData({ ...formData, action_to_perform: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{ gridColumn: '1 / -1' }}
            />

            <FormControl>
              <InputLabel>Produit de nettoyage</InputLabel>
              <Select
                value={formData.cleaning_product_id || ''}
                onChange={(e) => setFormData({ ...formData, cleaning_product_id: e.target.value || null })}
                label="Produit de nettoyage"
              >
                <MenuItem value="">
                  <em>Aucun</em>
                </MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Équipement</InputLabel>
              <Select
                value={formData.cleaning_equipment_id || ''}
                onChange={(e) => setFormData({ ...formData, cleaning_equipment_id: e.target.value || null })}
                label="Équipement"
              >
                <MenuItem value="">
                  <em>Aucun</em>
                </MenuItem>
                {equipment.map((eq) => (
                  <MenuItem key={eq.id} value={eq.id}>
                    {eq.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Méthode</InputLabel>
              <Select
                value={formData.cleaning_method_id || ''}
                onChange={(e) => setFormData({ ...formData, cleaning_method_id: e.target.value || null })}
                label="Méthode"
              >
                <MenuItem value="">
                  <em>Aucune</em>
                </MenuItem>
                {methods.map((method) => (
                  <MenuItem key={method.id} value={method.id}>
                    {method.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Rôle responsable"
              value={formData.responsible_role || ''}
              onChange={(e) => setFormData({ ...formData, responsible_role: e.target.value || null })}
              fullWidth
            />

            <Box sx={{ gridColumn: '1 / -1' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Tâche active"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>
            {editingTask ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la tâche &quot;{taskToDelete?.name}&quot; ?
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