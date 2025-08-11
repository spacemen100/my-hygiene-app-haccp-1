'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Room as ZoneIcon,
  LocationOn as SubZoneIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/components/AuthProvider';
import { useEmployee } from '@/contexts/EmployeeContext';

// Types pour les zones et sous-zones
interface CleaningZone {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
  employee_id: string | null;
  user_id: string | null;
  sub_zones?: CleaningSubZone[];
}

interface CleaningSubZone {
  id: string;
  cleaning_zone_id: string;
  name: string;
  description: string | null;
  created_at: string;
  employee_id: string | null;
  user_id: string | null;
}

interface FormData {
  name: string;
  description: string;
}

export default function AdminZonesNettoyagePage() {
  const { session } = useAuth();
  const { employee: currentEmployee } = useEmployee();
  const { enqueueSnackbar } = useSnackbar();

  // États pour les zones
  const [zones, setZones] = useState<CleaningZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | false>(false);
  
  // États pour les dialogues
  const [openZoneDialog, setOpenZoneDialog] = useState(false);
  const [openSubZoneDialog, setOpenSubZoneDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<CleaningZone | null>(null);
  const [editingSubZone, setEditingSubZone] = useState<CleaningSubZone | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  
  // Formulaires
  const [zoneForm, setZoneForm] = useState<FormData>({ name: '', description: '' });
  const [subZoneForm, setSubZoneForm] = useState<FormData>({ name: '', description: '' });
  
  const [saving, setSaving] = useState(false);

  // Récupérer les zones et sous-zones
  const fetchZonesAndSubZones = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      
      // Récupérer les zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('cleaning_zones')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name');

      if (zonesError) throw zonesError;

      // Récupérer les sous-zones pour chaque zone
      const zonesWithSubZones = await Promise.all(
        (zonesData || []).map(async (zone) => {
          const { data: subZonesData, error: subZonesError } = await supabase
            .from('cleaning_sub_zones')
            .select('*')
            .eq('cleaning_zone_id', zone.id)
            .order('name');

          if (subZonesError) {
            console.error('Erreur lors de la récupération des sous-zones:', subZonesError);
            return { ...zone, sub_zones: [] };
          }

          return { ...zone, sub_zones: subZonesData || [] };
        })
      );

      setZones(zonesWithSubZones);
    } catch (error) {
      console.error('Erreur lors de la récupération des zones:', error);
      enqueueSnackbar('Erreur lors de la récupération des zones', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, enqueueSnackbar]);

  useEffect(() => {
    fetchZonesAndSubZones();
  }, [fetchZonesAndSubZones]);

  // Gérer l'expansion des accordéons
  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Ouvrir le dialogue pour une nouvelle zone
  const handleNewZone = () => {
    setEditingZone(null);
    setZoneForm({ name: '', description: '' });
    setOpenZoneDialog(true);
  };

  // Ouvrir le dialogue pour modifier une zone
  const handleEditZone = (zone: CleaningZone) => {
    setEditingZone(zone);
    setZoneForm({ name: zone.name, description: zone.description || '' });
    setOpenZoneDialog(true);
  };

  // Ouvrir le dialogue pour une nouvelle sous-zone
  const handleNewSubZone = (zoneId: string) => {
    setEditingSubZone(null);
    setSelectedZoneId(zoneId);
    setSubZoneForm({ name: '', description: '' });
    setOpenSubZoneDialog(true);
  };

  // Ouvrir le dialogue pour modifier une sous-zone
  const handleEditSubZone = (subZone: CleaningSubZone) => {
    setEditingSubZone(subZone);
    setSelectedZoneId(subZone.cleaning_zone_id);
    setSubZoneForm({ name: subZone.name, description: subZone.description || '' });
    setOpenSubZoneDialog(true);
  };

  // Sauvegarder une zone
  const handleSaveZone = async () => {
    if (!zoneForm.name.trim() || !session?.user?.id) {
      enqueueSnackbar('Le nom de la zone est requis', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);

      const zoneData = {
        name: zoneForm.name.trim(),
        description: zoneForm.description.trim() || null,
        user_id: session.user.id,
        employee_id: currentEmployee?.id || null,
        organization_id: currentEmployee?.organization_id || null,
      };

      if (editingZone) {
        // Modification
        const { error } = await supabase
          .from('cleaning_zones')
          .update(zoneData)
          .eq('id', editingZone.id);

        if (error) throw error;
        enqueueSnackbar('Zone modifiée avec succès', { variant: 'success' });
      } else {
        // Création
        const { error } = await supabase
          .from('cleaning_zones')
          .insert(zoneData);

        if (error) throw error;
        enqueueSnackbar('Zone créée avec succès', { variant: 'success' });
      }

      setOpenZoneDialog(false);
      fetchZonesAndSubZones();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la zone:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde de la zone', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Sauvegarder une sous-zone
  const handleSaveSubZone = async () => {
    if (!subZoneForm.name.trim() || !selectedZoneId || !session?.user?.id) {
      enqueueSnackbar('Le nom de la sous-zone est requis', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);

      const subZoneData = {
        name: subZoneForm.name.trim(),
        description: subZoneForm.description.trim() || null,
        cleaning_zone_id: selectedZoneId,
        user_id: session.user.id,
        employee_id: currentEmployee?.id || null,
      };

      if (editingSubZone) {
        // Modification
        const { error } = await supabase
          .from('cleaning_sub_zones')
          .update(subZoneData)
          .eq('id', editingSubZone.id);

        if (error) throw error;
        enqueueSnackbar('Sous-zone modifiée avec succès', { variant: 'success' });
      } else {
        // Création
        const { error } = await supabase
          .from('cleaning_sub_zones')
          .insert(subZoneData);

        if (error) throw error;
        enqueueSnackbar('Sous-zone créée avec succès', { variant: 'success' });
      }

      setOpenSubZoneDialog(false);
      fetchZonesAndSubZones();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la sous-zone:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde de la sous-zone', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une zone
  const handleDeleteZone = async (zone: CleaningZone) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la zone "${zone.name}" ? Cela supprimera également toutes les sous-zones associées.`)) {
      return;
    }

    try {
      // Supprimer d'abord les sous-zones
      const { error: subZonesError } = await supabase
        .from('cleaning_sub_zones')
        .delete()
        .eq('cleaning_zone_id', zone.id);

      if (subZonesError) throw subZonesError;

      // Puis supprimer la zone
      const { error: zoneError } = await supabase
        .from('cleaning_zones')
        .delete()
        .eq('id', zone.id);

      if (zoneError) throw zoneError;

      enqueueSnackbar('Zone supprimée avec succès', { variant: 'success' });
      fetchZonesAndSubZones();
    } catch (error) {
      console.error('Erreur lors de la suppression de la zone:', error);
      enqueueSnackbar('Erreur lors de la suppression de la zone', { variant: 'error' });
    }
  };

  // Supprimer une sous-zone
  const handleDeleteSubZone = async (subZone: CleaningSubZone) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la sous-zone "${subZone.name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cleaning_sub_zones')
        .delete()
        .eq('id', subZone.id);

      if (error) throw error;

      enqueueSnackbar('Sous-zone supprimée avec succès', { variant: 'success' });
      fetchZonesAndSubZones();
    } catch (error) {
      console.error('Erreur lors de la suppression de la sous-zone:', error);
      enqueueSnackbar('Erreur lors de la suppression de la sous-zone', { variant: 'error' });
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
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
          color: 'white',
          p: { xs: '1.5rem 1rem', sm: '2rem 1.5rem', md: '2.5rem 2rem' },
          mb: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          borderRadius: { xs: 0, sm: 2, md: 3 },
          mx: { xs: '-0.75rem', sm: 0 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ZoneIcon sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
          <Typography 
            variant="h1" 
            component="h1"
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              lineHeight: 1.2
            }}
          >
            Administrateur Zones et Sous-zones de Nettoyage
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
          Gérez les zones et sous-zones de nettoyage de votre organisation
        </Typography>
      </Paper>

      {/* Actions principales */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: { xs: 2, md: 3 },
        flexWrap: 'wrap'
      }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewZone}
          sx={{
            bgcolor: '#4caf50',
            '&:hover': { bgcolor: '#388e3c' }
          }}
        >
          Nouvelle Zone
        </Button>
      </Box>

      {/* Liste des zones */}
      {zones.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune zone de nettoyage configurée. Commencez par créer une nouvelle zone.
        </Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          {zones.map((zone) => (
            <Accordion
              key={zone.id}
              expanded={expanded === zone.id}
              onChange={handleChange(zone.id)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 2
                  }
                }}
              >
                <ZoneIcon color="primary" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {zone.name}
                  </Typography>
                  {zone.description && (
                    <Typography variant="body2" color="text.secondary">
                      {zone.description}
                    </Typography>
                  )}
                </Box>
                <Chip 
                  label={`${zone.sub_zones?.length || 0} sous-zone${zone.sub_zones?.length !== 1 ? 's' : ''}`}
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ pl: 2 }}>
                  {/* Actions pour la zone */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mb: 2, 
                    flexWrap: 'wrap' 
                  }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditZone(zone)}
                    >
                      Modifier Zone
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteZone(zone)}
                    >
                      Supprimer Zone
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleNewSubZone(zone.id)}
                      sx={{ ml: 'auto' }}
                    >
                      Ajouter Sous-zone
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Liste des sous-zones */}
                  {zone.sub_zones && zone.sub_zones.length > 0 ? (
                    <List dense>
                      {zone.sub_zones.map((subZone) => (
                        <ListItem
                          key={subZone.id}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1
                          }}
                        >
                          <SubZoneIcon color="secondary" sx={{ mr: 2 }} />
                          <ListItemText
                            primary={subZone.name}
                            secondary={subZone.description}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Modifier">
                              <IconButton
                                size="small"
                                onClick={() => handleEditSubZone(subZone)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteSubZone(subZone)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">
                      Aucune sous-zone définie pour cette zone.
                    </Alert>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Dialog pour créer/modifier une zone */}
      <Dialog
        open={openZoneDialog}
        onClose={() => setOpenZoneDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          {editingZone ? 'Modifier la zone' : 'Nouvelle zone de nettoyage'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom de la zone"
              value={zoneForm.name}
              onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Description (optionnel)"
              value={zoneForm.description}
              onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenZoneDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveZone}
            variant="contained"
            disabled={saving || !zoneForm.name.trim()}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour créer/modifier une sous-zone */}
      <Dialog
        open={openSubZoneDialog}
        onClose={() => setOpenSubZoneDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          {editingSubZone ? 'Modifier la sous-zone' : 'Nouvelle sous-zone'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom de la sous-zone"
              value={subZoneForm.name}
              onChange={(e) => setSubZoneForm({ ...subZoneForm, name: e.target.value })}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Description (optionnel)"
              value={subZoneForm.description}
              onChange={(e) => setSubZoneForm({ ...subZoneForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubZoneDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveSubZone}
            variant="contained"
            disabled={saving || !subZoneForm.name.trim()}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}