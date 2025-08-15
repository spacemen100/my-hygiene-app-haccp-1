'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Container,
  Alert,
  IconButton,
  InputAdornment,
  Chip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  LocalShipping as TruckIcon,
  AcUnit as SnowflakeIcon,
  CleaningServices as CleaningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

import { Tables } from '@/src/types/database';

type Employee = Tables<'employees'>;
type Supplier = Tables<'suppliers'>;
type ActivitySector = Tables<'activity_sectors'>;

interface ColdEnclosure {
  id: string;
  name: string;
  type: string;
  location: string;
  maxTemp: number;
  minTemp: number;
}

type Step = 'login' | 'info' | 'users' | 'suppliers' | 'enclosures' | 'cleaning' | 'complete';

const steps = [
  { id: 'login', label: 'Connexion', icon: PersonIcon },
  { id: 'info', label: 'Informations', icon: BusinessIcon },
  { id: 'users', label: 'Employés', icon: PeopleIcon },
  { id: 'suppliers', label: 'Fournisseurs', icon: TruckIcon },
  { id: 'enclosures', label: 'Enceintes froides', icon: SnowflakeIcon },
  { id: 'cleaning', label: 'Plan de nettoyage', icon: CleaningIcon },
  { id: 'complete', label: 'Terminé', icon: CheckCircleIcon },
];

