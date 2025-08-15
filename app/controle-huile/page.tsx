"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextField,
  Button,
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
  Chip,
  Avatar,
  Skeleton,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  LocalDining,
  Science,
  CheckCircle,
  Save,
  Warning,
  History,
  Assessment,
  Add,
  Kitchen,
  WaterDrop,
  FactCheck,
  Visibility,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

type Equipment = Tables<'equipments'>;
type OilControl = Tables<'oil_controls'>;
type OilEquipmentReading = Tables<'oil_equipment_readings'>;
type CorrectiveAction = Tables<'corrective_actions'>;

type OilControlWithReadings = OilControl & {
  oil_equipment_readings: (OilEquipmentReading & {
    equipment: Equipment;
  })[];
};

type EquipmentWithReadings = Equipment & {
  latest_reading?: OilEquipmentReading;
};

export default function OilQualityControl() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  // États principaux
  const [currentTab, setCurrentTab] = useState(0);
  const [equipments, setEquipments] = useState<EquipmentWithReadings[]>([]);
  const [oilControls, setOilControls] = useState<OilControlWithReadings[]>([]);
  const [, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState({ 
    equipments: true, 
    controls: true, 
    actions: true 
  });
  
  // États pour les dialogues
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [currentControl, setCurrentControl] = useState<OilControl | null>(null);
  
  // États pour le formulaire de lecture
  const [readingForm, setReadingForm] = useState<Partial<TablesInsert<'oil_equipment_readings'>>>({
    control_type: 'visual',
    temperature: null,
    polarity: null,
    oil_level: null,
    comments: '',
    is_compliant: null
  });

  // Types de contrôle selon le nouveau schéma
  const controlTypes = [
    { value: 'change_cleaning', label: 'Changement/Nettoyage', icon: <WaterDrop />, description: 'Changement ou nettoyage d\'huile' },
    { value: 'collection', label: 'Collecte', icon: <LocalDining />, description: 'Collecte d\'échantillon' },
    { value: 'filtration', label: 'Filtration', icon: <Science />, description: 'Filtration de l\'huile' },
    { value: 'strip', label: 'Bandelette test', icon: <FactCheck />, description: 'Test bandelette polarité' },
    { value: 'visual', label: 'Visuel', icon: <Visibility />, description: 'Contrôle visuel' }
  ];

  // Seuils de conformité
  const complianceThresholds = {
    temperature: { min: 160, max: 180 },
    polarity: { max: 25 }
  };

  // Fetch des équipements
  const fetchEquipments = useCallback(async () => {
    if (!employee?.organization_id) return;
    
    setLoading(prev => ({ ...prev, equipments: true }));
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *,
          oil_equipment_readings!equipment_id (
            *
          )
        `)
        .eq('organization_id', employee.organization_id)
        .eq('equipment_state', true)
        .order('name');

      if (error) {
        if (error.code === '42P01') {
          enqueueSnackbar('Tables de contrôle d\'huile non configurées. Contactez votre administrateur.', { variant: 'warning' });
          return;
        }
        throw error;
      }

      // Ajouter la dernière lecture pour chaque équipement
      const equipmentsWithLatest = (data || []).map(equipment => {
        const readings = equipment.oil_equipment_readings || [];
        const latestReading = readings.sort((a: OilEquipmentReading, b: OilEquipmentReading) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        )[0] || null;
        
        return {
          ...equipment,
          latest_reading: latestReading
        };
      });

      setEquipments(equipmentsWithLatest);
    } catch (error) {
      console.error('Erreur lors du chargement des équipements:', error);
      enqueueSnackbar('Erreur lors du chargement des équipements', { variant: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, equipments: false }));
    }
  }, [employee?.organization_id, enqueueSnackbar]);

  // Fetch des contrôles d'huile
  const fetchOilControls = useCallback(async () => {
    if (!employee?.organization_id) return;
    
    setLoading(prev => ({ ...prev, controls: true }));
    try {
      const { data, error } = await supabase
        .from('oil_controls')
        .select(`
          *,
          oil_equipment_readings (
            *,
            equipment:equipments (*)
          )
        `)
        .eq('organization_id', employee.organization_id)
        .order('reading_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOilControls(data as OilControlWithReadings[] || []);
    } catch (error) {
      console.error('Erreur lors du chargement des contrôles:', error);
      enqueueSnackbar('Erreur lors du chargement des contrôles', { variant: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, controls: false }));
    }
  }, [employee?.organization_id, enqueueSnackbar]);

  // Fetch des actions correctives
  const fetchCorrectiveActions = useCallback(async () => {
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      const { data, error } = await supabase
        .from('corrective_actions')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${employee?.organization_id}`)
        .eq('is_active', true);

      if (error) throw error;
      setCorrectiveActions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des actions correctives:', error);
      enqueueSnackbar('Erreur lors du chargement des actions correctives', { variant: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  }, [employee?.organization_id, enqueueSnackbar]);

  // Chargement initial
  useEffect(() => {
    if (employee?.organization_id) {
      fetchEquipments();
      fetchOilControls();
      fetchCorrectiveActions();
    }
  }, [fetchEquipments, fetchOilControls, fetchCorrectiveActions, employee?.organization_id]);

  // Démarrer un nouveau contrôle
  const startNewControl = useCallback(async () => {
    if (!employee?.organization_id) return;
    
    try {
      const { data, error } = await supabase
        .from('oil_controls')
        .insert({
          organization_id: employee.organization_id,
          reading_date: new Date().toISOString().split('T')[0],
          reading_time: new Date().toTimeString().split(' ')[0],
          created_by: user?.id || null,
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          enqueueSnackbar('Tables de contrôle d\'huile non configurées. Contactez votre administrateur.', { variant: 'warning' });
          return null;
        }
        if (error.code === 'PGRST301') {
          enqueueSnackbar('Accès non autorisé aux contrôles d\'huile. Vérifiez vos permissions.', { variant: 'error' });
          return null;
        }
        throw error;
      }
      setCurrentControl(data);
      enqueueSnackbar('Nouvelle session de contrôle créée', { variant: 'success' });
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du contrôle:', error);
      enqueueSnackbar('Erreur lors de la création du contrôle', { variant: 'error' });
      return null;
    }
  }, [employee?.organization_id, user?.id, enqueueSnackbar]);

  // Ouvrir le dialogue de contrôle pour un équipement
  const openControlDialog = useCallback(async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    
    // Créer un nouveau contrôle ou utiliser un contrôle en cours
    if (!currentControl) {
      const newControl = await startNewControl();
      if (!newControl) return;
    }
    
    setControlDialogOpen(true);
    setReadingForm({
      control_type: 'visual',
      temperature: null,
      polarity: null,
      oil_level: null,
      comments: '',
      is_compliant: null
    });
  }, [currentControl, startNewControl]);

  // Valider la conformité automatiquement
  const validateCompliance = useCallback((reading: Partial<TablesInsert<'oil_equipment_readings'>>, equipment: Equipment) => {
    if (reading.control_type === 'strip' && reading.polarity !== null && reading.polarity !== undefined) {
      return reading.polarity <= (equipment.max_polarity || complianceThresholds.polarity.max);
    }
    if (reading.temperature !== null && reading.temperature !== undefined) {
      const minTemp = equipment.min_temperature || complianceThresholds.temperature.min;
      const maxTemp = equipment.max_temperature || complianceThresholds.temperature.max;
      return reading.temperature >= minTemp && reading.temperature <= maxTemp;
    }
    return null;
  }, [complianceThresholds.polarity.max, complianceThresholds.temperature.min, complianceThresholds.temperature.max]);

  // Sauvegarder une lecture d'équipement
  const saveEquipmentReading = useCallback(async () => {
    if (!currentControl || !selectedEquipment) return;
    
    try {
      const compliance = validateCompliance(readingForm, selectedEquipment);
      
      const { error } = await supabase
        .from('oil_equipment_readings')
        .insert({
          oil_control_id: currentControl.id,
          equipment_id: selectedEquipment.id,
          control_type: readingForm.control_type || 'visual',
          temperature: readingForm.temperature,
          polarity: readingForm.polarity,
          oil_level: readingForm.oil_level,
          comments: readingForm.comments,
          is_compliant: compliance !== null ? compliance : readingForm.is_compliant,
          critical_control_point: readingForm.control_type === 'strip' || readingForm.control_type === 'change_cleaning'
        });

      if (error) throw error;
      
      enqueueSnackbar('Lecture enregistrée avec succès!', { variant: 'success' });
      setControlDialogOpen(false);
      fetchEquipments();
      fetchOilControls();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      enqueueSnackbar('Erreur lors de la sauvegarde', { variant: 'error' });
    }
  }, [currentControl, selectedEquipment, readingForm, validateCompliance, enqueueSnackbar, fetchEquipments, fetchOilControls]);

  // Finaliser un contrôle
  const finishControl = useCallback(async () => {
    if (!currentControl) return;
    
    try {
      const { error } = await supabase
        .from('oil_controls')
        .update({ status: 'completed' })
        .eq('id', currentControl.id);

      if (error) throw error;
      
      setCurrentControl(null);
      enqueueSnackbar('Contrôle finalisé avec succès!', { variant: 'success' });
      fetchOilControls();
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      enqueueSnackbar('Erreur lors de la finalisation', { variant: 'error' });
    }
  }, [currentControl, enqueueSnackbar, fetchOilControls]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const allReadings = oilControls.flatMap(control => control.oil_equipment_readings || []);
    const recentReadings = allReadings.slice(0, 50);
    const nonCompliantReadings = recentReadings.filter(r => r.is_compliant === false);
    const criticalReadings = recentReadings.filter(r => r.critical_control_point);
    
    return {
      totalEquipments: equipments.length,
      totalReadings: recentReadings.length,
      nonCompliantReadings: nonCompliantReadings.length,
      criticalReadings: criticalReadings.length,
      complianceRate: recentReadings.length > 0 ? 
        ((recentReadings.length - nonCompliantReadings.length) / recentReadings.length) * 100 : 
        100
    };
  }, [equipments, oilControls]);

  // Gérer le changement d'onglet
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  }, []);

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
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
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
            <Kitchen fontSize="large" />
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
              Contrôle HACCP des Huiles
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
              Surveillance systématique des huiles de friture
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.8,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {currentControl ? 
                `Contrôle en cours : ${new Date(currentControl.reading_date).toLocaleDateString('fr-FR')}` :
                `Dernière session : ${oilControls.length > 0 ? 
                  new Date(oilControls[0].reading_date).toLocaleDateString('fr-FR') : 'Aucune'
                }`
              }
            </Typography>
          </Box>
        </Box>
        
        {/* Actions rapides */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mt: 3,
          flexWrap: 'wrap'
        }}>
          {!currentControl ? (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={startNewControl}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Nouveau contrôle
            </Button>
          ) : (
            <>
              <Chip
                label={`Contrôle en cours - ${new Date(currentControl.reading_time || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                color="secondary"
                sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: '#ff9800', fontWeight: 600 }}
              />
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={finishControl}
                sx={{
                  bgcolor: 'rgba(76, 175, 80, 0.9)',
                  '&:hover': { bgcolor: 'rgba(76, 175, 80, 1)' }
                }}
              >
                Finaliser
              </Button>
            </>
          )}
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        
        {/* Tabs Navigation */}
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
              icon={<Kitchen />}
              label="Équipements"
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              icon={<History />}
              label="Historique"
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              icon={<Assessment />}
              label="Analyses"
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Box>
        
        {/* Statistiques rapides */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
          gap: { xs: 2, sm: 3 }, 
          mb: { xs: 3, md: 4 }
        }}>
          <StatCard 
            title="Équipements" 
            value={stats.totalEquipments} 
            icon={<Kitchen />} 
            color="#ff9800"
          />
          <StatCard 
            title="Lectures récentes" 
            value={stats.totalReadings} 
            icon={<Assessment />} 
            color="#2196f3"
          />
          <StatCard 
            title="Non-conformités" 
            value={stats.nonCompliantReadings} 
            icon={stats.nonCompliantReadings > 0 ? <Warning /> : <CheckCircle />} 
            color={stats.nonCompliantReadings > 0 ? '#f44336' : '#4caf50'}
          />
          <StatCard 
            title="Taux de conformité" 
            value={stats.complianceRate.toFixed(0) + '%'} 
            icon={stats.complianceRate >= 90 ? <CheckCircle /> : <Warning />} 
            color={stats.complianceRate >= 90 ? '#4caf50' : '#ff9800'}
          />
        </Box>

        {currentTab === 0 && (
          <>
            {/* Grille des équipements */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
              gap: 3,
              mb: 4
            }}>
              {loading.equipments ? (
                Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                ))
              ) : equipments.length === 0 ? (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                      <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500', mx: 'auto', mb: 2 }}>
                        <Kitchen />
                      </Avatar>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Aucun équipement configuré
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Contactez votre administrateur pour configurer les équipements
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ) : (
                equipments.map((equipment) => (
                  <EquipmentCard
                    key={equipment.id}
                    equipment={equipment}
                    onControl={() => openControlDialog(equipment)}
                    controlInProgress={currentControl !== null}
                  />
                ))
              )}
            </Box>
          </>
        )}

        {currentTab === 1 && (
          <>
            {/* Historique des contrôles */}
            <HistorySection 
              oilControls={oilControls} 
              loading={loading.controls} 
              controlTypes={controlTypes}
            />
          </>
        )}

        {currentTab === 2 && (
          <>
            {/* Analyses et rapports */}
            <AnalysisSection 
              equipments={equipments}
            />
          </>
        )}
        
        {/* Dialogue de contrôle d'équipement */}
        <Dialog
          open={controlDialogOpen}
          onClose={() => setControlDialogOpen(false)}
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
                <Kitchen />
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedEquipment?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedEquipment?.equipment_type} • Capacité: {selectedEquipment?.oil_capacity}L
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            {selectedEquipment && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Type d&apos;huile: {selectedEquipment.oil_type} • 
                  Localisation: {selectedEquipment.location}
                </Alert>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Type de contrôle</InputLabel>
                    <Select
                      value={readingForm.control_type || 'visual'}
                      label="Type de contrôle"
                      onChange={(e) => setReadingForm({...readingForm, control_type: e.target.value as TablesInsert<'oil_equipment_readings'>['control_type']})}
                    >
                      {controlTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {type.icon}
                            <Box>
                              <Typography variant="body2">{type.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {type.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {(readingForm.control_type === 'strip' || readingForm.control_type === 'collection') && (
                    <TextField
                      label="Polarité (%)"
                      type="number"
                      slotProps={{ htmlInput: { step: "0.1", min: "0", max: "100" } }}
                      value={readingForm.polarity || ''}
                      onChange={(e) => setReadingForm({...readingForm, polarity: e.target.value ? Number(e.target.value) : null})}
                      fullWidth
                      helperText={
                        readingForm.polarity ? 
                          readingForm.polarity <= (selectedEquipment.max_polarity || 25) ? 
                            "✅ Conforme" : "❌ Non conforme (>" + (selectedEquipment.max_polarity || 25) + "%)" :
                          `Seuil: ≤${selectedEquipment.max_polarity || 25}%`
                      }
                      error={readingForm.polarity ? readingForm.polarity > (selectedEquipment.max_polarity || 25) : false}
                    />
                  )}

                  <TextField
                    label="Température (°C)"
                    type="number"
                    slotProps={{ htmlInput: { step: "0.1", min: "0", max: "250" } }}
                    value={readingForm.temperature || ''}
                    onChange={(e) => setReadingForm({...readingForm, temperature: e.target.value ? Number(e.target.value) : null})}
                    fullWidth
                    helperText={
                      readingForm.temperature ? 
                        readingForm.temperature >= (selectedEquipment.min_temperature || 160) && 
                        readingForm.temperature <= (selectedEquipment.max_temperature || 180) ? 
                          "✅ Conforme" : "❌ Hors plage" :
                        `Plage: ${selectedEquipment.min_temperature || 160}-${selectedEquipment.max_temperature || 180}°C`
                    }
                  />

                  <TextField
                    label="Niveau d'huile (%)"
                    type="number"
                    slotProps={{ htmlInput: { step: "1", min: "0", max: "100" } }}
                    value={readingForm.oil_level || ''}
                    onChange={(e) => setReadingForm({...readingForm, oil_level: e.target.value ? Number(e.target.value) : null})}
                    fullWidth
                  />

                  <TextField
                    label="Commentaires"
                    value={readingForm.comments || ''}
                    onChange={(e) => setReadingForm({...readingForm, comments: e.target.value})}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Observations, remarques..."
                    sx={{ gridColumn: { md: '1 / -1' } }}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setControlDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="contained" 
              onClick={saveEquipmentReading}
              startIcon={<Save />}
            >
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
}

// Composant pour une carte d'équipement
const EquipmentCard = React.memo(({ equipment, onControl, controlInProgress }: {
  equipment: EquipmentWithReadings;
  onControl: () => void;
  controlInProgress: boolean;
}) => {
  const getStatusColor = () => {
    if (!equipment.latest_reading) return 'grey';
    return equipment.latest_reading.is_compliant ? 'success' : 'error';
  };

  const getLastReadingTime = () => {
    if (!equipment.latest_reading) return 'Jamais contrôlé';
    const time = new Date(equipment.latest_reading.created_at || '').getTime();
    const now = new Date().getTime();
    const diffHours = (now - time) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Moins d\'1h';
    if (diffHours < 24) return `Il y a ${Math.floor(diffHours)}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <Card sx={{ 
      height: '100%', 
      transition: 'all 0.3s',
      '&:hover': { 
        transform: 'translateY(-2px)',
        boxShadow: 6
      },
      cursor: controlInProgress ? 'pointer' : 'default',
      opacity: controlInProgress ? 1 : 0.8
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ 
            bgcolor: equipment.equipment_type === 'fryer' ? '#ff9800' : '#2196f3',
            color: 'white'
          }}>
            <Kitchen />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {equipment.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {equipment.equipment_type} • {equipment.oil_capacity}L
            </Typography>
          </Box>
          <Chip
            label={equipment.latest_reading?.is_compliant ? 'Conforme' : equipment.latest_reading ? 'Non conforme' : 'Non testé'}
            color={getStatusColor() as 'success' | 'error' | 'default'}
            size="small"
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Type d&apos;huile: {equipment.oil_type || 'Non spécifié'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Localisation: {equipment.location || 'Non spécifiée'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Dernier contrôle
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {getLastReadingTime()}
          </Typography>
        </Box>
        
        {equipment.latest_reading && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
            {equipment.latest_reading.temperature && (
              <Box>
                <Typography variant="caption" color="text.secondary">Température</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {equipment.latest_reading.temperature}°C
                </Typography>
              </Box>
            )}
            {equipment.latest_reading.polarity && (
              <Box>
                <Typography variant="caption" color="text.secondary">Polarité</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {equipment.latest_reading.polarity}%
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        <Button
          variant="contained"
          fullWidth
          startIcon={<Science />}
          onClick={onControl}
          disabled={!controlInProgress}
          sx={{ mt: 'auto' }}
        >
          {controlInProgress ? 'Effectuer contrôle' : 'Démarrer session'}
        </Button>
      </CardContent>
    </Card>
  );
});
EquipmentCard.displayName = 'EquipmentCard';

// Composant pour l'historique
const HistorySection = React.memo(({ oilControls, loading, controlTypes }: {
  oilControls: OilControlWithReadings[];
  loading: boolean;
  controlTypes: { value: string; label: string; icon: React.ReactNode; description: string }[];
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  if (oilControls.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500', mx: 'auto', mb: 2, width: 64, height: 64 }}>
            <History sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun historique
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Aucun contrôle d&apos;huile n&apos;a encore été effectué
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {oilControls.map((control) => (
        <Card key={control.id}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Session du {new Date(control.reading_date).toLocaleDateString('fr-FR')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(control.reading_time || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • 
                  {control.oil_equipment_readings?.length || 0} lecture{(control.oil_equipment_readings?.length || 0) > 1 ? 's' : ''}
                </Typography>
              </Box>
              <Chip
                label={control.status === 'completed' ? 'Terminée' : control.status === 'in_progress' ? 'En cours' : 'Annulée'}
                color={control.status === 'completed' ? 'success' : control.status === 'in_progress' ? 'warning' : 'error'}
                size="small"
              />
            </Box>
            
            {control.oil_equipment_readings && control.oil_equipment_readings.length > 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Équipement</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type de contrôle</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Température</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Polarité</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Conformité</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {control.oil_equipment_readings.map((reading) => (
                      <TableRow key={reading.id}>
                        <TableCell>{reading.equipment?.name}</TableCell>
                        <TableCell>
                          {controlTypes.find(t => t.value === reading.control_type)?.label || reading.control_type}
                        </TableCell>
                        <TableCell>
                          {reading.temperature ? `${reading.temperature}°C` : '-'}
                        </TableCell>
                        <TableCell>
                          {reading.polarity ? `${reading.polarity}%` : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={reading.is_compliant ? 'Conforme' : reading.is_compliant === false ? 'Non conforme' : 'Non évalué'}
                            color={reading.is_compliant ? 'success' : reading.is_compliant === false ? 'error' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
});
HistorySection.displayName = 'HistorySection';

// Composant pour les analyses
const AnalysisSection = React.memo(({ equipments }: {
  equipments: EquipmentWithReadings[];
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Analyse de conformité
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>
            <Box>
              <Typography variant="h6" gutterBottom>Résumé des équipements</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {equipments.map((equipment) => (
                  <Box key={equipment.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">{equipment.name}</Typography>
                    <Chip
                      label={equipment.latest_reading?.is_compliant ? 'OK' : equipment.latest_reading ? 'KO' : '?'}
                      color={equipment.latest_reading?.is_compliant ? 'success' : equipment.latest_reading ? 'error' : 'default'}
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            </Box>
            
            <Box>
              <Typography variant="h6" gutterBottom>Tendances</Typography>
              <Typography variant="body2" color="text.secondary">
                Fonctionnalité à venir : graphiques et tendances des contrôles
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
});
AnalysisSection.displayName = 'AnalysisSection';

// Composant mémoïsé pour les cartes de statistiques
const StatCard = React.memo(({ title, value, icon, color }: { 
  title: string, 
  value: string | number, 
  icon: React.ReactNode,
  color: string
}) => (
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
            {title}
          </Typography>
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';