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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ChecklistRtl as ChecklistIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

type Checklist = Tables<'checklists'>;
type ChecklistItem = Tables<'checklist_items'>;
type ChecklistExecution = TablesInsert<'checklist_executions'>;
type ChecklistExecutionHistory = Tables<'checklist_executions'> & {
  checklists: { name: string; category: string } | null;
  checklist_items: { name: string } | null;
};
type ChecklistWithLastExecution = Checklist & {
  lastExecution?: string | null;
  isOverdue?: boolean;
};

export default function ChecklistPage() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [checklists, setChecklists] = useState<ChecklistWithLastExecution[]>([]);
  const [checklistItems, setChecklistItems] = useState<Record<string, ChecklistItem[]>>({});
  const [executions, setExecutions] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState({ checklists: true });
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  
  // History tab state
  const [currentTab, setCurrentTab] = useState(0);
  const [executionHistory, setExecutionHistory] = useState<ChecklistExecutionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<ChecklistExecutionHistory | null>(null);

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

      // Fetch last execution for each checklist and employee
      const checklistsWithLastExecution = await Promise.all(
        (data || []).map(async (checklist) => {
          let lastExecution = null;
          
          if (employee) {
            const { data: lastExecutionData } = await supabase
              .from('checklist_executions')
              .select('execution_date')
              .eq('checklist_id', checklist.id)
              .eq('employee_id', employee.id)
              .order('execution_date', { ascending: false })
              .limit(1)
              .single();
            
            lastExecution = lastExecutionData?.execution_date || null;
          }

          const checklistWithLastExecution: ChecklistWithLastExecution = {
            ...checklist,
            lastExecution,
            isOverdue: false, // Will be calculated below
          };

          checklistWithLastExecution.isOverdue = isChecklistOverdue(checklistWithLastExecution);
          return checklistWithLastExecution;
        })
      );

      setChecklists(checklistsWithLastExecution);

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
  }, [employee, enqueueSnackbar]);

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

  const fetchExecutionHistory = useCallback(async () => {
    if (!employee) return;
    
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('checklist_executions')
        .select(`
          *,
          checklists!inner (
            name,
            category
          ),
          checklist_items!inner (
            name
          )
        `)
        .eq('employee_id', employee.id)
        .order('execution_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setExecutionHistory(data as ChecklistExecutionHistory[] || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      enqueueSnackbar('Erreur lors du chargement de l\'historique', { variant: 'error' });
    } finally {
      setHistoryLoading(false);
    }
  }, [employee, enqueueSnackbar]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    if (newValue === 1 && executionHistory.length === 0) {
      fetchExecutionHistory();
    }
  };

  const handleViewExecution = (execution: ChecklistExecutionHistory) => {
    setSelectedExecution(execution);
    setHistoryDialogOpen(true);
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

  const isChecklistOverdue = (checklist: ChecklistWithLastExecution): boolean => {
    if (!checklist.lastExecution || checklist.frequency === 'on_demand') return false;
    
    const lastExecution = new Date(checklist.lastExecution);
    const now = new Date();
    const diffInHours = (now.getTime() - lastExecution.getTime()) / (1000 * 60 * 60);
    
    switch (checklist.frequency) {
      case 'daily':
        return diffInHours > 24;
      case 'weekly':
        return diffInHours > (7 * 24);
      case 'monthly':
        return diffInHours > (30 * 24);
      default:
        return false;
    }
  };

  const getNextDueDate = (checklist: ChecklistWithLastExecution): Date | null => {
    if (!checklist.lastExecution || checklist.frequency === 'on_demand') return null;
    
    const lastExecution = new Date(checklist.lastExecution);
    
    switch (checklist.frequency) {
      case 'daily':
        return new Date(lastExecution.getTime() + (24 * 60 * 60 * 1000));
      case 'weekly':
        return new Date(lastExecution.getTime() + (7 * 24 * 60 * 60 * 1000));
      case 'monthly':
        return new Date(lastExecution.getTime() + (30 * 24 * 60 * 60 * 1000));
      default:
        return null;
    }
  };

  const formatLastExecution = (lastExecution: string | null | undefined) => {
    if (!lastExecution) return 'Jamais réalisée';
    
    const date = new Date(lastExecution);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Il y a moins d\'1h';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return 'Hier';
      } else if (diffInDays < 7) {
        return `Il y a ${diffInDays} jours`;
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }
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
        
        {/* Tabs */}
        <Box sx={{ mb: 4 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 1.5,
              },
            }}
          >
            <Tab
              icon={<ChecklistIcon />}
              label="Exécuter"
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              icon={<HistoryIcon />}
              label="Historique"
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        {currentTab === 0 && (
          <>
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
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
          gap: { xs: 2, sm: 3 }, 
          mb: { xs: 3, md: 4 }
        }}>
          {loading.checklists ? (
            Array(4).fill(0).map((_, i) => (
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

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <WarningIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        En retard
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: filteredChecklists.filter(c => isChecklistOverdue(c)).length > 0 ? 'warning.main' : 'text.primary' }}>
                        {filteredChecklists.filter(c => isChecklistOverdue(c)).length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </Box>

        {/* Checklists Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {loading.checklists ? (
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            ))
          ) : filteredChecklists.length === 0 ? (
            <Box sx={{ gridColumn: '1 / -1' }}>
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
                        Besoin d&apos;inspiration ? Voici une checklist par défaut :
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
            </Box>
          ) : (
            filteredChecklists.map((checklist) => (
                <Card 
                  key={checklist.id}
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
                      <Avatar sx={{ bgcolor: isChecklistOverdue(checklist) ? 'warning.main' : 'primary.main' }}>
                        {isChecklistOverdue(checklist) ? <WarningIcon /> : <AssignmentIcon />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {checklist.name}
                          </Typography>
                          {isChecklistOverdue(checklist) && (
                            <Chip
                              label="En retard"
                              color="warning"
                              size="small"
                              icon={<WarningIcon />}
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
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

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                      
                      {/* Last execution info */}
                      <Box sx={{ 
                        p: 1.5, 
                        bgcolor: isChecklistOverdue(checklist) ? 'warning.50' : 'grey.50', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: isChecklistOverdue(checklist) ? 'warning.200' : 'grey.200'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {isChecklistOverdue(checklist) ? (
                            <AccessTimeIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          ) : checklist.lastExecution ? (
                            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          ) : (
                            <AccessTimeIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                          )}
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Dernière réalisation
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: isChecklistOverdue(checklist) ? 'warning.dark' : 'text.secondary',
                            fontWeight: isChecklistOverdue(checklist) ? 600 : 400
                          }}
                        >
                          {formatLastExecution(checklist.lastExecution)}
                        </Typography>
                        {isChecklistOverdue(checklist) && checklist.frequency !== 'on_demand' && (
                          <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 500 }}>
                            ⚠️ Délai de {getFrequencyLabel(checklist.frequency).toLowerCase()} dépassé
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
            ))
          )}
        </Box>
        </>
        )}

        {currentTab === 1 && (
          <>
            {/* History Content */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                <HistoryIcon color="primary" />
                Historique des contrôles
              </Typography>
              
              {historyLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              ) : executionHistory.length === 0 ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500', mx: 'auto', mb: 2, width: 64, height: 64 }}>
                      <HistoryIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Aucun historique
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      Vous n&apos;avez pas encore exécuté de checklists
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Card sx={{ borderRadius: 3 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Checklist</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Point de contrôle</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Commentaires</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {executionHistory.map((execution) => (
                          <TableRow key={execution.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {new Date(execution.execution_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(execution.execution_date).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {execution.checklists?.name}
                                </Typography>
                                <Chip
                                  label={getCategoryLabel(execution.checklists?.category || '')}
                                  size="small"
                                  sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {execution.checklist_items?.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={execution.is_completed ? 'Conforme' : 'Non conforme'}
                                color={execution.is_completed ? 'success' : 'error'}
                                size="small"
                                icon={execution.is_completed ? <CheckIcon /> : undefined}
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 200 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {execution.comments || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Voir les détails">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewExecution(execution)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}
            </Box>
          </>
        )}

        {/* Execution Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 3 }
            }
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

        {/* History Detail Dialog */}
        <Dialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 3 }
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <ViewIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Détails du contrôle</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedExecution && new Date(selectedExecution.execution_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            {selectedExecution && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Checklist
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedExecution.checklists?.name}
                    </Typography>
                    <Chip
                      label={getCategoryLabel(selectedExecution.checklists?.category || '')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Point de contrôle
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ✅ {selectedExecution.checklist_items?.name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Résultat
                  </Typography>
                  <Chip
                    label={selectedExecution.is_completed ? 'Conforme ✓' : 'Non conforme'}
                    color={selectedExecution.is_completed ? 'success' : 'error'}
                    sx={{ fontWeight: 600 }}
                    icon={selectedExecution.is_completed ? <CheckIcon /> : undefined}
                  />
                </Box>

                {selectedExecution.comments && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Commentaires
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        {selectedExecution.comments}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
                  <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                    💡 Options de réponse disponibles :
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, bgcolor: 'success.main', borderRadius: '50%' }} />
                      Oui - Conforme ✓
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, bgcolor: 'error.main', borderRadius: '50%' }} />
                      Non
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, bgcolor: 'grey.400', borderRadius: '50%' }} />
                      Non évalué
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setHistoryDialogOpen(false)} variant="outlined">
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
}