"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Kitchen,
  Save,
  Close
} from '@mui/icons-material';

type Equipment = Tables<'equipments'>;

export default function EquipmentAdmin() {
  const { employee } = useEmployee();
  const { enqueueSnackbar } = useSnackbar();
  
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [formState, setFormState] = useState<Partial<TablesInsert<'equipments'>>({
    name: '',
    equipment_type: 'fryer',
    equipment_state: true,
    oil_capacity: null,
    oil_type: '',
    temperature_monitoring: true,
    min_temperature: 160,
    max_temperature: 180,
    polarity_monitoring: true,
    min_polarity: 0,
    max_polarity: 25,
    location: ''
  });

  // Fetch des équipements
  const fetchEquipments = useCallback(async () => {
    if (!employee?.organization_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('organization_id', employee.organization_id)
        .order('name');

      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des équipements:', error);
      enqueueSnackbar('Erreur lors du chargement des équipements', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [employee?.organization_id, enqueueSnackbar]);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  // Ouvrir le dialogue pour un nouvel équipement
  const handleNewEquipment = () => {
    setCurrentEquipment(null);
    setFormState({
      name: '',
      equipment_type: 'fryer',
      equipment_state: true,
      oil_capacity: null,
      oil_type: '',
      temperature_monitoring: true,
      min_temperature: 160,
      max_temperature: 180,
      polarity_monitoring: true,
      min_polarity: 0,
      max_polarity: 25,
      location: ''
    });
    setDialogOpen(true);
  };

  // Ouvrir le dialogue pour modifier un équipement
  const handleEditEquipment = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setFormState({
      name: equipment.name,
      equipment_type: equipment.equipment_type,
      equipment_state: equipment.equipment_state,
      oil_capacity: equipment.oil_capacity,
      oil_type: equipment.oil_type,
      temperature_monitoring: equipment.temperature_monitoring,
      min_temperature: equipment.min_temperature,
      max_temperature: equipment.max_temperature,
      polarity_monitoring: equipment.polarity_monitoring,
      min_polarity: equipment.min_polarity,
      max_polarity: equipment.max_polarity,
      location: equipment.location
    });
    setDialogOpen(true);
  };

  // Sauvegarder l'équipement
  const saveEquipment = async () => {
    if (!employee?.organization_id) return;
    
    try {
      if (currentEquipment) {
        // Mise à jour
        const { error } = await supabase
          .from('equipments')
          .update({
            ...formState,
            organization_id: employee.organization_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentEquipment.id);

        if (error) throw error;
        enqueueSnackbar('Équipement mis à jour avec succès', { variant: 'success' });
      } else {
        // Création
        const { error } = await supabase
          .from('equipments')
          .insert({
            ...formState,
            organization_id: employee.organization_id
          });

        if (error) throw error;
        enqueueSnackbar('Équipement créé avec succès', { variant: 'success' });
      }
      
      setDialogOpen(false);
      fetchEquipments();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde', { variant: 'error' });
    }
  };

  // Supprimer un équipement
  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      enqueueSnackbar('Équipement supprimé avec succès', { variant: 'success' });
      fetchEquipments();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  // Gérer les changements de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Gérer les changements de sélection
  const handleSelectChange = (e: { target: { name: string; value: string | boolean } }) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Gestion des équipements
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewEquipment}
        >
          Ajouter un équipement
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
          <CircularProgress />
        </Box>
      ) : equipments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500', mx: 'auto', mb: 2, width: 64, height: 64 }}>
              <Kitchen sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun équipement configuré
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Commencez par ajouter vos équipements de friture
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleNewEquipment}
            >
              Ajouter un équipement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type d&apos;huile</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Capacité (L)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Localisation</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipments.map((equipment) => (
                <TableRow key={equipment.id}>
                  <TableCell>{equipment.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={equipment.equipment_type === 'fryer' ? 'Friteuse' : 'Autre'} 
                      color={equipment.equipment_type === 'fryer' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{equipment.oil_type || '-'}</TableCell>
                  <TableCell>{equipment.oil_capacity || '-'}</TableCell>
                  <TableCell>{equipment.location || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={equipment.equipment_state ? 'Actif' : 'Inactif'} 
                      color={equipment.equipment_state ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditEquipment(equipment)}>
                      <Edit color="primary" />
                    </IconButton>
                    <IconButton onClick={() => deleteEquipment(equipment.id)}>
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialogue pour ajouter/modifier un équipement */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentEquipment ? "Modifier un équipement" : "Ajouter un nouvel équipement"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, pt: 2 }}>
            <TextField
              name="name"
              label="Nom de l'équipement"
              value={formState.name}
              onChange={handleChange}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>Type d&apos;équipement</InputLabel>
              <Select
                name="equipment_type"
                value={formState.equipment_type}
                label="Type d'équipement"
                onChange={handleSelectChange}
              >
                <MenuItem value="fryer">Friteuse</MenuItem>
                <MenuItem value="cooking">Appareil de cuisson</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              name="oil_type"
              label="Type d'huile"
              value={formState.oil_type || ''}
              onChange={handleChange}
              fullWidth
            />
            
            <TextField
              name="oil_capacity"
              label="Capacité d'huile (L)"
              type="number"
              value={formState.oil_capacity || ''}
              onChange={handleChange}
              fullWidth
              inputProps={{ step: "0.1", min: "0" }}
            />
            
            <TextField
              name="location"
              label="Localisation"
              value={formState.location || ''}
              onChange={handleChange}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                name="equipment_state"
                value={formState.equipment_state ? 'true' : 'false'}
                label="Statut"
                onChange={(e) => setFormState({...formState, equipment_state: e.target.value === 'true'})}
              >
                <MenuItem value="true">Actif</MenuItem>
                <MenuItem value="false">Inactif</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ gridColumn: '1 / -1', mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Surveillance de température
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <FormControl>
                  <InputLabel>Activer</InputLabel>
                  <Select
                    name="temperature_monitoring"
                    value={formState.temperature_monitoring ? 'true' : 'false'}
                    label="Activer"
                    onChange={(e) => setFormState({...formState, temperature_monitoring: e.target.value === 'true'})}
                  >
                    <MenuItem value="true">Oui</MenuItem>
                    <MenuItem value="false">Non</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  name="min_temperature"
                  label="Température min (°C)"
                  type="number"
                  value={formState.min_temperature || ''}
                  onChange={handleChange}
                  disabled={!formState.temperature_monitoring}
                  inputProps={{ step: "0.1" }}
                />
                
                <TextField
                  name="max_temperature"
                  label="Température max (°C)"
                  type="number"
                  value={formState.max_temperature || ''}
                  onChange={handleChange}
                  disabled={!formState.temperature_monitoring}
                  inputProps={{ step: "0.1" }}
                />
              </Box>
            </Box>
            
            <Box sx={{ gridColumn: '1 / -1', mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Surveillance de polarité
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <FormControl>
                  <InputLabel>Activer</InputLabel>
                  <Select
                    name="polarity_monitoring"
                    value={formState.polarity_monitoring ? 'true' : 'false'}
                    label="Activer"
                    onChange={(e) => setFormState({...formState, polarity_monitoring: e.target.value === 'true'})}
                  >
                    <MenuItem value="true">Oui</MenuItem>
                    <MenuItem value="false">Non</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  name="min_polarity"
                  label="Polarité min (%)"
                  type="number"
                  value={formState.min_polarity || ''}
                  onChange={handleChange}
                  disabled={!formState.polarity_monitoring}
                  inputProps={{ step: "0.1", min: "0", max: "100" }}
                />
                
                <TextField
                  name="max_polarity"
                  label="Polarité max (%)"
                  type="number"
                  value={formState.max_polarity || ''}
                  onChange={handleChange}
                  disabled={!formState.polarity_monitoring}
                  inputProps={{ step: "0.1", min: "0", max: "100" }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)} startIcon={<Close />}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={saveEquipment}
            startIcon={<Save />}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}