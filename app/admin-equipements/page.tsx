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
  Build as EquipmentIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/components/AuthProvider';
import { useEmployee } from '@/contexts/EmployeeContext';

// Types pour les équipements
interface CleaningEquipment {
  id: string;
  organization_id: string | null;
  name: string;
  type: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  employee_id: string | null;
  user_id: string | null;
}

interface EquipmentFormData {
  name: string;
  type: string;
  description: string;
  is_active: boolean;
}

// Types d'équipements prédéfinis
const EQUIPMENT_TYPES = [
  'Aspirateur',
  'Nettoyeur haute pression',
  'Autolaveuse',
  'Monobrosse',
  'Balayeuse',
  'Chariot de nettoyage',
  'Seau et serpillière',
  'Éponges et chiffons',
  'Brosses',
  'Raclettes',
  'Pulvérisateur',
  'Équipement de protection individuelle',
  'Matériel de désinfection',
  'Autre'
];

export default function AdminEquipementsPage() {
  const { session, user } = useAuth();
  const { employee: currentEmployee } = useEmployee();
  const { enqueueSnackbar } = useSnackbar();

  // États pour les équipements
  const [equipment, setEquipment] = useState<CleaningEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  
  // États pour les dialogues
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<CleaningEquipment | null>(null);
  const [viewingEquipment, setViewingEquipment] = useState<CleaningEquipment | null>(null);
  
  // Formulaire
  const [equipmentForm, setEquipmentForm] = useState<EquipmentFormData>({
    name: '',
    type: '',
    description: '',
    is_active: true
  });
  
  const [saving, setSaving] = useState(false);

  // Récupérer les équipements
  const fetchEquipment = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cleaning_equipment')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name');

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des équipements:', error);
      enqueueSnackbar('Erreur lors de la récupération des équipements', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, enqueueSnackbar]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  // Filtrer les équipements selon l'état actif/inactif
  const filteredEquipment = equipment.filter(item => 
    showInactive ? !item.is_active : item.is_active
  );

  // Ouvrir le dialogue pour un nouvel équipement
  const handleNewEquipment = () => {
    setEditingEquipment(null);
    setEquipmentForm({
      name: '',
      type: '',
      description: '',
      is_active: true
    });
    setOpenDialog(true);
  };

  // Ouvrir le dialogue pour modifier un équipement
  const handleEditEquipment = (item: CleaningEquipment) => {
    setEditingEquipment(item);
    setEquipmentForm({
      name: item.name,
      type: item.type || '',
      description: item.description || '',
      is_active: item.is_active
    });
    setOpenDialog(true);
  };

  // Ouvrir le dialogue de visualisation
  const handleViewEquipment = (item: CleaningEquipment) => {
    setViewingEquipment(item);
    setOpenViewDialog(true);
  };

  // Sauvegarder un équipement
  const handleSaveEquipment = async () => {
    if (!equipmentForm.name.trim() || !session?.user?.id) {
      enqueueSnackbar('Le nom de l&apos;équipement est requis', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);

      const equipmentData = {
        name: equipmentForm.name.trim(),
        type: equipmentForm.type.trim() || null,
        description: equipmentForm.description.trim() || null,
        is_active: equipmentForm.is_active,
        user_id: session.user.id,
        employee_id: currentEmployee?.id || null,
        organization_id: currentEmployee?.organization_id || null,
      };

      if (editingEquipment) {
        // Modification
        const { error } = await supabase
          .from('cleaning_equipment')
          .update(equipmentData)
          .eq('id', editingEquipment.id);

        if (error) throw error;
        enqueueSnackbar('Équipement modifié avec succès', { variant: 'success' });
      } else {
        // Création
        const { error } = await supabase
          .from('cleaning_equipment')
          .insert([{
            ...equipmentData,
            user_id: user?.id || null
          }]);

        if (error) throw error;
        enqueueSnackbar('Équipement créé avec succès', { variant: 'success' });
      }

      setOpenDialog(false);
      fetchEquipment();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l&apos;équipement:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde de l&apos;équipement', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Activer/Désactiver un équipement
  const handleToggleActive = async (item: CleaningEquipment) => {
    try {
      const { error } = await supabase
        .from('cleaning_equipment')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;

      enqueueSnackbar(
        `Équipement ${!item.is_active ? 'activé' : 'désactivé'} avec succès`, 
        { variant: 'success' }
      );
      fetchEquipment();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      enqueueSnackbar('Erreur lors du changement de statut', { variant: 'error' });
    }
  };

  // Supprimer un équipement
  const handleDeleteEquipment = async (item: CleaningEquipment) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'équipement "${item.name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cleaning_equipment')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      enqueueSnackbar('Équipement supprimé avec succès', { variant: 'success' });
      fetchEquipment();
    } catch (error) {
      console.error('Erreur lors de la suppression de l&apos;équipement:', error);
      enqueueSnackbar('Erreur lors de la suppression de l&apos;équipement', { variant: 'error' });
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
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white',
          p: { xs: '1.5rem 1rem', sm: '2rem 1.5rem', md: '2.5rem 2rem' },
          mb: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          borderRadius: { xs: 0, sm: 2, md: 3 },
          mx: { xs: '-0.75rem', sm: 0 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <EquipmentIcon sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
          <Typography 
            variant="h1" 
            component="h1"
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              lineHeight: 1.2
            }}
          >
            Administrateur des Équipements
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
          Gérez les équipements de nettoyage de votre organisation
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
          onClick={handleNewEquipment}
          sx={{
            bgcolor: '#ff9800',
            '&:hover': { bgcolor: '#f57c00' }
          }}
        >
          Nouvel Équipement
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
            label={showInactive ? "Équipements inactifs" : "Équipements actifs"}
          />
          <Chip 
            label={`${filteredEquipment.length} équipement${filteredEquipment.length !== 1 ? 's' : ''}`}
            color="primary" 
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Liste des équipements */}
      {filteredEquipment.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {showInactive 
            ? "Aucun équipement inactif trouvé."
            : "Aucun équipement configuré. Commencez par créer un nouvel équipement."
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
          {filteredEquipment.map((item) => (
            <Card 
              key={item.id}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                },
                opacity: item.is_active ? 1 : 0.7
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
                    {item.name}
                  </Typography>
                  <Chip 
                    label={item.is_active ? 'Actif' : 'Inactif'}
                    color={item.is_active ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                
                {item.type && (
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={item.type}
                      color="warning"
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                )}
                
                {item.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <InfoIcon sx={{ fontSize: 14 }} />
                      Description:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {item.description}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Voir détails">
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewEquipment(item)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifier">
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditEquipment(item)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDeleteEquipment(item)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Tooltip title={item.is_active ? "Désactiver" : "Activer"}>
                  <IconButton 
                    size="small"
                    onClick={() => handleToggleActive(item)}
                    color={item.is_active ? "success" : "default"}
                  >
                    {item.is_active ? <ViewIcon /> : <HideIcon />}
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Dialog pour créer/modifier un équipement */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          {editingEquipment ? 'Modifier l&apos;équipement' : 'Nouvel équipement de nettoyage'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom de l'équipement"
              value={equipmentForm.name}
              onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
              fullWidth
              required
              autoFocus
            />
            
            <FormControl fullWidth>
              <InputLabel>Type d&apos;équipement</InputLabel>
              <Select
                value={equipmentForm.type}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value })}
                label="Type d'équipement"
              >
                {EQUIPMENT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Description"
              value={equipmentForm.description}
              onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
              fullWidth
              multiline
              rows={4}
              placeholder="Caractéristiques, utilisation recommandée, spécifications techniques..."
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={equipmentForm.is_active}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, is_active: e.target.checked })}
                />
              }
              label="Équipement actif"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveEquipment}
            variant="contained"
            disabled={saving || !equipmentForm.name.trim()}
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
          Détails de l&apos;équipement
        </DialogTitle>
        <DialogContent>
          {viewingEquipment && (
            <Box sx={{ mt: 1 }}>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Nom"
                    secondary={viewingEquipment.name}
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={viewingEquipment.is_active ? 'Actif' : 'Inactif'}
                      color={viewingEquipment.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                {viewingEquipment.type && (
                  <ListItem>
                    <ListItemText
                      primary="Type"
                      secondary={viewingEquipment.type}
                    />
                  </ListItem>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                {viewingEquipment.description && (
                  <ListItem sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <InfoIcon color="primary" sx={{ fontSize: 20 }} />
                          <Typography variant="subtitle2">Description</Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {viewingEquipment.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <ListItemText
                    primary="Date de création"
                    secondary={new Date(viewingEquipment.created_at).toLocaleDateString('fr-FR', {
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
          {viewingEquipment && (
            <Button 
              onClick={() => {
                setOpenViewDialog(false);
                handleEditEquipment(viewingEquipment);
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