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
  Skeleton
} from '@mui/material';
import {
  LocalDining,
  Science,
  CheckCircle,
  Save,
  Warning,
  History,
  Assessment
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function OilQualityControl() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  // États
  const [controls, setControls] = useState<Tables<'oil_quality_controls'>[]>([]);
  const [loading, setLoading] = useState({ controls: true });
  const [formData, setFormData] = useState<TablesInsert<'oil_quality_controls'>>({
    control_date: new Date().toISOString(),
    oil_type: '',
    equipment_name: '',
    control_type: 'visual',
    polar_compounds_percentage: null,
    result: '',
    action_taken: '',
    next_control_date: null,
    comments: '',
    photo_url: '',
    organization_id: null,
    employee_id: null,
    user_id: null,
  });

  // Types d'huile prédéfinis
  const oilTypes = [
    'Huile de tournesol',
    'Huile de colza',
    'Huile d&apos;olive',
    'Huile de friture mélangée',
    'Autre'
  ];

  // Types de contrôle
  const controlTypes = [
    { value: 'visual', label: 'Contrôle visuel' },
    { value: 'polar_compounds', label: 'Mesure composés polaires' },
    { value: 'temperature', label: 'Contrôle température' },
    { value: 'smell', label: 'Contrôle olfactif' }
  ];

  // Résultats possibles
  const resultOptions = [
    { value: 'conforme', label: 'Conforme', color: 'success' },
    { value: 'non_conforme', label: 'Non conforme', color: 'error' },
    { value: 'limite', label: 'À la limite', color: 'warning' },
    { value: 'renouveler', label: 'À renouveler', color: 'error' }
  ];

  // Fetch des contrôles
  const fetchControls = useCallback(async () => {
    setLoading(prev => ({ ...prev, controls: true }));
    const { data, error } = await supabase
      .from('oil_quality_controls')
      .select('*')
      .order('control_date', { ascending: false })
      .limit(50);

    if (!error && data) {
      setControls(data);
    } else {
      enqueueSnackbar('Erreur de chargement des contrôles', { variant: 'error' });
    }
    
    setLoading(prev => ({ ...prev, controls: false }));
  }, [enqueueSnackbar]);

  // Chargement initial
  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  // Validation du pourcentage de composés polaires
  const validatePolarCompounds = useCallback((percentage: number | null) => {
    if (percentage === null) return null;
    if (percentage <= 24) return 'conforme';
    if (percentage <= 27) return 'limite';
    return 'non_conforme';
  }, []);

  // Gestion du changement de pourcentage de composés polaires
  const handlePolarCompoundsChange = useCallback((value: string) => {
    const percentage = value ? Number(value) : null;
    const suggestedResult = validatePolarCompounds(percentage);
    
    setFormData(prev => ({
      ...prev, 
      polar_compounds_percentage: percentage,
      result: suggestedResult || prev.result
    }));
  }, [validatePolarCompounds]);

  // Soumission du formulaire
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('oil_quality_controls')
        .insert([{
          ...formData,
          employee_id: employee?.id || null,
          user_id: user?.id || null,
        }]);
      
      if (error) throw error;
      
      enqueueSnackbar('Contrôle enregistré avec succès!', { variant: 'success' });
      fetchControls();
      setFormData({
        control_date: new Date().toISOString(),
        oil_type: '',
        equipment_name: '',
        control_type: 'visual',
        polar_compounds_percentage: null,
        result: '',
        action_taken: '',
        next_control_date: null,
        comments: '',
        photo_url: '',
        organization_id: null,
        employee_id: null,
        user_id: null,
      });
    } catch {
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    }
  }, [formData, employee, user, enqueueSnackbar, fetchControls]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const recentControls = controls.slice(0, 20);
    const nonCompliantControls = recentControls.filter(c => c.result === 'non_conforme' || c.result === 'renouveler');
    
    return {
      totalControls: recentControls.length,
      nonCompliantControls: nonCompliantControls.length,
      complianceRate: recentControls.length > 0 ? 
        ((recentControls.length - nonCompliantControls.length) / recentControls.length) * 100 : 
        100
    };
  }, [controls]);

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
            <LocalDining fontSize="large" />
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
              Contrôle Qualité de l&apos;Huile
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
              Surveillance des huiles de friture et composés polaires
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.8,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Dernier contrôle : {controls.length > 0 ? 
                new Date(controls[0].control_date).toLocaleDateString('fr-FR', { 
                  weekday: 'short', 
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Aucun'
              }
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        
        {/* Statistiques rapides */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
          gap: { xs: 2, sm: 3 }, 
          mb: { xs: 3, md: 4 }
        }}>
          <StatCard 
            title="Contrôles récents" 
            value={stats.totalControls} 
            icon={<Assessment />} 
            color="#ff9800"
          />
          <StatCard 
            title="Non-conformités" 
            value={stats.nonCompliantControls} 
            icon={stats.nonCompliantControls > 0 ? <Warning /> : <CheckCircle />} 
            color={stats.nonCompliantControls > 0 ? '#f44336' : '#4caf50'}
          />
          <StatCard 
            title="Taux de conformité" 
            value={stats.complianceRate.toFixed(0) + '%'} 
            icon={stats.complianceRate >= 90 ? <CheckCircle /> : <Warning />} 
            color={stats.complianceRate >= 90 ? '#4caf50' : '#ff9800'}
          />
        </Box>

        {/* Formulaire de nouveau contrôle */}
        <Card sx={{ 
          mb: 4,
          transition: 'all 0.3s', 
          '&:hover': { boxShadow: 6 },
          mx: { xs: -1, sm: 0 },
          borderRadius: { xs: 0, sm: 1 }
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: '#ff980020', color: '#ff9800' }}>
                <Science />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Nouveau Contrôle Qualité
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enregistrer un contrôle HACCP de l&apos;huile de friture
                </Typography>
              </Box>
            </Box>
            
            <Box 
              component="form" 
              onSubmit={handleSubmit} 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 3 
              }}
            >
              <FormControl fullWidth required>
                <InputLabel>Type d&apos;huile</InputLabel>
                <Select
                  value={formData.oil_type}
                  label="Type d'huile"
                  onChange={(e) => setFormData({...formData, oil_type: e.target.value})}
                >
                  {oilTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Équipement / Friteuse"
                value={formData.equipment_name || ''}
                onChange={(e) => setFormData({...formData, equipment_name: e.target.value})}
                fullWidth
                placeholder="Ex: Friteuse principale"
              />
              
              <FormControl fullWidth required>
                <InputLabel>Type de contrôle</InputLabel>
                <Select
                  value={formData.control_type}
                  label="Type de contrôle"
                  onChange={(e) => setFormData({...formData, control_type: e.target.value})}
                >
                  {controlTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {formData.control_type === 'polar_compounds' && (
                <TextField
                  label="Composés polaires (%)"
                  type="number"
                  inputProps={{ step: "0.1", min: "0", max: "100" }}
                  value={formData.polar_compounds_percentage || ''}
                  onChange={(e) => handlePolarCompoundsChange(e.target.value)}
                  fullWidth
                  helperText={
                    formData.polar_compounds_percentage !== null ? 
                      formData.polar_compounds_percentage <= 24 ? "✅ Conforme (≤24%)" :
                      formData.polar_compounds_percentage <= 27 ? "⚠️ À surveiller (24-27%)" :
                      "❌ Non conforme (>27%)" : 
                      "Seuils: ≤24% conforme, >27% non conforme"
                  }
                  error={formData.polar_compounds_percentage !== null && formData.polar_compounds_percentage > 27}
                />
              )}
              
              <FormControl fullWidth required>
                <InputLabel>Résultat</InputLabel>
                <Select
                  value={formData.result}
                  label="Résultat"
                  onChange={(e) => setFormData({...formData, result: e.target.value})}
                >
                  {resultOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Chip 
                        label={option.label} 
                        color={option.color as 'success' | 'error' | 'warning'} 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Action corrective"
                value={formData.action_taken || ''}
                onChange={(e) => setFormData({...formData, action_taken: e.target.value})}
                fullWidth
                placeholder="Action prise si nécessaire"
              />
              
              <TextField
                label="Commentaires"
                value={formData.comments || ''}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
                fullWidth
                placeholder="Observations..."
                sx={{ gridColumn: { lg: '1 / -1' } }}
              />
              
              <Box sx={{ gridColumn: { md: '1 / -1' }, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  sx={{ 
                    ml: 'auto',
                    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                    }
                  }}
                >
                  Enregistrer le contrôle
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Historique des contrôles */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              p: 3,
              pb: 0
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4caf5020', color: '#4caf50' }}>
                  <History />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Historique des Contrôles
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {controls.length} contrôle{controls.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date & Heure</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Huile / Équipement</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type de contrôle</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Composés polaires</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Résultat</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading.controls ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {Array(6).fill(0).map((_, j) => (
                          <TableCell key={j}><Skeleton variant="text" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : controls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500' }}>
                            <History />
                          </Avatar>
                          <Typography color="text.secondary">
                            Aucun contrôle enregistré
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    controls.map(control => {
                      const resultOption = resultOptions.find(option => option.value === control.result);
                      const isRecent = new Date().getTime() - new Date(control.control_date).getTime() < 86400000; // 24h
                      
                      return (
                        <TableRow 
                          key={control.id}
                          sx={{ 
                            bgcolor: isRecent ? 'success.light' : 'inherit',
                            opacity: isRecent ? 1 : 0.8
                          }}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {new Date(control.control_date).toLocaleDateString('fr-FR')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(control.control_date).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {control.oil_type}
                              </Typography>
                              {control.equipment_name && (
                                <Typography variant="caption" color="text.secondary">
                                  {control.equipment_name}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {controlTypes.find(type => type.value === control.control_type)?.label || control.control_type}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {control.polar_compounds_percentage !== null ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                  variant="body1" 
                                  fontWeight="bold"
                                  color={
                                    control.polar_compounds_percentage <= 24 ? 'success.main' :
                                    control.polar_compounds_percentage <= 27 ? 'warning.main' :
                                    'error.main'
                                  }
                                >
                                  {control.polar_compounds_percentage}%
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {resultOption && (
                              <Chip
                                size="small"
                                label={resultOption.label}
                                color={resultOption.color as 'success' | 'error' | 'warning'}
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {control.action_taken || 'Aucune'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

      </Container>
    </Box>
  );
}

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