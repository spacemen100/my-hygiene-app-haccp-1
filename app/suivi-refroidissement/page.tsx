"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert, Tables } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  Paper,
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
  Tooltip
} from '@mui/material';
import {
  AcUnit,
  TrendingDown,
  Timer,
  CheckCircle,
  Cancel,
  Save,
  Schedule,
  Thermostat,
  Speed,
  AccessTime,
  TrendingUp,
  Edit,
  Delete,
  History
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function CoolingTracking() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const [formData, setFormData] = useState<TablesInsert<'cooling_records'>>({
    start_date: new Date().toISOString(),
    end_date: null,
    product_name: '',
    product_type: '',
    start_core_temperature: 0,
    end_core_temperature: null,
    is_compliant: null,
    comments: null,
    organization_id: null,
    user_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<Tables<'cooling_records'>[]>([]);
  const [editingRecord, setEditingRecord] = useState<Tables<'cooling_records'> | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<TablesInsert<'cooling_records'>>({
    start_date: new Date().toISOString(),
    end_date: null,
    product_name: '',
    product_type: '',
    start_core_temperature: 0,
    end_core_temperature: null,
    is_compliant: null,
    comments: null,
    organization_id: null,
    user_id: null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Tables<'cooling_records'> | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const formatDateTimeForInput = (isoString: string) => {
    return isoString.substring(0, 16);
  };

  const loadHistoryRecords = async () => {
    try {
      const orgId = (user as any)?.organization_id || employee?.organization_id;
      const userId = user?.id;
      const employeeId = employee?.id;
      
      if (!orgId && !userId && !employeeId) {
        console.log('No identification available, skipping history load');
        return;
      }

      let query = supabase.from('cooling_records').select('*');
      
      if (orgId) {
        // Priorité à l'organization_id si disponible
        query = query.or(`organization_id.eq.${orgId},organization_id.is.null`);
        if (userId) query = query.eq('user_id', userId);
        else if (employeeId) query = query.eq('employee_id', employeeId);
      } else if (userId) {
        // Sinon filtrer par user_id
        query = query.eq('user_id', userId);
      } else if (employeeId) {
        // Ou par employee_id
        query = query.eq('employee_id', employeeId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setHistoryRecords(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      enqueueSnackbar('Erreur lors du chargement de l\'historique', { variant: 'error' });
    }
  };

  const handleEdit = (record: Tables<'cooling_records'>) => {
    setEditingRecord(record);
    setEditFormData({
      start_date: record.start_date,
      end_date: record.end_date,
      product_name: record.product_name,
      product_type: record.product_type,
      start_core_temperature: record.start_core_temperature,
      end_core_temperature: record.end_core_temperature,
      is_compliant: record.is_compliant,
      comments: record.comments,
      organization_id: record.organization_id,
      user_id: record.user_id,
    });
    setEditModalOpen(true);
  };

  const calculateEditCoolingRate = () => {
    if (editFormData.end_core_temperature === null || editFormData.end_core_temperature === undefined || !editFormData.end_date) return null;
    
    const startTime = new Date(editFormData.start_date).getTime();
    const endTime = new Date(editFormData.end_date).getTime();
    const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
    
    if (timeDiffHours <= 0) return null;
    
    const tempDiff = editFormData.start_core_temperature - editFormData.end_core_temperature;
    return tempDiff / timeDiffHours;
  };

  const getEditCoolingStatus = () => {
    const rate = calculateEditCoolingRate();
    if (!rate || !editFormData.end_core_temperature) return 'pending';
    
    if (editFormData.start_core_temperature >= 65 && editFormData.end_core_temperature <= 10) {
      const startTime = new Date(editFormData.start_date).getTime();
      const endTime = editFormData.end_date ? new Date(editFormData.end_date).getTime() : Date.now();
      const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
      
      if (timeDiffHours <= 6) return 'compliant';
    }
    
    return editFormData.end_core_temperature <= 10 ? 'warning' : 'non-compliant';
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    setLoading(true);
    try {
      const status = getEditCoolingStatus();
      const updatedFormData = {
        ...editFormData,
        is_compliant: status === 'compliant' || status === 'warning'
      };

      const { error } = await supabase
        .from('cooling_records')
        .update({
          ...updatedFormData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      enqueueSnackbar('Enregistrement modifié avec succès!', { variant: 'success' });
      setEditingRecord(null);
      setEditModalOpen(false);
      loadHistoryRecords();
      
      setEditFormData({
        start_date: new Date().toISOString(),
        end_date: null,
        product_name: '',
        product_type: '',
        start_core_temperature: 0,
        end_core_temperature: null,
        is_compliant: null,
        comments: null,
        organization_id: null,
        user_id: null,
      });
    } catch (error) {
      console.error('Error updating record:', error);
      enqueueSnackbar('Erreur lors de la modification', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
      const { error } = await supabase
        .from('cooling_records')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) throw error;

      enqueueSnackbar('Enregistrement supprimé avec succès!', { variant: 'success' });
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      loadHistoryRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingRecord(null);
    setEditFormData({
      start_date: new Date().toISOString(),
      end_date: null,
      product_name: '',
      product_type: '',
      start_core_temperature: 0,
      end_core_temperature: null,
      is_compliant: null,
      comments: null,
      organization_id: null,
      user_id: null,
    });
  };

  useEffect(() => {
    const orgId = (user as any)?.organization_id || employee?.organization_id;
    const userId = user?.id;
    const employeeId = employee?.id;
    
    if (orgId || userId || employeeId) {
      loadHistoryRecords();
    }
  }, [(user as any)?.organization_id, employee?.organization_id, user?.id, employee?.id]);

  const calculateCoolingRate = () => {
    if (formData.end_core_temperature === null || formData.end_core_temperature === undefined || !formData.end_date) return null;
    
    const startTime = new Date(formData.start_date).getTime();
    const endTime = new Date(formData.end_date).getTime();
    const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
    
    if (timeDiffHours <= 0) return null;
    
    const tempDiff = formData.start_core_temperature - formData.end_core_temperature;
    return tempDiff / timeDiffHours; // °C/h
  };

  const getCoolingStatus = () => {
    const rate = calculateCoolingRate();
    if (!rate || !formData.end_core_temperature) return 'pending';
    
    // Règle générale : refroidissement de 65°C à 10°C en 6h max (HACCP)
    if (formData.start_core_temperature >= 65 && formData.end_core_temperature <= 10) {
      const startTime = new Date(formData.start_date).getTime();
      const endTime = formData.end_date ? new Date(formData.end_date).getTime() : Date.now();
      const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
      
      if (timeDiffHours <= 6) return 'compliant';
    }
    
    return formData.end_core_temperature <= 10 ? 'warning' : 'non-compliant';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const status = getCoolingStatus();
      const updatedFormData = {
        ...formData,
        is_compliant: status === 'compliant' || status === 'warning'
      };
      
      const { error } = await supabase
        .from('cooling_records')
        .insert([{
          ...updatedFormData,
          organization_id: (user as any)?.organization_id || employee?.organization_id || null,
          employee_id: employee?.id || null,
          user_id: user?.id || null,
        }]);
      
      if (error) throw error;
      
      enqueueSnackbar('Enregistrement de refroidissement réussi!', { variant: 'success' });
      loadHistoryRecords();
      
      // Reset form
      setFormData({
        start_date: new Date().toISOString(),
        end_date: null,
        product_name: '',
        product_type: '',
        start_core_temperature: 0,
        end_core_temperature: null,
        is_compliant: null,
        comments: null,
        organization_id: null,
        user_id: null,
      });
    } catch (error) {
      console.error('Error saving cooling record:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const coolingRate = calculateCoolingRate();
  const coolingStatus = getCoolingStatus();

  // Calculer les statistiques
  const stats = {
    tempStart: formData.start_core_temperature || 0,
    tempEnd: formData.end_core_temperature || null,
    coolingRate: coolingRate,
    timeRemaining: formData.end_date && formData.start_date ? 
      Math.max(0, (new Date(formData.start_date).getTime() + 6 * 60 * 60 * 1000) - Date.now()) / (1000 * 60 * 60) : null
  };

  const getProgressValue = () => {
    if (!formData.end_core_temperature || formData.start_core_temperature <= 10) return 0;
    return Math.min(100, ((formData.start_core_temperature - formData.end_core_temperature) / 
           Math.max(1, formData.start_core_temperature - 10)) * 100);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header avec gradient moderne */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              width: 80,
              height: 80,
            }}
          >
            <TrendingDown fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Suivi de Refroidissement HACCP
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              Contrôle de la chaîne du froid et conformité réglementaire
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Objectif HACCP : 65°C → 10°C en moins de 6 heures
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl">
        
        {/* Statistiques rapides */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Temp. de départ
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.tempStart}°C
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#f4433620', color: '#f44336' }}>
                    <TrendingUp />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Temp. actuelle
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.tempEnd !== null ? `${stats.tempEnd}°C` : '-'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196f320', color: '#2196f3' }}>
                    <Thermostat />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Vitesse refroid.
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.coolingRate ? `${stats.coolingRate.toFixed(1)}°C/h` : '-'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9c27b020', color: '#9c27b0' }}>
                    <Speed />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Conformité
                    </Typography>
                    <Chip
                      label={
                        coolingStatus === 'compliant' ? 'Conforme' :
                        coolingStatus === 'warning' ? 'Acceptable' :
                        coolingStatus === 'non-compliant' ? 'Non conforme' : 'En cours'
                      }
                      color={
                        coolingStatus === 'compliant' ? 'success' :
                        coolingStatus === 'warning' ? 'warning' :
                        coolingStatus === 'non-compliant' ? 'error' : 'default'
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: coolingStatus === 'compliant' ? '#4caf5020' : 
                            coolingStatus === 'warning' ? '#ff980020' : 
                            coolingStatus === 'non-compliant' ? '#f4433620' : '#grey20',
                    color: coolingStatus === 'compliant' ? '#4caf50' : 
                           coolingStatus === 'warning' ? '#ff9800' : 
                           coolingStatus === 'non-compliant' ? '#f44336' : '#grey'
                  }}>
                    <AccessTime />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Formulaire principal */}
        <Card sx={{ transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: '#2196f320', color: '#2196f3' }}>
                <AcUnit />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Enregistrement de Refroidissement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Traçabilité du processus de refroidissement HACCP
                </Typography>
              </Box>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                <Box>
                  <TextField
                    label="Nom du produit"
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    required
                    fullWidth
                    placeholder="Ex: Rôti de porc, Escalopes de volaille..."
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Type de produit"
                    value={formData.product_type}
                    onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                    required
                    fullWidth
                    placeholder="Ex: Volaille, Porc, Bœuf..."
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Température initiale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={formData.start_core_temperature}
                    onChange={(e) => setFormData({...formData, start_core_temperature: Number(e.target.value)})}
                    required
                    fullWidth
                    helperText="Température à cœur au début du refroidissement"
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Température finale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={formData.end_core_temperature || ''}
                    onChange={(e) => setFormData({...formData, end_core_temperature: e.target.value ? Number(e.target.value) : null})}
                    fullWidth
                    helperText="Température à cœur à la fin (optionnel si en cours)"
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Date et heure de début"
                    type="datetime-local"
                    value={formatDateTimeForInput(formData.start_date)}
                    onChange={(e) => setFormData({...formData, start_date: new Date(e.target.value).toISOString()})}
                    required
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Date et heure de fin"
                    type="datetime-local"
                    value={formData.end_date ? formatDateTimeForInput(formData.end_date) : ''}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                    helperText="Laisser vide si le refroidissement est en cours"
                  />
                </Box>

                {/* Section d analyse du refroidissement */}
                {formData.end_core_temperature !== null && formData.end_core_temperature !== undefined && formData.end_date && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Card variant="outlined" sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <AcUnit />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Analyse du Refroidissement
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Validation automatique HACCP
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                        {coolingRate && (
                          <Box>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                              <Timer color="primary" sx={{ mb: 1 }} />
                              <Typography variant="caption" color="text.secondary" display="block">
                                Vitesse de refroidissement
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {coolingRate.toFixed(1)} °C/h
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <TrendingDown color="info" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Écart de température
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {(formData.start_core_temperature - formData.end_core_temperature).toFixed(1)}°C
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <AccessTime color="warning" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Durée processus
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            {coolingStatus === 'compliant' ? <CheckCircle color="success" sx={{ mb: 1 }} /> : <Cancel color="error" sx={{ mb: 1 }} />}
                            <Typography variant="caption" color="text.secondary" display="block">
                              Conformité HACCP
                            </Typography>
                            <Chip
                              label={
                                coolingStatus === 'compliant' ? 'Conforme' :
                                coolingStatus === 'warning' ? 'Acceptable' :
                                coolingStatus === 'non-compliant' ? 'Non conforme' : 'En cours'
                              }
                              color={
                                coolingStatus === 'compliant' ? 'success' :
                                coolingStatus === 'warning' ? 'warning' :
                                coolingStatus === 'non-compliant' ? 'error' : 'default'
                              }
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* Barre de progression */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Progression du refroidissement
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={getProgressValue()}
                          color={coolingStatus === 'compliant' ? 'success' : coolingStatus === 'warning' ? 'warning' : 'error'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {getProgressValue().toFixed(0)}% de refroidissement accompli
                        </Typography>
                      </Box>

                      <Alert 
                        severity={
                          coolingStatus === 'compliant' ? 'success' :
                          coolingStatus === 'warning' ? 'warning' :
                          coolingStatus === 'non-compliant' ? 'error' : 'info'
                        }
                      >
                        {coolingStatus === 'compliant' && 
                          'Refroidissement conforme aux règles HACCP (65°C → 10°C en moins de 6h)'}
                        {coolingStatus === 'warning' && 
                          'Température finale atteinte mais délai HACCP dépassé'}
                        {coolingStatus === 'non-compliant' && 
                          'Refroidissement non conforme - température finale trop élevée'}
                        {coolingStatus === 'pending' && 
                          'Refroidissement en cours - données incomplètes'}
                      </Alert>
                    </Card>
                  </Box>
                )}

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    label="Commentaires et observations"
                    multiline
                    rows={3}
                    value={formData.comments || ''}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    fullWidth
                    placeholder="Actions correctives, conditions particulières, observations..."
                  />
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={loading ? <Schedule /> : <Save />}
                      disabled={loading}
                      fullWidth
                      sx={{ 
                        py: 2,
                        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        }
                      }}
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer le suivi de refroidissement'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Guide HACCP */}
        <Card sx={{ mt: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
            p: 3, 
            borderBottom: '1px solid', 
            borderColor: 'divider' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <AcUnit />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Guide du Refroidissement HACCP
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Règles et bonnes pratiques pour la sécurité alimentaire
                </Typography>
              </Box>
            </Box>
          </Box>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  🎯 Objectifs HACCP
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• <strong>Température cible :</strong> Passer de 65°C à 10°C</Typography>
                  <Typography variant="body2">• <strong>Délai maximum :</strong> 6 heures maximum</Typography>
                  <Typography variant="body2">• <strong>Zone critique :</strong> Entre 65°C et 10°C (multiplication bactérienne)</Typography>
                  <Typography variant="body2">• <strong>Mesure obligatoire :</strong> Contrôle de température à cœur</Typography>
                </Stack>
              </Box>
              
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
                  ⚠️ Actions Correctives
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• <strong>Non-conformité détectée :</strong> Analyser les causes immédiates</Typography>
                  <Typography variant="body2">• <strong>Équipement défaillant :</strong> Vérifier le fonctionnement des équipements</Typography>
                  <Typography variant="body2">• <strong>Produit compromis :</strong> Évaluer la sécurité sanitaire</Typography>
                  <Typography variant="body2">• <strong>Documentation :</strong> Enregistrer toutes les mesures prises</Typography>
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Section Historique */}
        <Card sx={{ mt: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', 
            p: 3, 
            borderBottom: '1px solid', 
            borderColor: 'divider' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <History />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Historique des Refroidissements
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Derniers enregistrements de suivi de refroidissement HACCP
                </Typography>
              </Box>
            </Box>
          </Box>
          <CardContent sx={{ p: 0 }}>
            {historyRecords.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Produit</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Temp. Début</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Temp. Fin</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date début</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date fin</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Conformité</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyRecords.map((record) => {
                      const recordCoolingStatus = record.end_core_temperature ? 
                        (record.start_core_temperature >= 65 && record.end_core_temperature <= 10 && 
                         record.end_date && 
                         ((new Date(record.end_date).getTime() - new Date(record.start_date).getTime()) / (1000 * 60 * 60)) <= 6) ? 'compliant' :
                        (record.end_core_temperature <= 10 ? 'warning' : 'non-compliant') : 'pending';

                      return (
                        <TableRow key={record.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {record.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {record.product_type}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {record.start_core_temperature}°C
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {record.end_core_temperature ? `${record.end_core_temperature}°C` : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(record.start_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {record.end_date ? 
                                new Date(record.end_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'En cours'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                recordCoolingStatus === 'compliant' ? 'Conforme' :
                                recordCoolingStatus === 'warning' ? 'Acceptable' :
                                recordCoolingStatus === 'non-compliant' ? 'Non conforme' : 'En cours'
                              }
                              color={
                                recordCoolingStatus === 'compliant' ? 'success' :
                                recordCoolingStatus === 'warning' ? 'warning' :
                                recordCoolingStatus === 'non-compliant' ? 'error' : 'default'
                              }
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Modifier l'enregistrement">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEdit(record)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer l'enregistrement">
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    setRecordToDelete(record);
                                    setDeleteDialogOpen(true);
                                  }}
                                  sx={{ color: 'error.main' }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <History sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucun enregistrement trouvé
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Les enregistrements de refroidissement apparaîtront ici après avoir été créés.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog de confirmation de suppression */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setRecordToDelete(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'error.main' }}>
              <Delete />
            </Avatar>
            Confirmer la suppression
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Êtes-vous sûr de vouloir supprimer cet enregistrement de refroidissement ?
            </Typography>
            {recordToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Produit :</strong> {recordToDelete.product_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Type :</strong> {recordToDelete.product_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Date :</strong> {new Date(recordToDelete.start_date).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cette action est irréversible. L'enregistrement sera définitivement supprimé de votre historique HACCP.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => {
                setDeleteDialogOpen(false);
                setRecordToDelete(null);
              }}
              variant="outlined"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDelete}
              variant="contained"
              color="error"
              startIcon={<Delete />}
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal d'édition */}
        <Dialog
          open={editModalOpen}
          onClose={closeEditModal}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { minHeight: '80vh' }
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <Edit />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Modification de l'Enregistrement
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Traçabilité du processus de refroidissement HACCP
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleUpdate} sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                <Box>
                  <TextField
                    label="Nom du produit"
                    value={editFormData.product_name}
                    onChange={(e) => setEditFormData({...editFormData, product_name: e.target.value})}
                    required
                    fullWidth
                    placeholder="Ex: Rôti de porc, Escalopes de volaille..."
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Type de produit"
                    value={editFormData.product_type}
                    onChange={(e) => setEditFormData({...editFormData, product_type: e.target.value})}
                    required
                    fullWidth
                    placeholder="Ex: Volaille, Porc, Bœuf..."
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Température initiale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={editFormData.start_core_temperature}
                    onChange={(e) => setEditFormData({...editFormData, start_core_temperature: Number(e.target.value)})}
                    required
                    fullWidth
                    helperText="Température à cœur au début du refroidissement"
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Température finale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={editFormData.end_core_temperature || ''}
                    onChange={(e) => setEditFormData({...editFormData, end_core_temperature: e.target.value ? Number(e.target.value) : null})}
                    fullWidth
                    helperText="Température à cœur à la fin (optionnel si en cours)"
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Date et heure de début"
                    type="datetime-local"
                    value={formatDateTimeForInput(editFormData.start_date)}
                    onChange={(e) => setEditFormData({...editFormData, start_date: new Date(e.target.value).toISOString()})}
                    required
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Date et heure de fin"
                    type="datetime-local"
                    value={editFormData.end_date ? formatDateTimeForInput(editFormData.end_date) : ''}
                    onChange={(e) => setEditFormData({...editFormData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                    helperText="Laisser vide si le refroidissement est en cours"
                  />
                </Box>

                {/* Analyse du refroidissement pour le modal */}
                {editFormData.end_core_temperature !== null && editFormData.end_core_temperature !== undefined && editFormData.end_date && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Card variant="outlined" sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <AcUnit />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Analyse du Refroidissement
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Validation automatique HACCP
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                        {calculateEditCoolingRate() && (
                          <Box>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                              <Timer color="primary" sx={{ mb: 1 }} />
                              <Typography variant="caption" color="text.secondary" display="block">
                                Vitesse de refroidissement
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {calculateEditCoolingRate()?.toFixed(1)} °C/h
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <TrendingDown color="info" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Écart de température
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {(editFormData.start_core_temperature - editFormData.end_core_temperature).toFixed(1)}°C
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <AccessTime color="warning" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Durée processus
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {((new Date(editFormData.end_date).getTime() - new Date(editFormData.start_date).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Alert 
                        severity={
                          getEditCoolingStatus() === 'compliant' ? 'success' :
                          getEditCoolingStatus() === 'warning' ? 'warning' :
                          getEditCoolingStatus() === 'non-compliant' ? 'error' : 'info'
                        }
                      >
                        {getEditCoolingStatus() === 'compliant' && 
                          'Refroidissement conforme aux règles HACCP (65°C → 10°C en moins de 6h)'}
                        {getEditCoolingStatus() === 'warning' && 
                          'Température finale atteinte mais délai HACCP dépassé'}
                        {getEditCoolingStatus() === 'non-compliant' && 
                          'Refroidissement non conforme - température finale trop élevée'}
                        {getEditCoolingStatus() === 'pending' && 
                          'Refroidissement en cours - données incomplètes'}
                      </Alert>
                    </Card>
                  </Box>
                )}

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    label="Commentaires et observations"
                    multiline
                    rows={3}
                    value={editFormData.comments || ''}
                    onChange={(e) => setEditFormData({...editFormData, comments: e.target.value})}
                    fullWidth
                    placeholder="Actions correctives, conditions particulières, observations..."
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={closeEditModal}
              variant="outlined"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleUpdate}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <Schedule /> : <Save />}
              sx={{
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                }
              }}
            >
              {loading ? 'Modification...' : 'Modifier l\'enregistrement'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}