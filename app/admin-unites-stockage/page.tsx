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
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Kitchen as StorageIcon,
  Thermostat as TempIcon,
  LocationOn as LocationIcon,
  Category as TypeIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';

type ColdStorageUnit = Tables<'cold_storage_units'>;
type ColdStorageUnitInsert = TablesInsert<'cold_storage_units'>;
type ColdStorageUnitUpdate = TablesUpdate<'cold_storage_units'>;

export default function AdminUnitesStockagePage() {
  const { employee } = useEmployee();
  const [units, setUnits] = useState<ColdStorageUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ColdStorageUnit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<ColdStorageUnit | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ColdStorageUnitInsert>({
    name: '',
    type: 'réfrigérateur',
    location: '',
    min_temperature: 0,
    max_temperature: 4,
    is_active: true,
  });

  const storageTypes = [
    { value: 'réfrigérateur', label: 'Réfrigérateur', minTemp: 0, maxTemp: 4 },
    { value: 'congélateur', label: 'Congélateur', minTemp: -25, maxTemp: -18 },
    { value: 'chambre froide positive', label: 'Chambre froide positive', minTemp: 0, maxTemp: 8 },
    { value: 'chambre froide négative', label: 'Chambre froide négative', minTemp: -25, maxTemp: -15 },
    { value: 'vitrine réfrigérée', label: 'Vitrine réfrigérée', minTemp: 2, maxTemp: 6 },
    { value: 'cellule de refroidissement', label: 'Cellule de refroidissement', minTemp: -1, maxTemp: 3 },
    { value: 'autre', label: 'Autre', minTemp: 0, maxTemp: 4 },
  ];

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('cold_storage_units')
        .select('*')
        .order('name');

      if (error) throw error;
      setUnits(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des unités:', err);
      setError('Erreur lors du chargement des unités de stockage');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (unit: ColdStorageUnit | null = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        type: unit.type,
        location: unit.location,
        min_temperature: unit.min_temperature,
        max_temperature: unit.max_temperature,
        is_active: unit.is_active ?? true,
      });
    } else {
      setEditingUnit(null);
      const defaultType = storageTypes.find(type => type.value === 'réfrigérateur');
      setFormData({
        name: '',
        type: 'réfrigérateur',
        location: '',
        min_temperature: defaultType?.minTemp || 0,
        max_temperature: defaultType?.maxTemp || 4,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUnit(null);
    // Ne pas réinitialiser les messages d'erreur/succès ici pour qu'ils restent visibles
  };

  const handleTypeChange = (newType: string) => {
    const selectedType = storageTypes.find(type => type.value === newType);
    if (selectedType) {
      setFormData({
        ...formData,
        type: newType,
        min_temperature: selectedType.minTemp,
        max_temperature: selectedType.maxTemp,
      });
    } else {
      setFormData({
        ...formData,
        type: newType,
      });
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.name.trim() || !formData.location.trim()) {
        setError('Le nom et la localisation sont obligatoires');
        return;
      }

      if (formData.min_temperature >= formData.max_temperature) {
        setError('La température minimale doit être inférieure à la température maximale');
        return;
      }

      if (editingUnit) {
        // Update existing unit
        const { error } = await supabase
          .from('cold_storage_units')
          .update(formData as ColdStorageUnitUpdate)
          .eq('id', editingUnit.id);

        if (error) throw error;
        setSuccess('Unité de stockage mise à jour avec succès');
      } else {
        // Create new unit
        const { error } = await supabase
          .from('cold_storage_units')
          .insert([{
            ...formData,
            employee_id: employee?.id || null,
            user_id: employee?.user_id || null,
          }]);

        if (error) throw error;
        setSuccess('Unité de stockage créée avec succès');
      }

      await loadUnits();
      handleCloseDialog();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!unitToDelete) return;

    try {
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('cold_storage_units')
        .delete()
        .eq('id', unitToDelete.id);

      if (error) throw error;

      setSuccess('Unité de stockage supprimée avec succès');
      await loadUnits();
      setDeleteDialogOpen(false);
      setUnitToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'réfrigérateur': 'primary',
      'congélateur': 'info',
      'chambre froide positive': 'success',
      'chambre froide négative': 'warning',
      'vitrine réfrigérée': 'secondary',
      'cellule de refroidissement': 'error',
      'autre': 'default',
    } as const;
    return colors[type as keyof typeof colors] || 'default';
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
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
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
            <StorageIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Administration des Unités de Stockage
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Gestion des unités de stockage froid - Créer, modifier et supprimer
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
                <StorageIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Unités
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {units.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <ActiveIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Unités Actives
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {units.filter(u => u.is_active).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <TempIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Réfrigérateurs
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {units.filter(u => u.type === 'réfrigérateur').length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <TempIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Congélateurs
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {units.filter(u => u.type === 'congélateur').length}
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
          Nouvelle Unité de Stockage
        </Button>
      </Box>

      {/* Units Table */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Localisation</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Temp. Min (°C)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Temp. Max (°C)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date de création</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <StorageIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {unit.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={unit.type}
                        color={getTypeColor(unit.type)}
                        size="small"
                        icon={<TypeIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{unit.location}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TempIcon sx={{ fontSize: 16, color: 'info.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {unit.min_temperature}°C
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TempIcon sx={{ fontSize: 16, color: 'error.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {unit.max_temperature}°C
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={unit.is_active ? 'Actif' : 'Inactif'}
                        color={unit.is_active ? 'success' : 'default'}
                        size="small"
                        icon={unit.is_active ? <ActiveIcon /> : <InactiveIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(unit.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(unit)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setUnitToDelete(unit);
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
                {units.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Aucune unité de stockage trouvée
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
          {editingUnit ? 'Modifier l&apos;Unité de Stockage' : 'Nouvelle Unité de Stockage'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, pt: 1 }}>
            <TextField
              label="Nom de l&apos;unité *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Type d&apos;unité *</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                label="Type d&apos;unité *"
              >
                {storageTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        {type.minTemp}°C à {type.maxTemp}°C
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Localisation *"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Température minimale *"
              type="number"
              value={formData.min_temperature}
              onChange={(e) => setFormData({ ...formData, min_temperature: parseFloat(e.target.value) })}
              fullWidth
              helperText="🤖 Ajustée automatiquement selon le type - vous pouvez la modifier"
              InputProps={{
                endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                startAdornment: (
                  <InputAdornment position="start">
                    <TempIcon color="info" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(33, 150, 243, 0.04)',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                  }
                }
              }}
            />

            <TextField
              label="Température maximale *"
              type="number"
              value={formData.max_temperature}
              onChange={(e) => setFormData({ ...formData, max_temperature: parseFloat(e.target.value) })}
              fullWidth
              helperText="🤖 Ajustée automatiquement selon le type - vous pouvez la modifier"
              InputProps={{
                endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                startAdornment: (
                  <InputAdornment position="start">
                    <TempIcon color="error" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(244, 67, 54, 0.04)',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  }
                }
              }}
            />

            <Box sx={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Unité active"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>
            {editingUnit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l&apos;unité de stockage &quot;{unitToDelete?.name}&quot; ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible et supprimera également toutes les lectures de température associées.
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