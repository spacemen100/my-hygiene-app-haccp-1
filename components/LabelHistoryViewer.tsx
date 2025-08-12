"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesUpdate } from '@/src/types/database';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack,
  Tooltip,
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  Label as LabelIcon,
  CalendarToday,
  Numbers,
  Category,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

type LabelPrinting = Tables<'label_printings'> & {
  product_label_types?: Tables<'product_label_types'>;
};

interface LabelHistoryViewerProps {
  onReprint?: (labelData: Tables<'label_printings'>) => void;
  refreshTrigger?: number;
}

export default function LabelHistoryViewer({ onReprint, refreshTrigger = 0 }: LabelHistoryViewerProps) {
  const [labelPrintings, setLabelPrintings] = useState<LabelPrinting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<LabelPrinting | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
  const [labelTypes, setLabelTypes] = useState<Tables<'product_label_types'>[]>([]);
  const [editData, setEditData] = useState<TablesUpdate<'label_printings'>>({});
  const [saving, setSaving] = useState(false);
  
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchLabelPrintings();
    fetchLabelTypes();
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLabelPrintings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('label_printings')
        .select(`
          *,
          product_label_types (
            id,
            category,
            sub_category,
            shelf_life_days
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLabelPrintings(data || []);
    } catch (error) {
      console.error('Error fetching label printings:', error);
      enqueueSnackbar('Erreur lors du chargement des étiquettes', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLabelTypes = async () => {
    try {
      const { data, error } = await supabase.from('product_label_types').select('*');
      if (!error && data) setLabelTypes(data);
    } catch (error) {
      console.error('Error fetching label types:', error);
    }
  };

  const getUrgencyLevel = (expiryDate: string): 'low' | 'medium' | 'high' => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 2) return 'high';
    if (daysRemaining <= 7) return 'medium';
    return 'low';
  };

  const getUrgencyColor = (urgency: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getDaysRemaining = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, label: LabelPrinting) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedLabel(label);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedLabel(null);
  };

  const handleEdit = () => {
    if (selectedLabel) {
      setEditData({
        expiry_date: selectedLabel.expiry_date,
        label_count: selectedLabel.label_count,
        product_label_type_id: selectedLabel.product_label_type_id,
      });
      setEditDialogOpen(true);
    }
    handleActionMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleReprint = () => {
    if (selectedLabel && onReprint) {
      onReprint(selectedLabel);
      enqueueSnackbar('Données copiées pour réimpression', { variant: 'info' });
    }
    handleActionMenuClose();
  };

  const handleEditSubmit = async () => {
    if (!selectedLabel) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('label_printings')
        .update(editData)
        .eq('id', selectedLabel.id);

      if (error) throw error;

      enqueueSnackbar('Étiquette mise à jour avec succès', { variant: 'success' });
      setEditDialogOpen(false);
      fetchLabelPrintings();
    } catch (error) {
      console.error('Error updating label:', error);
      enqueueSnackbar('Erreur lors de la mise à jour', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLabel) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('label_printings')
        .delete()
        .eq('id', selectedLabel.id);

      if (error) throw error;

      enqueueSnackbar('Étiquette supprimée avec succès', { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchLabelPrintings();
    } catch (error) {
      console.error('Error deleting label:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Chargement des étiquettes...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <HistoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Historique des Étiquettes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gérer les étiquettes précédemment imprimées ({labelPrintings.length} étiquettes)
            </Typography>
          </Box>
        </Box>

        {labelPrintings.length === 0 ? (
          <Alert severity="info">
            Aucune étiquette n&apos;a encore été imprimée.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date d&apos;impression</TableCell>
                  <TableCell>Date d&apos;expiration</TableCell>
                  <TableCell>Type d&apos;étiquette</TableCell>
                  <TableCell>Quantité</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {labelPrintings.map((label) => {
                  const urgency = getUrgencyLevel(label.expiry_date);
                  const daysRemaining = getDaysRemaining(label.expiry_date);
                  
                  return (
                    <TableRow key={label.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarToday fontSize="small" color="disabled" />
                          <Typography variant="body2">
                            {label.print_date ? 
                              new Date(label.print_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) :
                              new Date(label.created_at!).toLocaleDateString('fr-FR')
                            }
                          </Typography>
                        </Stack>
                      </TableCell>
                      
                      <TableCell>
                        <Typography 
                          variant="body2"
                          color={urgency === 'high' ? 'error' : urgency === 'medium' ? 'warning.main' : 'text.primary'}
                          sx={{ fontWeight: urgency !== 'low' ? 600 : 'normal' }}
                        >
                          {new Date(label.expiry_date).toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Category fontSize="small" color="disabled" />
                          <Typography variant="body2">
                            {label.product_label_types ? 
                              `${label.product_label_types.category} - ${label.product_label_types.sub_category}` :
                              'Type non spécifié'
                            }
                          </Typography>
                        </Stack>
                      </TableCell>
                      
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Numbers fontSize="small" color="disabled" />
                          <Typography variant="body2">
                            {label.label_count}
                          </Typography>
                        </Stack>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={
                            daysRemaining < 0 ? 'Expiré' :
                            daysRemaining === 0 ? 'Expire aujourd&apos;hui' :
                            daysRemaining === 1 ? 'Expire demain' :
                            `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
                          }
                          color={getUrgencyColor(urgency)}
                          size="small"
                          variant={urgency === 'high' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Tooltip title="Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleActionMenuOpen(e, label)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Menu d'actions */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
        >
          <MenuItemComponent onClick={handleReprint}>
            <ListItemIcon>
              <PrintIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Réimprimer</ListItemText>
          </MenuItemComponent>
          
          <MenuItemComponent onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Modifier</ListItemText>
          </MenuItemComponent>
          
          <MenuItemComponent onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Supprimer</ListItemText>
          </MenuItemComponent>
        </Menu>

        {/* Dialog d'édition */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <LabelIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Modifier l&apos;étiquette</Typography>
                <Typography variant="body2" color="text.secondary">
                  Mettre à jour les informations de l&apos;étiquette
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mt: 2 }}>
              <TextField
                label="Date d&apos;expiration"
                type="date"
                value={editData.expiry_date ? editData.expiry_date.split('T')[0] : ''}
                onChange={(e) => setEditData({...editData, expiry_date: new Date(e.target.value).toISOString()})}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              
              <TextField
                label="Nombre d&apos;étiquettes"
                type="number"
                value={editData.label_count || ''}
                onChange={(e) => setEditData({...editData, label_count: Number(e.target.value)})}
                slotProps={{ htmlInput: { min: 1, max: 1000 } }}
                fullWidth
              />
              
              <FormControl fullWidth>
                <InputLabel>Type d&apos;étiquette</InputLabel>
                <Select
                  value={editData.product_label_type_id || ''}
                  label="Type d&apos;étiquette"
                  onChange={(e) => setEditData({...editData, product_label_type_id: e.target.value})}
                >
                  {labelTypes.map(type => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.category} - {type.sub_category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleEditSubmit} 
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de suppression */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cette action est irréversible. L&apos;étiquette sera définitivement supprimée de l&apos;historique.
            </Alert>
            <Typography>
              Êtes-vous sûr de vouloir supprimer cette étiquette ?
            </Typography>
            {selectedLabel && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Date d&apos;expiration :</strong> {new Date(selectedLabel.expiry_date).toLocaleDateString('fr-FR')}
                </Typography>
                <Typography variant="body2">
                  <strong>Quantité :</strong> {selectedLabel.label_count}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}