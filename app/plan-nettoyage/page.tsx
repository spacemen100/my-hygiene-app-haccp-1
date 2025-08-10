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
  IconButton
} from '@mui/material';
import {
  CleaningServices,
  Schedule,
  CheckCircle,
  Cancel,
  Warning,
  Save,
  PhotoCamera,
  Assignment
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
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 4,
        color: 'primary.main',
        fontWeight: 'bold'
      }}>
        <CleaningServices fontSize="large" />
        Plan de Nettoyage
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Formulaire de nouvelle exécution */}
        <Box sx={{ flex: 1, minWidth: 400 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'success.main',
                mb: 3
              }}>
                <Assignment />
                Nouvelle Exécution
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl fullWidth required>
                  <InputLabel>Tâche de nettoyage</InputLabel>
                  <Select
                    value={formData.cleaning_task_id || ''}
                    label="Tâche de nettoyage"
                    onChange={(e) => setFormData({...formData, cleaning_task_id: e.target.value})}
                  >
                    {tasks.map(task => (
                      <MenuItem key={task.id} value={task.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Typography variant="body1" sx={{ flexGrow: 1 }}>
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
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                  rows={3}
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
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        {/* Tableau des dernières exécutions */}
        <Box sx={{ flex: 1, minWidth: 400 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'info.main',
                mb: 3
              }}>
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
            • <strong>Planification :</strong> Respecter la fréquence des tâches selon le type de surface et l'activité<br/>
            • <strong>Documentation :</strong> Enregistrer systématiquement toutes les opérations de nettoyage<br/>
            • <strong>Vérification :</strong> Contrôler visuellement l'efficacité du nettoyage avant de valider<br/>
            • <strong>Traçabilité :</strong> Photographier les zones critiques après nettoyage si nécessaire<br/>
            • <strong>Non-conformité :</strong> Signaler immédiatement tout problème et reprendre l'opération
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}