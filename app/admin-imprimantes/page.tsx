"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Print,
  Add,
  Edit,
  Delete,
  Settings,
  Wifi,
  Usb,
  Bluetooth,
  Close,
  Save,
  Cancel
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/src/types/database';
import { useSnackbar } from 'notistack';

type Printer = Tables<'printers'>;

export default function PrintersAdmin() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [formData, setFormData] = useState<TablesInsert<'printers'>>({
    name: '',
    model: '',
    connection_type: 'usb',
    address: '',
    label_size: '62mm_continuous',
    is_active: true,
    organization_id: null,
    user_id: null,
    employee_id: null,
    print_format: {}
  });

  const { enqueueSnackbar } = useSnackbar();

  const connectionTypes = [
    { value: 'usb', label: 'USB', icon: Usb },
    { value: 'network', label: 'Réseau (IP)', icon: Wifi },
    { value: 'bluetooth', label: 'Bluetooth', icon: Bluetooth }
  ];

  const labelSizes = [
    '62mm_continuous',
    '29mm_90x29mm',
    '38mm_90x38mm',
    '17mm_54x17mm',
    'custom'
  ];

  const fetchPrinters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('printers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setPrinters(data);
    } catch (error) {
      console.error('Error fetching printers:', error);
      enqueueSnackbar('Erreur lors du chargement des imprimantes', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  const handleOpenModal = (printer?: Printer) => {
    if (printer) {
      setEditingPrinter(printer);
      setFormData({
        name: printer.name,
        model: printer.model,
        connection_type: printer.connection_type,
        address: printer.address || '',
        label_size: printer.label_size || '62mm_continuous',
        is_active: printer.is_active ?? true,
        organization_id: printer.organization_id,
        user_id: printer.user_id,
        employee_id: printer.employee_id,
        print_format: printer.print_format || {}
      });
    } else {
      setEditingPrinter(null);
      setFormData({
        name: '',
        model: '',
        connection_type: 'usb',
        address: '',
        label_size: '62mm_continuous',
        is_active: true,
        organization_id: null,
        user_id: null,
        employee_id: null,
        print_format: {}
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPrinter(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPrinter) {
        // Modification
        const updateData: TablesUpdate<'printers'> = {
          name: formData.name,
          model: formData.model,
          connection_type: formData.connection_type,
          address: formData.address || null,
          label_size: formData.label_size,
          is_active: formData.is_active,
          print_format: formData.print_format,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('printers')
          .update(updateData)
          .eq('id', editingPrinter.id);

        if (error) throw error;
        enqueueSnackbar('Imprimante mise à jour avec succès!', { variant: 'success' });
      } else {
        // Création
        const { error } = await supabase
          .from('printers')
          .insert([formData]);

        if (error) throw error;
        enqueueSnackbar('Imprimante ajoutée avec succès!', { variant: 'success' });
      }

      await fetchPrinters();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving printer:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (printer: Printer) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'imprimante "${printer.name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('printers')
        .delete()
        .eq('id', printer.id);

      if (error) throw error;
      
      enqueueSnackbar('Imprimante supprimée avec succès!', { variant: 'success' });
      await fetchPrinters();
    } catch (error) {
      console.error('Error deleting printer:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  const getConnectionIcon = (type: string) => {
    const connectionType = connectionTypes.find(ct => ct.value === type);
    return connectionType ? connectionType.icon : Settings;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                width: 80,
                height: 80,
              }}
            >
              <Print fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                Administration des Imprimantes
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                Gérer les imprimantes d&apos;étiquettes de l&apos;organisation
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {printers.length} imprimante{printers.length > 1 ? 's' : ''} configurée{printers.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            Ajouter une imprimante
          </Button>
        </Box>
      </Paper>

      <Container maxWidth="xl">
        {/* Liste des imprimantes */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Imprimantes configurées
            </Typography>
            
            {printers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  Aucune imprimante configurée
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => handleOpenModal()}
                  sx={{ mt: 2 }}
                >
                  Ajouter la première imprimante
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Modèle</TableCell>
                      <TableCell>Connexion</TableCell>
                      <TableCell>Adresse</TableCell>
                      <TableCell>Taille étiquettes</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {printers.map((printer) => {
                      const ConnectionIcon = getConnectionIcon(printer.connection_type);
                      return (
                        <TableRow key={printer.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                                <Print fontSize="small" />
                              </Avatar>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {printer.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{printer.model}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ConnectionIcon fontSize="small" />
                              {connectionTypes.find(ct => ct.value === printer.connection_type)?.label}
                            </Box>
                          </TableCell>
                          <TableCell>{printer.address || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={printer.label_size || 'Non défini'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={printer.is_active ? 'Active' : 'Inactive'}
                              color={printer.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenModal(printer)}
                                color="primary"
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(printer)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Modal d'ajout/édition */}
        <Dialog 
          open={modalOpen} 
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editingPrinter ? 'Modifier l\'imprimante' : 'Ajouter une imprimante'}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <Close />
            </IconButton>
          </DialogTitle>
          
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Stack spacing={3}>
                <TextField
                  label="Nom de l'imprimante"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  fullWidth
                  helperText="Nom interne pour identifier l'imprimante"
                />

                <TextField
                  label="Modèle"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  required
                  fullWidth
                  placeholder="Ex: Brother QL-820NWB, Dymo LabelWriter..."
                />

                <FormControl fullWidth>
                  <InputLabel>Type de connexion</InputLabel>
                  <Select
                    value={formData.connection_type}
                    label="Type de connexion"
                    onChange={(e) => setFormData({...formData, connection_type: e.target.value})}
                  >
                    {connectionTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon fontSize="small" />
                            {type.label}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                <TextField
                  label="Adresse"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  fullWidth
                  helperText={
                    formData.connection_type === 'network' ? 'Adresse IP (ex: 192.168.1.100)' :
                    formData.connection_type === 'bluetooth' ? 'Adresse MAC Bluetooth' :
                    'Chemin USB ou port série'
                  }
                  placeholder={
                    formData.connection_type === 'network' ? '192.168.1.100' :
                    formData.connection_type === 'bluetooth' ? 'AA:BB:CC:DD:EE:FF' :
                    '/dev/usb/lp0'
                  }
                />

                <FormControl fullWidth>
                  <InputLabel>Taille des étiquettes</InputLabel>
                  <Select
                    value={formData.label_size}
                    label="Taille des étiquettes"
                    onChange={(e) => setFormData({...formData, label_size: e.target.value})}
                  >
                    {labelSizes.map((size) => (
                      <MenuItem key={size} value={size}>
                        {size.replace('_', ' - ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                  }
                  label="Imprimante active"
                />
              </Stack>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseModal} startIcon={<Cancel />}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
                startIcon={<Save />}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
}