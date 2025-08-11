"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/src/types/database';
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
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  IconButton,
  Avatar
} from '@mui/material';
import {
  CleaningServices,
  Schedule,
  CheckCircle,
  Warning,
  Save,
  PhotoCamera,
  Assignment,
  TaskAlt,
  CalendarToday,
  TrendingUp
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function CleaningPlan() {
  const [tasks, setTasks] = useState<Tables<'cleaning_tasks'>[]>([]);
  const [records, setRecords] = useState<Tables<'cleaning_records'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TablesInsert<'cleaning_records'>>({
    scheduled_date: new Date().toISOString(),
    cleaning_task_id: null,
    is_completed: false,
    is_compliant: false,
    comments: null,
    completion_date: null,
    photo_url: null,
    user_id: null,
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchTasks();
    fetchRecords();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('cleaning_tasks').select('*');
    if (!error && data) setTasks(data);
  };

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('cleaning_records')
      .select('*')
      .order('scheduled_date', { ascending: false })
      .limit(10);
    if (!error && data) setRecords(data);
  };

  const formatDateTimeForInput = (isoString: string) => {
    return isoString.substring(0, 16);
  };

  const getTaskFrequencyColor = (frequency: string) => {
    switch (frequency?.toLowerCase()) {
      case 'quotidien': return 'success';
      case 'hebdomadaire': return 'info';
      case 'mensuel': return 'warning';
      default: return 'default';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('cleaning_records')
        .insert([formData]);
      
      if (error) throw error;
      
      enqueueSnackbar('Enregistrement de nettoyage réussi!', { variant: 'success' });
      fetchRecords();
      
      // Reset form
      setFormData({
        scheduled_date: new Date().toISOString(),
        cleaning_task_id: null,
        is_completed: false,
        is_compliant: false,
        comments: null,
        completion_date: null,
        photo_url: null,
        user_id: null,
      });
    } catch (error) {
      console.error('Error saving cleaning record:', error);
      enqueueSnackbar('Erreur lors de l&apos;enregistrement', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const stats = {
    totalTasks: tasks.length,
    completedToday: records.filter(r => {
      const today = new Date();
      const recordDate = new Date(r.scheduled_date);
      return recordDate.toDateString() === today.toDateString() && r.is_completed;
    }).length,
    complianceRate: records.length > 0 ? 
      Math.round((records.filter(r => r.is_compliant).length / records.length) * 100) : 
      0,
    pendingTasks: tasks.length - records.filter(r => r.is_completed).length
  };

  return (
    <Box sx={{ 
      flexGrow: 1,
      width: '100%',
      maxWidth: { xs: '100vw', lg: '1400px' },
      mx: 'auto'
    }}>
      {/* Header avec gradient moderne */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
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
            <CleaningServices fontSize="large" />
          </Avatar>
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.75rem' },
                lineHeight: 1.2
              }}
            >
              Plan de Nettoyage HACCP
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
              Planification et suivi des tâches de nettoyage
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.8,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {stats.totalTasks} tâche{stats.totalTasks !== 1 ? 's' : ''} planifiée{stats.totalTasks !== 1 ? 's' : ''} • {stats.completedToday} exécutée{stats.completedToday !== 1 ? 's' : ''} aujourd&apos;hui
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Statistiques rapides */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
          gap: { xs: 2, sm: 3 }, 
          mb: { xs: 3, md: 4 }
        }}>
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Tâches totales
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {stats.totalTasks}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
                    <Assignment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Complétées aujourd&apos;hui
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {stats.completedToday}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#ff980020', color: '#ff9800' }}>
                    <TaskAlt />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Taux conformité
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {stats.complianceRate}%
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196f320', color: '#2196f3' }}>
                    <TrendingUp />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      En attente
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {stats.pendingTasks}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9c27b020', color: '#9c27b0' }}>
                    <CalendarToday />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, 
          gap: { xs: 3, md: 4 }
        }}>
          {/* Formulaire de nouvelle exécution */}
          <Box>
            <Card sx={{ 
              height: 'fit-content', 
              transition: 'all 0.3s', 
              '&:hover': { boxShadow: 6 },
              mx: { xs: -1, sm: 0 },
              borderRadius: { xs: 0, sm: 1 }
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1.5, sm: 2 }, 
                  mb: { xs: 3, md: 4 }
                }}>
                  <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
                    <Assignment />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }}
                    >
                      Nouvelle Exécution
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      Enregistrer une tâche de nettoyage HACCP
                    </Typography>
                  </Box>
                </Box>
                
                <Box component="form" onSubmit={handleSubmit} sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: { xs: 2.5, sm: 3 }
                }}>
                  <FormControl fullWidth required sx={{ minHeight: '56px' }}>
                    <InputLabel>Tâche de nettoyage</InputLabel>
                    <Select
                      value={formData.cleaning_task_id || ''}
                      label="Tâche de nettoyage"
                      onChange={(e) => setFormData({...formData, cleaning_task_id: e.target.value})}
                    >
                      {tasks.map(task => (
                        <MenuItem key={task.id} value={task.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                flexGrow: 1,
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                              }}
                            >
                              {task.name}
                            </Typography>
                            <Chip 
                              label={task.frequency}
                              size="small"
                              color={getTaskFrequencyColor(task.frequency)}
                              variant="outlined"
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Date prévue"
                    type="datetime-local"
                    value={formatDateTimeForInput(formData.scheduled_date)}
                    onChange={(e) => setFormData({...formData, scheduled_date: new Date(e.target.value).toISOString()})}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 1, sm: 2 }, 
                    flexWrap: 'wrap',
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.is_completed || false}
                          onChange={(e) => setFormData({...formData, is_completed: e.target.checked})}
                          icon={<Schedule />}
                          checkedIcon={<CheckCircle />}
                        />
                      }
                      label="Tâche complétée"
                    />
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.is_compliant || false}
                          onChange={(e) => setFormData({...formData, is_compliant: e.target.checked})}
                          icon={<Warning />}
                          checkedIcon={<CheckCircle />}
                          disabled={!formData.is_completed}
                        />
                      }
                      label="Conforme"
                    />
                  </Box>
                  
                  {formData.is_completed && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Informations de complétion
                      </Typography>
                      
                      <TextField
                        label="Date de complétion"
                        type="datetime-local"
                        value={formData.completion_date ? formatDateTimeForInput(formData.completion_date) : ''}
                        onChange={(e) => setFormData({...formData, completion_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                      
                      <TextField
                        label="URL de la photo"
                        value={formData.photo_url || ''}
                        onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                        fullWidth
                        placeholder="https://..."
                        InputProps={{
                          startAdornment: (
                            <IconButton size="small" disabled>
                              <PhotoCamera />
                            </IconButton>
                          )
                        }}
                      />
                      
                      {formData.photo_url && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          Photo prête à être enregistrée
                        </Alert>
                      )}
                    </Box>
                  )}
                  
                  <TextField
                    label="Commentaires"
                    multiline
                    rows={{ xs: 2, sm: 3 }}
                    value={formData.comments || ''}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    fullWidth
                    placeholder="Observations, produits utilisés, difficultés rencontrées..."
                  />
                  
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<Save />}
                    disabled={loading}
                    fullWidth
                    sx={{ 
                      mt: { xs: 1.5, sm: 2 },
                      py: { xs: 1.5, sm: 2 },
                      minHeight: '48px',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          {/* Tableau des dernières exécutions */}
          <Box>
            <Card elevation={3} sx={{
              mx: { xs: -1, sm: 0 },
              borderRadius: { xs: 0, sm: 1 },
              overflow: { xs: 'hidden', sm: 'visible' }
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h5" 
                  component="h2" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1, sm: 1.5 },
                    color: 'info.main',
                    mb: { xs: 2, sm: 3 },
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  <Schedule />
                  Dernières Exécutions
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell><strong>Tâche</strong></TableCell>
                        <TableCell><strong>Date programmée</strong></TableCell>
                        <TableCell><strong>Statut</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary">
                              Aucune exécution enregistrée
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        records.map(record => {
                          const task = tasks.find(t => t.id === record.cleaning_task_id);
                          return (
                            <TableRow key={record.id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {task ? task.name : 'N/A'}
                                  </Typography>
                                  {task && (
                                    <Chip 
                                      label={task.frequency}
                                      size="small"
                                      color={getTaskFrequencyColor(task.frequency)}
                                      variant="outlined"
                                      sx={{ width: 'fit-content', mt: 0.5 }}
                                    />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {new Date(record.scheduled_date).toLocaleString('fr-FR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  })}
                                </Typography>
                                {record.completion_date && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Complété le {new Date(record.completion_date).toLocaleString('fr-FR', {
                                      dateStyle: 'short',
                                      timeStyle: 'short'
                                    })}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {record.is_completed ? (
                                  record.is_compliant ? (
                                    <Chip
                                      size="small"
                                      icon={<CheckCircle />}
                                      label="Complété (Conforme)"
                                      color="success"
                                      variant="filled"
                                    />
                                  ) : (
                                    <Chip
                                      size="small"
                                      icon={<Warning />}
                                      label="Complété (Non conforme)"
                                      color="warning"
                                      variant="filled"
                                    />
                                  )
                                ) : (
                                  <Chip
                                    size="small"
                                    icon={<Schedule />}
                                    label="En attente"
                                    color="default"
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {records.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Affichage des 10 dernières exécutions
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Informations sur les bonnes pratiques */}
        <Card sx={{ mt: 3, bgcolor: 'success.light' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'success.dark' }}>
              🧽 Bonnes Pratiques de Nettoyage HACCP
            </Typography>
            <Typography variant="body2" sx={{ color: 'success.dark' }}>
              • <strong>Planification :</strong> Respecter la fréquence des tâches selon le type de surface et l&apos;activité<br/>
              • <strong>Documentation :</strong> Enregistrer systématiquement toutes les opérations de nettoyage<br/>
              • <strong>Vérification :</strong> Contrôler visuellement l&apos;efficacité du nettoyage avant de valider<br/>
              • <strong>Traçabilité :</strong> Photographier les zones critiques après nettoyage si nécessaire<br/>
              • <strong>Non-conformité :</strong> Signaler immédiatement tout problème et reprendre l&apos;opération
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}