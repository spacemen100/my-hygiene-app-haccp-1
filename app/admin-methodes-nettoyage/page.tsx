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
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ListAlt as MethodsIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  PlaylistAdd as AddStepIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/components/AuthProvider';
import { useEmployee } from '@/contexts/EmployeeContext';

// Types pour les méthodes de nettoyage
interface CleaningMethod {
  id: string;
  organization_id: string | null;
  name: string;
  description: string;
  steps: string[];
  created_at: string;
  employee_id: string | null;
  user_id: string | null;
}

interface MethodFormData {
  name: string;
  description: string;
  steps: string[];
}

export default function AdminMethodesNettoyagePage() {
  const { session, user } = useAuth();
  const { employee: currentEmployee } = useEmployee();
  const { enqueueSnackbar } = useSnackbar();

  // États pour les méthodes
  const [methods, setMethods] = useState<CleaningMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | false>(false);
  
  // États pour les dialogues
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<CleaningMethod | null>(null);
  const [viewingMethod, setViewingMethod] = useState<CleaningMethod | null>(null);
  
  // Formulaire
  const [methodForm, setMethodForm] = useState<MethodFormData>({
    name: '',
    description: '',
    steps: ['']
  });
  
  const [saving, setSaving] = useState(false);

  // Récupérer les méthodes
  const fetchMethods = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cleaning_methods')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name');

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des méthodes:', error);
      enqueueSnackbar('Erreur lors de la récupération des méthodes', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, enqueueSnackbar]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  // Gérer l'expansion des accordéons
  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Ouvrir le dialogue pour une nouvelle méthode
  const handleNewMethod = () => {
    setEditingMethod(null);
    setMethodForm({
      name: '',
      description: '',
      steps: ['']
    });
    setOpenDialog(true);
  };

  // Ouvrir le dialogue pour modifier une méthode
  const handleEditMethod = (method: CleaningMethod) => {
    setEditingMethod(method);
    setMethodForm({
      name: method.name,
      description: method.description,
      steps: method.steps.length > 0 ? method.steps : ['']
    });
    setOpenDialog(true);
  };

  // Ouvrir le dialogue de visualisation
  const handleViewMethod = (method: CleaningMethod) => {
    setViewingMethod(method);
    setOpenViewDialog(true);
  };

  // Gestion des étapes
  const handleAddStep = () => {
    setMethodForm({
      ...methodForm,
      steps: [...methodForm.steps, '']
    });
  };

  const handleRemoveStep = (index: number) => {
    if (methodForm.steps.length > 1) {
      const newSteps = methodForm.steps.filter((_, i) => i !== index);
      setMethodForm({
        ...methodForm,
        steps: newSteps
      });
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...methodForm.steps];
    newSteps[index] = value;
    setMethodForm({
      ...methodForm,
      steps: newSteps
    });
  };

  // Sauvegarder une méthode
  const handleSaveMethod = async () => {
    if (!methodForm.name.trim() || !methodForm.description.trim() || !session?.user?.id) {
      enqueueSnackbar('Le nom et la description sont requis', { variant: 'error' });
      return;
    }

    const validSteps = methodForm.steps.filter(step => step.trim() !== '');
    if (validSteps.length === 0) {
      enqueueSnackbar('Au moins une étape est requise', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);

      const methodData = {
        name: methodForm.name.trim(),
        description: methodForm.description.trim(),
        steps: validSteps,
        user_id: null,
        employee_id: currentEmployee?.id || null,
        organization_id: currentEmployee?.organization_id || null,
      };

      if (editingMethod) {
        // Modification
        const { error } = await supabase
          .from('cleaning_methods')
          .update(methodData)
          .eq('id', editingMethod.id);

        if (error) throw error;
        enqueueSnackbar('Méthode modifiée avec succès', { variant: 'success' });
      } else {
        // Création
        const { error } = await supabase
          .from('cleaning_methods')
          .insert([{
            ...methodData,
            user_id: user?.id || null
          }]);

        if (error) throw error;
        enqueueSnackbar('Méthode créée avec succès', { variant: 'success' });
      }

      setOpenDialog(false);
      fetchMethods();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la méthode:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde de la méthode', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une méthode
  const handleDeleteMethod = async (method: CleaningMethod) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la méthode "${method.name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cleaning_methods')
        .delete()
        .eq('id', method.id);

      if (error) throw error;

      enqueueSnackbar('Méthode supprimée avec succès', { variant: 'success' });
      fetchMethods();
    } catch (error) {
      console.error('Erreur lors de la suppression de la méthode:', error);
      enqueueSnackbar('Erreur lors de la suppression de la méthode', { variant: 'error' });
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
          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
          color: 'white',
          p: { xs: '1.5rem 1rem', sm: '2rem 1.5rem', md: '2.5rem 2rem' },
          mb: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          borderRadius: { xs: 0, sm: 2, md: 3 },
          mx: { xs: '-0.75rem', sm: 0 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <MethodsIcon sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
          <Typography 
            variant="h1" 
            component="h1"
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              lineHeight: 1.2
            }}
          >
            Administrateur des Méthodes de Nettoyage
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
          Créez et gérez les procédures de nettoyage standardisées
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
          onClick={handleNewMethod}
          sx={{
            bgcolor: '#9c27b0',
            '&:hover': { bgcolor: '#7b1fa2' }
          }}
        >
          Nouvelle Méthode
        </Button>
        
        <Chip 
          label={`${methods.length} méthode${methods.length !== 1 ? 's' : ''}`}
          color="primary" 
          variant="outlined"
        />
      </Box>

      {/* Liste des méthodes */}
      {methods.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune méthode de nettoyage configurée. Commencez par créer une nouvelle méthode.
        </Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          {methods.map((method) => (
            <Accordion
              key={method.id}
              expanded={expanded === method.id}
              onChange={handleChange(method.id)}
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
                <MethodsIcon color="primary" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {method.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {method.description}
                  </Typography>
                </Box>
                <Chip 
                  label={`${method.steps.length} étape${method.steps.length !== 1 ? 's' : ''}`}
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ pl: 2 }}>
                  {/* Actions pour la méthode */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mb: 3, 
                    flexWrap: 'wrap' 
                  }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewMethod(method)}
                    >
                      Voir Détails
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditMethod(method)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteMethod(method)}
                    >
                      Supprimer
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Liste des étapes */}
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Étapes de la méthode :
                  </Typography>
                  {method.steps.length > 0 ? (
                    <List dense>
                      {method.steps.map((step, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: 'background.paper'
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            width: '100%',
                            gap: 2 
                          }}>
                            <Chip 
                              label={index + 1} 
                              size="small" 
                              color="primary" 
                              sx={{ minWidth: '32px', fontSize: '0.75rem' }}
                            />
                            <ListItemText
                              primary={step}
                              sx={{ 
                                '& .MuiListItemText-primary': {
                                  fontSize: '0.9rem',
                                  lineHeight: 1.5
                                }
                              }}
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="warning">
                      Aucune étape définie pour cette méthode.
                    </Alert>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Dialog pour créer/modifier une méthode */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          {editingMethod ? 'Modifier la méthode' : 'Nouvelle méthode de nettoyage'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom de la méthode"
              value={methodForm.name}
              onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
              fullWidth
              required
              autoFocus
            />
            
            <TextField
              label="Description"
              value={methodForm.description}
              onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
              fullWidth
              required
              multiline
              rows={2}
              placeholder="Décrivez le contexte d'utilisation de cette méthode..."
            />
            
            <Divider sx={{ my: 1 }} />
            
            {/* Gestion des étapes */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h3">
                  Étapes de la méthode
                </Typography>
                <Button
                  startIcon={<AddStepIcon />}
                  onClick={handleAddStep}
                  size="small"
                  variant="outlined"
                >
                  Ajouter une étape
                </Button>
              </Box>
              
              {methodForm.steps.map((step, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Chip 
                      label={index + 1} 
                      size="small" 
                      color="primary" 
                      sx={{ mt: 1, minWidth: '32px' }}
                    />
                    <TextField
                      label={`Étape ${index + 1}`}
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Décrivez cette étape en détail..."
                    />
                    {methodForm.steps.length > 1 && (
                      <Tooltip title="Supprimer cette étape">
                        <IconButton
                          onClick={() => handleRemoveStep(index)}
                          color="error"
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveMethod}
            variant="contained"
            disabled={saving || !methodForm.name.trim() || !methodForm.description.trim()}
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
        maxWidth="md"
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          Détails de la méthode
        </DialogTitle>
        <DialogContent>
          {viewingMethod && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {viewingMethod.name}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                {viewingMethod.description}
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Étapes à suivre :
              </Typography>
              
              {viewingMethod.steps.length > 0 ? (
                <List>
                  {viewingMethod.steps.map((step, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'background.paper',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        width: '100%',
                        gap: 2 
                      }}>
                        <Chip 
                          label={index + 1} 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 0.5, minWidth: '32px' }}
                        />
                        <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.6 }}>
                          {step}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="warning">
                  Aucune étape définie pour cette méthode.
                </Alert>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                Créée le {new Date(viewingMethod.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>
            Fermer
          </Button>
          {viewingMethod && (
            <Button 
              onClick={() => {
                setOpenViewDialog(false);
                handleEditMethod(viewingMethod);
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