export default function HACCPSetupComponent() {
  const { signUp, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Login data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Company info
  const [activitySector, setActivitySector] = useState('');
  const [activitySectors, setActivitySectors] = useState<ActivitySector[]>([]);
  const [loadingActivitySectors, setLoadingActivitySectors] = useState(false);
  const [establishmentName, setEstablishmentName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Employees
  const [employees, setEmployees] = useState<(Employee & { id: string })[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // Suppliers
  const [suppliers, setSuppliers] = useState<(Supplier & { id: string })[]>([]);
  
  // Cold enclosures
  const [showExample, setShowExample] = useState(false);
  const [coldEnclosures, setColdEnclosures] = useState<ColdEnclosure[]>([]);
  
  // Cleaning tasks
  const [activeZone, setActiveZone] = useState('Cuisine');
  const [cleaningTasks, setCleaningTasks] = useState<{ 
    id: string; 
    name: string; 
    frequency: 'daily' | 'weekly' | 'monthly' | 'after_use'; 
    zone: string; 
    action_to_perform: string;
    enabled: boolean 
  }[]>([
    { id: '1', name: 'Nettoyage des sols', frequency: 'daily', zone: 'Cuisine', action_to_perform: 'Balayer et nettoyer les sols, plinthes, grilles et siphons', enabled: true },
    { id: '2', name: 'Plans de travail', frequency: 'after_use', zone: 'Cuisine', action_to_perform: 'Nettoyer et désinfecter tous les plans de travail', enabled: true },
    { id: '3', name: 'Lave-mains', frequency: 'daily', zone: 'Cuisine', action_to_perform: 'Nettoyer et désinfecter les lave-mains', enabled: true },
    { id: '4', name: 'Équipements de cuisson', frequency: 'daily', zone: 'Cuisine', action_to_perform: 'Nettoyer feux vifs, fourneaux et équipements de cuisson', enabled: true },
    { id: '5', name: 'Poubelles', frequency: 'daily', zone: 'Cuisine', action_to_perform: 'Vider et nettoyer les poubelles et supports', enabled: true },
    { id: '6', name: 'Murs et portes', frequency: 'weekly', zone: 'Cuisine', action_to_perform: 'Nettoyer les murs, portes et surfaces verticales', enabled: true },
    { id: '7', name: 'Étagères', frequency: 'weekly', zone: 'Cuisine', action_to_perform: 'Nettoyer et désinfecter toutes les étagères', enabled: true },
    { id: '8', name: 'Hottes et filtres', frequency: 'monthly', zone: 'Cuisine', action_to_perform: 'Nettoyage complet des hottes et remplacement/nettoyage des filtres', enabled: true },
    { id: '9', name: 'Sols économat', frequency: 'weekly', zone: 'Économat', action_to_perform: 'Nettoyer sols, plinthes et siphons de l\'économat', enabled: true },
    { id: '10', name: 'Étagères économat', frequency: 'weekly', zone: 'Économat', action_to_perform: 'Nettoyer étagères et clayettes de stockage', enabled: true },
    { id: '11', name: 'Groupe froid', frequency: 'monthly', zone: 'Économat', action_to_perform: 'Maintenance et nettoyage du groupe froid', enabled: true },
    { id: '12', name: 'Vestiaires', frequency: 'daily', zone: 'Vestiaires', action_to_perform: 'Nettoyer et désinfecter les vestiaires', enabled: true },
    { id: '13', name: 'Sanitaires', frequency: 'daily', zone: 'Sanitaires', action_to_perform: 'Nettoyage complet et désinfection des sanitaires', enabled: true }
  ]);

  const zones = ['Cuisine', 'Plonge', 'Préparation froide', 'Économat', 'Légumerie', 'Toilettes', 'Vestiaires', 'Autres'];

  // Load activity sectors from database
  const loadActivitySectors = useCallback(async () => {
    setLoadingActivitySectors(true);
    try {
      const { data, error } = await supabase
        .from('activity_sectors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setActivitySectors(data || []);
    } catch (error) {
      console.error('Error loading activity sectors:', error);
      setError('Erreur lors du chargement des secteurs d\'activité');
    } finally {
      setLoadingActivitySectors(false);
    }
  }, []);

  // Check if user is already logged in and skip login step
  useEffect(() => {
    if (user && currentStep === 'login') {
      setCurrentStep('info');
    }
  }, [user, currentStep]);

  // Load activity sectors when component mounts
  useEffect(() => {
    loadActivitySectors();
  }, [loadActivitySectors]);

  const passwordRequirements = useMemo(() => [
    { text: '1 majuscule', met: /[A-Z]/.test(password) },
    { text: '1 chiffre', met: /\d/.test(password) },
    { text: '1 caractère spécial', met: /[!@#$%^&*]/.test(password) },
    { text: '8 caractères minimum', met: password.length >= 8 }
  ], [password]);

  // Employee management functions
  // During setup, we manage employees in local state only
  const addLocalEmployee = () => {
    const newEmployee = {
      id: `temp_${Date.now()}`,
      first_name: '',
      last_name: '',
      role: 'employee',
      is_active: true,
      created_at: null,
      organization_id: '',
      password: `temp_password_${Date.now()}`,
      updated_at: null,
      user_id: null
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const deleteEmployee = async (id: string) => {
    // During setup, just remove from local state
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  // During setup, we don't save employees until the complete step
  const saveNewEmployees = useCallback(async () => {
    // During setup process, employees are kept in local state
    // They will be saved to database in the complete step
    console.log('Keeping employees in local state during setup');
  }, []);

  // During setup, we don't load employees from database
  useEffect(() => {
    // During setup process, employees are managed in local state only
    console.log('Setup mode: employees managed locally');
  }, [user, currentStep]);

  // Database save functions
  const saveOrganization = useCallback(async (userId: string) => {
    // Préparer les données d'insertion
    const organizationData: Record<string, string | null> = {
      name: establishmentName,
      user_id: userId,
    };
    
    // Ajouter activity_sector_id si la colonne existe et qu'un secteur est sélectionné
    if (activitySector) {
      organizationData.activity_sector_id = activitySector;
    }
    
    const { data, error } = await supabase
      .from('organizations')
      .insert(organizationData)
      .select()
      .single();

    if (error) {
      // Si l'erreur est due à la colonne manquante, continuer sans elle
      if (error.message.includes('activity_sector_id')) {
        console.warn('Colonne activity_sector_id manquante, sauvegarde sans cette information');
        const { data: retryData, error: retryError } = await supabase
          .from('organizations')
          .insert({
            name: establishmentName,
            user_id: userId,
          })
          .select()
          .single();
        
        if (retryError) throw retryError;
        return retryData;
      }
      throw error;
    }
    return data;
  }, [establishmentName, activitySector]);

  const saveEmployees = useCallback(async (organizationId: string, userId: string) => {
    // Only save employees with temporary IDs (new employees) and valid names
    const newEmployees = employees.filter(emp => 
      emp.id.startsWith('temp_') && 
      emp.first_name.trim() && 
      emp.last_name.trim()
    );
    if (newEmployees.length === 0) return [];

    const employeesToInsert = newEmployees.map(employee => ({
      organization_id: organizationId,
      first_name: employee.first_name.trim(),
      last_name: employee.last_name.trim(),
      role: employee.role || 'employee',
      user_id: userId,
      password: employee.password.startsWith('temp_password_') ? 'defaultpassword123' : employee.password,
    }));

    const { data, error } = await supabase
      .from('employees')
      .insert(employeesToInsert)
      .select();

    if (error) throw error;
    return data;
  }, [employees]);

  const saveSuppliers = useCallback(async (organizationId: string, userId: string) => {
    // Only save suppliers with temporary IDs and valid names
    const newSuppliers = suppliers.filter(supplier => 
      supplier.id.startsWith('temp_') && 
      supplier.name.trim()
    );
    if (newSuppliers.length === 0) return [];

    const suppliersToInsert = newSuppliers.map(supplier => ({
      organization_id: organizationId,
      name: supplier.name.trim(),
      address: supplier.address?.trim() || null,
      phone: supplier.phone?.trim() || null,
      email: supplier.email?.trim() || null,
      contact_person: supplier.contact_person?.trim() || null,
      user_id: userId,
      employee_id: null,
    }));

    const { data, error } = await supabase
      .from('suppliers')
      .insert(suppliersToInsert)
      .select();

    if (error) throw error;
    return data;
  }, [suppliers]);

  const saveColdStorageUnits = useCallback(async (organizationId: string, userId: string) => {
    // Only save enclosures with temporary IDs and valid names
    const newEnclosures = coldEnclosures.filter(enclosure => 
      enclosure.id.startsWith('temp_') && 
      enclosure.name.trim()
    );
    if (newEnclosures.length === 0) return [];

    const unitsToInsert = newEnclosures.map(enclosure => ({
      organization_id: organizationId,
      name: enclosure.name.trim(),
      type: enclosure.type,
      location: enclosure.location.trim(),
      min_temperature: enclosure.minTemp,
      max_temperature: enclosure.maxTemp,
      is_active: true,
      user_id: userId,
      employee_id: null,
    }));

    const { data, error } = await supabase
      .from('cold_storage_units')
      .insert(unitsToInsert)
      .select();

    if (error) throw error;
    return data;
  }, [coldEnclosures]);

  const saveCleaningData = useCallback(async (organizationId: string, userId: string) => {
    const activeZones = [...new Set(cleaningTasks.filter(task => task.enabled).map(task => task.zone))];
    
    // Save cleaning zones first
    const zonesToInsert = activeZones.map(zoneName => ({
      organization_id: organizationId,
      name: zoneName,
      user_id: userId,
      employee_id: null,
    }));

    const { data: zonesData, error: zonesError } = await supabase
      .from('cleaning_zones')
      .insert(zonesToInsert)
      .select();

    if (zonesError) throw zonesError;

    // Create a mapping of zone names to IDs
    const zoneMap = zonesData.reduce((acc, zone) => {
      acc[zone.name] = zone.id;
      return acc;
    }, {} as Record<string, string>);

    // Save cleaning tasks with complete structure
    const enabledTasks = cleaningTasks.filter(task => task.enabled);
    const tasksToInsert = enabledTasks.map(task => ({
      organization_id: organizationId,
      cleaning_zone_id: zoneMap[task.zone],
      name: task.name,
      frequency: task.frequency,
      frequency_days: null,
      action_to_perform: task.action_to_perform,
      cleaning_sub_zone_id: null,
      cleaning_product_id: null,
      cleaning_equipment_id: null,
      cleaning_method_id: null,
      responsible_role: null,
      is_active: true,
      user_id: userId,
      employee_id: null,
    }));

    const { data: tasksData, error: tasksError } = await supabase
      .from('cleaning_tasks')
      .insert(tasksToInsert)
      .select();

    if (tasksError) throw tasksError;

    return { zones: zonesData, tasks: tasksData };
  }, [cleaningTasks]);

  const handleNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const stepOrder: Step[] = ['login', 'info', 'users', 'suppliers', 'enclosures', 'cleaning', 'complete'];
      const currentIndex = stepOrder.indexOf(currentStep);

      // Handle login step - create account (only if not already logged in)
      if (currentStep === 'login') {
        if (user) {
          // User is already logged in, skip to next step
          setSuccess('Utilisateur déjà connecté !');
        } else {
          // User needs to create an account
          if (!email || !password) {
            throw new Error('Veuillez remplir tous les champs');
          }
          
          if (!passwordRequirements.every(req => req.met)) {
            throw new Error('Le mot de passe ne respecte pas tous les critères');
          }

          const result = await signUp(email, password);
          if (result.error) throw new Error(result.error.message || 'Erreur lors de la création du compte');
          
          setSuccess('Compte créé avec succès !');
        }
      }

      // Handle complete step - save all data
      if (currentStep === 'complete') {
        setSaving(true);
        
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error('Utilisateur non connecté');

        // Update user profile with name
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: currentUser.id,
            email: currentUser.email!,
            first_name: firstName,
            last_name: lastName,
          });

        if (profileError) throw profileError;

        // Save organization
        const organization = await saveOrganization(currentUser.id);
        
        // Save all related data
        await Promise.all([
          saveEmployees(organization.id, currentUser.id),
          saveSuppliers(organization.id, currentUser.id),
          saveColdStorageUnits(organization.id, currentUser.id),
          saveCleaningData(organization.id, currentUser.id),
        ]);

        // Update user with organization_id
        await supabase
          .from('users')
          .update({ organization_id: organization.id })
          .eq('id', currentUser.id);

        setSuccess('Configuration sauvegardée avec succès !');
        setSaving(false);
        
        // Redirect to main app after a delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        
        setLoading(false);
        return;
      }

      // Save employees when leaving the users step
      if (currentStep === 'users') {
        await saveNewEmployees();
      }

      // Move to next step
      if (currentIndex < stepOrder.length - 1) {
        setCurrentStep(stepOrder[currentIndex + 1]);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      setSaving(false);
    } finally {
      setLoading(false);
    }
  }, [currentStep, email, password, passwordRequirements, signUp, firstName, lastName, saveOrganization, saveEmployees, saveSuppliers, saveColdStorageUnits, saveCleaningData, saveNewEmployees, user]);

  const handlePrevious = useCallback(() => {
    const stepOrder: Step[] = ['login', 'info', 'users', 'suppliers', 'enclosures', 'cleaning', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep]);


  const addSupplier = () => {
    const newSupplier = {
      id: `temp_${Date.now()}`,
      name: '',
      address: null,
      contact_person: null,
      created_at: null,
      email: null,
      employee_id: null,
      organization_id: null,
      phone: null,
      updated_at: null,
      user_id: null
    };
    setSuppliers([...suppliers, newSupplier]);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
  };

  const addColdEnclosure = () => {
    const newEnclosure: ColdEnclosure = {
      id: `temp_${Date.now()}`,
      name: '',
      type: 'Réfrigérateur',
      location: 'Cuisine',
      maxTemp: 4,
      minTemp: 0
    };
    setColdEnclosures([...coldEnclosures, newEnclosure]);
  };

  const deleteColdEnclosure = (id: string) => {
    setColdEnclosures(prev => prev.filter(enclosure => enclosure.id !== id));
  };

  const storageTypes = [
    { value: 'Réfrigérateur', label: 'Réfrigérateur', minTemp: 0, maxTemp: 4 },
    { value: 'Congélateur', label: 'Congélateur', minTemp: -25, maxTemp: -18 },
    { value: 'Chambre froide positive', label: 'Chambre froide positive', minTemp: 0, maxTemp: 8 },
    { value: 'Chambre froide négative', label: 'Chambre froide négative', minTemp: -25, maxTemp: -15 },
    { value: 'Vitrine réfrigérée', label: 'Vitrine réfrigérée', minTemp: 2, maxTemp: 6 },
    { value: 'Cellule de refroidissement', label: 'Cellule de refroidissement', minTemp: -1, maxTemp: 3 },
  ];

  const updateEnclosure = (id: string, field: keyof ColdEnclosure, value: string | number) => {
    setColdEnclosures(prev => prev.map(enc => {
      if (enc.id === id) {
        const updated = { ...enc, [field]: value };
        
        // Auto-update temperatures when type changes
        if (field === 'type' && typeof value === 'string') {
          const selectedType = storageTypes.find(type => type.value === value);
          if (selectedType) {
            updated.minTemp = selectedType.minTemp;
            updated.maxTemp = selectedType.maxTemp;
          }
        }
        
        return updated;
      }
      return enc;
    }));
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getFilteredTasks = () => {
    return cleaningTasks.filter(task => task.zone === activeZone);
  };

  const toggleTask = (taskId: string) => {
    setCleaningTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, enabled: !task.enabled } : task
    ));
  };

  const toggleAllTasks = () => {
    const filteredTasks = getFilteredTasks();
    const allEnabled = filteredTasks.every(task => task.enabled);
    
    setCleaningTasks(prev => prev.map(task =>
      task.zone === activeZone ? { ...task, enabled: !allEnabled } : task
    ));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'login':
        return (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main', 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '2rem'
                }}>
                  🏃‍♀️
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Testez rapidement
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Testez gratuitement l&apos;application HACCP, en créant votre compte en quelques minutes. 
                  Pas de carte bancaire requise pour tester l&apos;application.
                </Alert>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: email ? (
                        <InputAdornment position="end">
                          <CheckCircleIcon color="success" />
                        </InputAdornment>
                      ) : undefined,
                    }
                  }}
                />
                <Box>
                  <TextField
                    fullWidth
                    label="Mot de passe"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                            {password && passwordRequirements.every(req => req.met) && (
                              <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                            )}
                          </InputAdornment>
                        ),
                      }
                    }}
                  />
                  <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                    {passwordRequirements.map((req, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon 
                          fontSize="small" 
                          color={req.met ? 'success' : 'disabled'} 
                        />
                        <Typography 
                          variant="caption" 
                          color={req.met ? 'success.main' : 'text.secondary'}
                        >
                          {req.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 'info':
        return (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main', 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '2rem'
                }}>
                  👋
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Parlez-nous un peu de vous
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Secteur d&apos;activité</InputLabel>
                  <Select
                    value={activitySector}
                    onChange={(e) => setActivitySector(e.target.value)}
                    label="Secteur d'activité"
                    disabled={loadingActivitySectors}
                  >
                    <MenuItem value="">
                      <em>{loadingActivitySectors ? 'Chargement...' : 'Sélectionnez un secteur'}</em>
                    </MenuItem>
                    <MenuItem value="restaurant">Restaurant</MenuItem>
                    <MenuItem value="boulangerie-patisserie">Boulangerie / pâtisserie</MenuItem>
                    <MenuItem value="boucherie-charcuterie">Boucherie / charcuterie</MenuItem>
                    <MenuItem value="restauration-collective">Restauration collective</MenuItem>
                    <MenuItem value="creches">Crèches</MenuItem>
                    <MenuItem value="franchises-reseaux">Franchises et réseaux</MenuItem>
                    {activitySectors.map((sector) => (
                      <MenuItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Nom de l&apos;établissement"
                  value={establishmentName}
                  onChange={(e) => setEstablishmentName(e.target.value)}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Numéro de téléphone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </Box>
            </CardContent>
          </Card>
        );

      case 'users':
        return (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <PeopleIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Employés
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Veuillez indiquer le nom ou le poste des personnes qui effectueront des relevés HACCP, 
                  y compris vous-même si vous réalisez des relevés.
                </Typography>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Vos équipes changent souvent ? Aucun problème, vous pourrez modifier, ajouter ou 
                  supprimer des utilisateurs par la suite dans vos paramètres.
                </Alert>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {loadingEmployees ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography>Chargement des employés...</Typography>
                  </Box>
                ) : employees.length === 0 ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={addLocalEmployee}
                    startIcon={<AddIcon />}
                    sx={{ py: 3, borderStyle: 'dashed' }}
                  >
                    Ajouter votre premier employé
                  </Button>
                ) : (
                  <>
                    {employees.map((employee, index) => (
                      <Card key={employee.id} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                          <TextField
                            fullWidth
                            label="Prénom"
                            value={employee.first_name}
                            onChange={(e) => {
                              const newEmployees = [...employees];
                              newEmployees[index] = { ...employee, first_name: e.target.value };
                              setEmployees(newEmployees);
                            }}
                            placeholder="Prénom"
                            variant="outlined"
                            size="small"
                          />
                          <TextField
                            fullWidth
                            label="Nom"
                            value={employee.last_name}
                            onChange={(e) => {
                              const newEmployees = [...employees];
                              newEmployees[index] = { ...employee, last_name: e.target.value };
                              setEmployees(newEmployees);
                            }}
                            placeholder="Nom"
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <TextField
                            fullWidth
                            label="Rôle"
                            value={employee.role}
                            onChange={(e) => {
                              const newEmployees = [...employees];
                              newEmployees[index] = { ...employee, role: e.target.value };
                              setEmployees(newEmployees);
                            }}
                            placeholder="Ex: Chef de cuisine, Serveur..."
                            variant="outlined"
                            size="small"
                          />
                          <IconButton
                            color="error"
                            onClick={() => deleteEmployee(employee.id)}
                          >
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      </Card>
                    ))}
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={addLocalEmployee}
                      startIcon={<AddIcon />}
                      sx={{ py: 2, borderStyle: 'dashed' }}
                    >
                      Ajouter un employé
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        );

      case 'suppliers':
        return (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <TruckIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Fournisseurs
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Veuillez ajouter le nom de vos fournisseurs chez qui vous effectuez des contrôles de produits.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {suppliers.length === 0 ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={addSupplier}
                    startIcon={<AddIcon />}
                    sx={{ py: 3, borderStyle: 'dashed' }}
                  >
                    Ajouter votre premier fournisseur
                  </Button>
                ) : (
                  <>
                    {suppliers.map((supplier, index) => (
                      <Card key={supplier.id} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                              fullWidth
                              label="Nom du fournisseur"
                              value={supplier.name}
                              onChange={(e) => {
                                const newSuppliers = [...suppliers];
                                newSuppliers[index] = { ...supplier, name: e.target.value };
                                setSuppliers(newSuppliers);
                              }}
                              placeholder="Ex : Pomona, Transgourmet, Metro..."
                              variant="outlined"
                              size="small"
                            />
                            <IconButton
                              color="error"
                              onClick={() => deleteSupplier(supplier.id)}
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                            <TextField
                              label="Personne de contact"
                              value={supplier.contact_person || ''}
                              onChange={(e) => {
                                const newSuppliers = [...suppliers];
                                newSuppliers[index] = { ...supplier, contact_person: e.target.value || null };
                                setSuppliers(newSuppliers);
                              }}
                              variant="outlined"
                              size="small"
                            />
                            <TextField
                              label="Téléphone"
                              value={supplier.phone || ''}
                              onChange={(e) => {
                                const newSuppliers = [...suppliers];
                                newSuppliers[index] = { ...supplier, phone: e.target.value || null };
                                setSuppliers(newSuppliers);
                              }}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                          <TextField
                            label="Email"
                            type="email"
                            value={supplier.email || ''}
                            onChange={(e) => {
                              const newSuppliers = [...suppliers];
                              newSuppliers[index] = { ...supplier, email: e.target.value || null };
                              setSuppliers(newSuppliers);
                            }}
                            variant="outlined"
                            size="small"
                          />
                          <TextField
                            label="Adresse"
                            value={supplier.address || ''}
                            onChange={(e) => {
                              const newSuppliers = [...suppliers];
                              newSuppliers[index] = { ...supplier, address: e.target.value || null };
                              setSuppliers(newSuppliers);
                            }}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                          />
                        </Box>
                      </Card>
                    ))}
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={addSupplier}
                      startIcon={<AddIcon />}
                      sx={{ py: 2, borderStyle: 'dashed' }}
                    >
                      Ajouter un fournisseur
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        );

      case 'enclosures':
        return (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: '#00bcd4', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <SnowflakeIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Enceintes froides
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Configurez vos unités de stockage pour la surveillance des températures HACCP
                </Typography>
                <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                  Créez vos enceintes dans l&apos;ordre de vos relevés quotidiens. 
                  Vous pourrez ensuite surveiller les températures en temps réel.
                </Alert>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {coldEnclosures.length === 0 ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={addColdEnclosure}
                    startIcon={<AddIcon />}
                    sx={{ py: 3, borderStyle: 'dashed' }}
                  >
                    Ajouter votre première enceinte froide
                  </Button>
                ) : (
                  <>
                    {coldEnclosures.map((enclosure) => (
                      <Card key={enclosure.id} variant="outlined" sx={{ 
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: 3 }
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Avatar sx={{ bgcolor: '#00bcd420', color: '#00bcd4' }}>
                              <SnowflakeIcon />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <TextField
                                fullWidth
                                label="Nom de l&apos;enceinte"
                                value={enclosure.name}
                                onChange={(e) => updateEnclosure(enclosure.id, 'name', e.target.value)}
                                placeholder="Ex : Frigo principal, Congélateur..."
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            <IconButton
                              color="error"
                              onClick={() => deleteColdEnclosure(enclosure.id)}
                              size="small"
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Box>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Type d&apos;enceinte</InputLabel>
                              <Select
                                value={enclosure.type}
                                onChange={(e) => updateEnclosure(enclosure.id, 'type', e.target.value)}
                                label="Type d'enceinte"
                              >
                                {storageTypes.map((type) => (
                                  <MenuItem key={type.value} value={type.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <SnowflakeIcon sx={{ fontSize: 16, color: '#00bcd4' }} />
                                      {type.label}
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <TextField
                              label="Localisation"
                              value={enclosure.location}
                              onChange={(e) => updateEnclosure(enclosure.id, 'location', e.target.value)}
                              placeholder="Ex : Cuisine, Réserve..."
                              size="small"
                            />
                          </Box>
                          
                          <Alert 
                            severity="success" 
                            sx={{ 
                              mb: 2,
                              bgcolor: '#00bcd408',
                              borderColor: '#00bcd4',
                              '& .MuiAlert-icon': { color: '#00bcd4' }
                            }}
                          >
                            <Typography variant="body2">
                              <strong>Températures configurées :</strong> {enclosure.minTemp}°C à {enclosure.maxTemp}°C
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                Conforme aux normes {storageTypes.find(t => t.value === enclosure.type)?.label}
                              </Typography>
                            </Typography>
                          </Alert>
                          
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                            Vous pourrez ajuster les seuils de température précis après la configuration initiale
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={addColdEnclosure}
                      startIcon={<AddIcon />}
                      sx={{ py: 2, borderStyle: 'dashed' }}
                    >
                      Ajouter une enceinte froide
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        );

      case 'cleaning':
        return (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar sx={{ 
                  width: 64, 
                  height: 64, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <CleaningIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Plan de nettoyage
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Configuration des tâches de nettoyage et d&apos;hygiène HACCP
                </Typography>
                <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                  Sélectionnez les tâches appropriées à votre établissement. 
                  Vous pourrez personnaliser chaque tâche après la configuration initiale.
                </Alert>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {zones.map((zone) => (
                    <Chip
                      key={zone}
                      label={zone}
                      onClick={() => setActiveZone(zone)}
                      color={activeZone === zone ? 'primary' : 'default'}
                      variant={activeZone === zone ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={getFilteredTasks().every(task => task.enabled)}
                    onChange={toggleAllTasks}
                  />
                }
                label="Sélectionner toutes les tâches"
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {getFilteredTasks().map((task) => (
                  <Card 
                    key={task.id} 
                    variant="outlined" 
                    sx={{ 
                      borderColor: task.enabled ? '#667eea' : 'divider',
                      backgroundColor: task.enabled ? 'rgba(102, 126, 234, 0.05)' : 'background.paper',
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: task.enabled ? 3 : 1
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Avatar sx={{ 
                          bgcolor: task.enabled ? '#667eea20' : 'grey.100',
                          color: task.enabled ? '#667eea' : 'grey.500',
                          width: 32,
                          height: 32,
                          mt: 0.5
                        }}>
                          <CleaningIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                            {task.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {task.action_to_perform}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={`Fréquence: ${
                                task.frequency === 'daily' ? 'Quotidienne' :
                                task.frequency === 'weekly' ? 'Hebdomadaire' :
                                task.frequency === 'monthly' ? 'Mensuelle' :
                                task.frequency === 'after_use' ? 'Après usage' :
                                task.frequency
                              }`}
                              size="small"
                              color={task.enabled ? 'primary' : 'default'}
                              variant={task.enabled ? 'filled' : 'outlined'}
                            />
                          </Box>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={task.enabled}
                              onChange={() => toggleTask(task.id)}
                              sx={{
                                '& .MuiSwitch-track': {
                                  backgroundColor: task.enabled ? '#667eea' : undefined
                                }
                              }}
                            />
                          }
                          label=""
                          sx={{ m: 0 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2, py: 2, borderStyle: 'dashed' }}
              >
                Ajouter une tâche
              </Button>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Avatar sx={{ 
                width: 96, 
                height: 96, 
                bgcolor: 'success.main', 
                mx: 'auto', 
                mb: 3,
                fontSize: '3rem'
              }}>
                💝
              </Avatar>
              <Typography variant="h3" component="h1" gutterBottom fontWeight={700} color="success.main">
                C&apos;est parfait !
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Vous avez terminé vos paramétrages
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Cliquez sur &quot;Terminer&quot; pour sauvegarder votre configuration et commencer à utiliser l&apos;application !
              </Typography>
              
              {saving && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" color="primary">
                    Sauvegarde en cours...
                  </Typography>
                  <LinearProgress sx={{ mt: 1 }} />
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Configuration à sauvegarder :
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={`${employees.length} employé(s)`} size="small" />
                  <Chip label={`${suppliers.length} fournisseur(s)`} size="small" />
                  <Chip label={`${coldEnclosures.length} enceinte(s) froide(s)`} size="small" />
                  <Chip label={`${cleaningTasks.filter(t => t.enabled).length} tâche(s) de nettoyage`} size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" fontWeight={800} gutterBottom>
          Configuration HACCP
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Configuration initiale de votre système HACCP
        </Typography>
      </Paper>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={getCurrentStepIndex()} alternativeLabel>
          {steps.map((step) => (
            <Step key={step.id}>
              <StepLabel
                slots={{
                  stepIcon: ({ active, completed }) => (
                    <Avatar
                      sx={{
                        bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                        color: 'white',
                        width: 40,
                        height: 40,
                      }}
                    >
                      <step.icon />
                    </Avatar>
                  )
                }}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        <LinearProgress 
          variant="determinate" 
          value={(getCurrentStepIndex() + 1) / steps.length * 100} 
          sx={{ mt: 2 }}
        />
      </Paper>

      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>
        {renderStepContent()}
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handlePrevious}
          disabled={currentStep === 'login' || loading}
          sx={{ minWidth: 120 }}
        >
          Précédent
        </Button>
        
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={handleNext}
          disabled={loading || saving}
          sx={{ minWidth: 120 }}
        >
          {saving ? 'Sauvegarde...' : loading ? 'Chargement...' : currentStep === 'complete' ? 'Terminer' : 'Suivant'}
        </Button>
      </Box>
    </Container>
  );
}