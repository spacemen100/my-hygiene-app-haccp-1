"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  FormControlLabel,
  Checkbox,
  Avatar,
  Skeleton,
  Paper,
  Chip,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  ChecklistRtl as ChecklistIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

type Checklist = Tables<'checklists'>;
type ChecklistItem = Tables<'checklist_items'>;
type ChecklistExecution = TablesInsert<'checklist_executions'>;

export default function ChecklistPage() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [checklistItems, setChecklistItems] = useState<Record<string, ChecklistItem[]>>({});
  const [executions, setExecutions] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState({ checklists: true });
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);

  const categories = [
    { value: 'all', label: 'Toutes' },
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

  const fetchChecklists = useCallback(async () => {
    setLoading(prev => ({ ...prev, checklists: true }));
    
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setChecklists(data || []);

      // Fetch checklist items for each checklist
      const itemsPromises = (data || []).map(async (checklist) => {
        const { data: items, error: itemsError } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('checklist_id', checklist.id)
          .eq('is_active', true)
          .order('order_index');

        if (itemsError) throw itemsError;
        return { checklistId: checklist.id, items: items || [] };
      });

      const itemsResults = await Promise.all(itemsPromises);
      const itemsMap: Record<string, ChecklistItem[]> = {};
      itemsResults.forEach(({ checklistId, items }) => {
        itemsMap[checklistId] = items;
      });
      setChecklistItems(itemsMap);

    } catch (error) {
      console.error('Erreur lors du chargement des checklists:', error);
      enqueueSnackbar('Erreur lors du chargement des checklists', { variant: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, checklists: false }));
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  const handleItemCheck = (itemId: string, checked: boolean) => {
    setExecutions(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [itemId]: comment
    }));
  };

  const handleOpenDialog = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedChecklist(null);
    setExecutions({});
    setComments({});
  };

  const handleSaveExecution = async () => {
    if (!selectedChecklist || !employee) return;

    try {
      setSaving(true);
      
      const items = checklistItems[selectedChecklist.id] || [];
      const executionsToSave: ChecklistExecution[] = items.map(item => ({
        checklist_id: selectedChecklist.id,
        checklist_item_id: item.id,
        is_completed: executions[item.id] || false,
        comments: comments[item.id] || null,
        execution_date: new Date().toISOString(),
        employee_id: employee.id,
        user_id: user?.id || null,
        organization_id: employee.organization_id,
      }));

      const { error } = await supabase
        .from('checklist_executions')
        .insert(executionsToSave);

      if (error) throw error;

      enqueueSnackbar('Checklist exécutée avec succès!', { variant: 'success' });
      handleCloseDialog();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getCompletionRate = (checklistId: string) => {
    const items = checklistItems[checklistId] || [];
    if (items.length === 0) return 0;
    
    const completedItems = items.filter(item => executions[item.id]).length;
    return Math.round((completedItems / items.length) * 100);
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };

  const getFrequencyLabel = (frequency: string) => {
    const frequencies: Record<string, string> = {
      daily: 'Quotidienne',
      weekly: 'Hebdomadaire', 
      monthly: 'Mensuelle',
      on_demand: 'À la demande'
    };
    return frequencies[frequency] || frequency;
  };

  const filteredChecklists = selectedCategory === 'all' 
    ? checklists 
    : checklists.filter(c => c.category === selectedCategory);

  return (
    <Box sx={{ 
      flexGrow: 1,
      width: '100%',
      maxWidth: { xs: '100vw', lg: '1400px' },
      mx: 'auto'
    }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          p: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 0, sm: 2, md: 3 },
          mx: { xs: -1, sm: 0 },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 }
        }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              width: { xs: 56, md: 80 },
              height: { xs: 56, md: 80 },
            }}
          >
            <ChecklistIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                lineHeight: 1.2
              }}
            >
              Checklists HACCP
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                opacity: 0.9, 
                mb: 1,
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Contrôles et vérifications quotidiennes
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.8,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Effectuez vos contrôles HACCP de manière systématique
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        
        {/* Category Filter */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <Chip
                key={category.value}
                label={category.label}
                onClick={() => setSelectedCategory(category.value)}
                color={selectedCategory === category.value ? 'primary' : 'default'}
                variant={selectedCategory === category.value ? 'filled' : 'outlined'}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        </Box>

        {/* Statistics */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
          gap: { xs: 2, sm: 3 }, 
          mb: { xs: 3, md: 4 }
        }}>
          {loading.checklists ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            ))
          ) : (
            <>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <ChecklistIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Checklists Disponibles
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {filteredChecklists.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Quotidiennes
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {filteredChecklists.filter(c => c.frequency === 'daily').length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <ScheduleIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Catégories
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {[...new Set(filteredChecklists.map(c => c.category))].length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </Box>

        {/* Checklists Grid */}
        <Grid container spacing={3}>
          {loading.checklists ? (
            Array(6).fill(0).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              </Grid>
            ))
          ) : filteredChecklists.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500', mx: 'auto', mb: 2 }}>
                    <ChecklistIcon />
                  </Avatar>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucune checklist disponible
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                    {selectedCategory === 'all' 
                      ? 'Aucune checklist n\'a été configurée'
                      : `Aucune checklist dans la catégorie "${getCategoryLabel(selectedCategory)}"`
                    }
                  </Typography>
                  
                  {selectedCategory === 'all' && (
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ mb: 2, fontWeight: 500 }}>
                        Besoin d'inspiration ? Voici une checklist par défaut :
                      </Typography>
                      <Card variant="outlined" sx={{ maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                            Checklist HACCP de base
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {[
                              'Stockage au sol - Aucun stockage sur le sol',
                              'Dates d\'expiration - Vérification des dates',
                              'Étiquetage des produits - Contrôle des étiquettes',
                              'Port de bijoux - Vérification du personnel',
                              'Zone de stockage - Contrôle des espaces',
                              'Tenue du personnel - Vérification des uniformes'
                            ].map((item, index) => (
                              <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 6, height: 6, bgcolor: 'primary.main', borderRadius: '50%' }} />
                                {item}
                              </Typography>
                            ))}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            Contactez votre administrateur pour configurer ces checklists
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ) : (
            filteredChecklists.map((checklist) => (
              <Grid item xs={12} sm={6} md={4} key={checklist.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    transition: 'all 0.3s',
                    '&:hover': { 
                      transform: 'translateY(-2px)',
                      boxShadow: 6
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenDialog(checklist)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AssignmentIcon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {checklist.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getCategoryLabel(checklist.category)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {checklist.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {checklist.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip 
                        label={getFrequencyLabel(checklist.frequency)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {(checklistItems[checklist.id] || []).length} éléments
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Execution Dialog */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <ChecklistIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedChecklist?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {getCategoryLabel(selectedChecklist?.category || '')} • {getFrequencyLabel(selectedChecklist?.frequency || '')}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            {selectedChecklist && (
              <Box sx={{ mt: 2 }}>
                {selectedChecklist.description && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    {selectedChecklist.description}
                  </Alert>
                )}

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    Progression: {getCompletionRate(selectedChecklist.id)}%
                  </Typography>
                  <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                    <Box 
                      sx={{ 
                        width: `${getCompletionRate(selectedChecklist.id)}%`, 
                        bgcolor: 'primary.main', 
                        height: '100%', 
                        borderRadius: 1,
                        transition: 'width 0.3s'
                      }} 
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(checklistItems[selectedChecklist.id] || []).map((item) => (
                    <Card key={item.id} variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={executions[item.id] || false}
                              onChange={(e) => handleItemCheck(item.id, e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {item.name}
                              </Typography>
                              {item.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {item.description}
                                </Typography>
                              )}
                            </Box>
                          }
                          sx={{ width: '100%', alignItems: 'flex-start' }}
                        />
                        
                        <TextField
                          label="Commentaires"
                          value={comments[item.id] || ''}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          sx={{ mt: 2 }}
                          placeholder="Observations, remarques..."
                        />
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
              Annuler
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveExecution}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
}