'use client';

import React, { useState, useCallback } from 'react';
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
  Grid2 as Grid,
  Alert,
  IconButton,
  InputAdornment,
  Chip,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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

interface User {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ColdEnclosure {
  id: string;
  name: string;
  temperatureType: 'positive' | 'negative';
  maxTemp: number;
  minTemp: number;
}

interface CleaningTask {
  id: string;
  name: string;
  frequency: string;
  zone: string;
  enabled: boolean;
}

type Step = 'login' | 'info' | 'users' | 'suppliers' | 'enclosures' | 'cleaning' | 'complete';

const steps = [
  { id: 'login', label: 'Connexion', icon: PersonIcon },
  { id: 'info', label: 'Informations', icon: BusinessIcon },
  { id: 'users', label: 'Utilisateurs', icon: PeopleIcon },
  { id: 'suppliers', label: 'Fournisseurs', icon: TruckIcon },
  { id: 'enclosures', label: 'Enceintes froides', icon: SnowflakeIcon },
  { id: 'cleaning', label: 'Plan de nettoyage', icon: CleaningIcon },
  { id: 'complete', label: 'Terminé', icon: CheckCircleIcon },
];

export default function HACCPSetupComponent() {
  const [currentStep, setCurrentStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  
  // Login data
  const [email, setEmail] = useState('decin10022@mardiek.com');
  const [password, setPassword] = useState('123456789gR@');
  const [showPassword, setShowPassword] = useState(false);
  
  // Company info
  const [activitySector, setActivitySector] = useState('Restauration collective');
  const [establishmentName, setEstablishmentName] = useState('sdfd');
  const [firstName, setFirstName] = useState('sdfs');
  const [lastName, setLastName] = useState('lkmlm');
  const [phoneNumber, setPhoneNumber] = useState('534354646344');
  
  // Users
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'sdfs' },
    { id: '2', name: 'remi' },
    { id: '3', name: 'julien' }
  ]);
  
  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Cold enclosures
  const [showExample, setShowExample] = useState(false);
  const [coldEnclosures, setColdEnclosures] = useState<ColdEnclosure[]>([
    { id: '1', name: 'Enceinte froide', temperatureType: 'positive', maxTemp: 5, minTemp: 0 },
    { id: '2', name: 'Congélateur', temperatureType: 'negative', maxTemp: -15, minTemp: -24 }
  ]);
  
  // Cleaning tasks
  const [activeZone, setActiveZone] = useState('Cuisine');
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([
    { id: '1', name: 'Sol, plinthes, grilles et siphons', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '2', name: 'Sol, plinthes, grilles et siphons', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '3', name: 'Murs et portes', frequency: 'Mois', zone: 'Cuisine', enabled: true },
    { id: '4', name: 'Plans de travail', frequency: 'Après usage', zone: 'Cuisine', enabled: true },
    { id: '5', name: 'Chariots de transports plateaux', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '6', name: 'Lave-main', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '7', name: 'Poubelles et supports poubelles', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '8', name: 'Étagères', frequency: 'Mois', zone: 'Cuisine', enabled: true },
    { id: '9', name: 'Feux vifs et fourneaux', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '10', name: 'Hottes et filtres de hottes', frequency: 'Mois', zone: 'Cuisine', enabled: true },
    { id: '11', name: 'Sol, plinthes, grilles et siphons', frequency: 'Semaine', zone: 'Économat', enabled: true },
    { id: '12', name: 'Murs et portes', frequency: 'Mois', zone: 'Économat', enabled: true },
    { id: '13', name: 'Poignées de portes et interrupteurs', frequency: 'Semaine', zone: 'Économat', enabled: true },
    { id: '14', name: 'Étagères et clayettes', frequency: 'Semaine', zone: 'Économat', enabled: true },
    { id: '15', name: 'Groupe Froid', frequency: 'Mois', zone: 'Économat', enabled: true }
  ]);

  const zones = ['Cuisine', 'Plonge', 'Préparation froide', 'Économat', 'Légumerie', 'Toilettes', 'Vestiaires', 'Autres'];

  const passwordRequirements = [
    { text: '1 majuscule', met: /[A-Z]/.test(password) },
    { text: '1 chiffre', met: /\d/.test(password) },
    { text: '1 caractère spécial', met: /[!@#$%^&*]/.test(password) },
    { text: '8 caractères minimum', met: password.length >= 8 }
  ];

  const handleNext = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stepOrder: Step[] = ['login', 'info', 'users', 'suppliers', 'enclosures', 'cleaning', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
    setLoading(false);
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    const stepOrder: Step[] = ['login', 'info', 'users', 'suppliers', 'enclosures', 'cleaning', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep]);

  const addUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: ''
    };
    setUsers([...users, newUser]);
  };

  const addSupplier = () => {
    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: ''
    };
    setSuppliers([...suppliers, newSupplier]);
  };

  const addColdEnclosure = () => {
    const newEnclosure: ColdEnclosure = {
      id: Date.now().toString(),
      name: '',
      temperatureType: 'positive',
      maxTemp: 5,
      minTemp: 0
    };
    setColdEnclosures([...coldEnclosures, newEnclosure]);
  };

  const updateEnclosure = (id: string, field: keyof ColdEnclosure, value: string | number) => {
    setColdEnclosures(prev => prev.map(enc => 
      enc.id === id ? { ...enc, [field]: value } : enc
    ));
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

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CheckCircleIcon color="success" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mot de passe"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                          <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={1}>
                      {passwordRequirements.map((req, index) => (
                        <Grid item xs={6} key={index}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
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

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Secteur d&apos;activité</InputLabel>
                    <Select
                      value={activitySector}
                      onChange={(e) => setActivitySector(e.target.value)}
                      label="Secteur d'activité"
                    >
                      <MenuItem value="Restauration collective">Restauration collective</MenuItem>
                      <MenuItem value="Restaurant">Restaurant</MenuItem>
                      <MenuItem value="Boulangerie">Boulangerie</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nom de l&apos;établissement"
                    value={establishmentName}
                    onChange={(e) => setEstablishmentName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Numéro de téléphone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </Grid>
              </Grid>
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
                  Utilisateurs
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Veuillez indiquer le nom ou le poste des personnes qui effectueront des relevés HACCP, 
                  y compris vous-même si vous réalisez des relevés.
                </Typography>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Vos équipes changent souvent ? Aucun problème, vous pourrez modifier, ajouter ou 
                  supprimer des utilisateurs par la suite dans vos paramètres.
                </Alert>
              </Box>

              <Grid container spacing={2}>
                {users.map((user, index) => (
                  <Grid item xs={12} key={user.id}>
                    <TextField
                      fullWidth
                      value={user.name}
                      onChange={(e) => {
                        const newUsers = [...users];
                        newUsers[index] = { ...user, name: e.target.value };
                        setUsers(newUsers);
                      }}
                      placeholder="Nom de l&apos;utilisateur"
                      variant="outlined"
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={addUser}
                    startIcon={<AddIcon />}
                    sx={{ py: 2, borderStyle: 'dashed' }}
                  >
                    Ajouter un utilisateur
                  </Button>
                </Grid>
              </Grid>
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

              <Grid container spacing={2}>
                {suppliers.map((supplier, index) => (
                  <Grid item xs={12} key={supplier.id}>
                    <TextField
                      fullWidth
                      value={supplier.name}
                      onChange={(e) => {
                        const newSuppliers = [...suppliers];
                        newSuppliers[index] = { ...supplier, name: e.target.value };
                        setSuppliers(newSuppliers);
                      }}
                      placeholder="Ex : Pomona, Transgourmet, Metro..."
                      variant="outlined"
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={addSupplier}
                    startIcon={<AddIcon />}
                    sx={{ py: 2, borderStyle: 'dashed' }}
                  >
                    Ajouter un fournisseur
                  </Button>
                </Grid>
              </Grid>
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
                  bgcolor: 'primary.main', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <SnowflakeIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Enceintes froides
                </Typography>
                <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                  Nous vous recommandons de créer vos enceintes froides en respectant l&apos;ordre 
                  dans lequel vous effectuez vos relevés de température.
                </Alert>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showExample}
                      onChange={(e) => setShowExample(e.target.checked)}
                    />
                  }
                  label="💡 Affichez-moi un exemple"
                />
              </Box>

              <Grid container spacing={3}>
                {coldEnclosures.map((enclosure) => (
                  <Grid item xs={12} key={enclosure.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Nom de l&apos;enceinte"
                              value={enclosure.name}
                              onChange={(e) => updateEnclosure(enclosure.id, 'name', e.target.value)}
                              placeholder="Ex : Enceinte, congélateur..."
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <FormControl component="fieldset">
                              <Typography variant="subtitle2" gutterBottom>
                                Sélectionner la température de l&apos;enceinte
                              </Typography>
                              <RadioGroup
                                row
                                value={enclosure.temperatureType}
                                onChange={(e) => updateEnclosure(enclosure.id, 'temperatureType', e.target.value)}
                              >
                                <FormControlLabel
                                  value="positive"
                                  control={<Radio />}
                                  label="Température positive"
                                />
                                <FormControlLabel
                                  value="negative"
                                  control={<Radio />}
                                  label="Température négative"
                                />
                              </RadioGroup>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" display="block" gutterBottom>
                                T° max
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => updateEnclosure(enclosure.id, 'maxTemp', enclosure.maxTemp - 1)}
                                >
                                  <RemoveIcon />
                                </IconButton>
                                <Chip label={`${enclosure.maxTemp} °C`} />
                                <IconButton
                                  size="small"
                                  onClick={() => updateEnclosure(enclosure.id, 'maxTemp', enclosure.maxTemp + 1)}
                                >
                                  <AddIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" display="block" gutterBottom>
                                T° min
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => updateEnclosure(enclosure.id, 'minTemp', enclosure.minTemp - 1)}
                                >
                                  <RemoveIcon />
                                </IconButton>
                                <Chip label={`${enclosure.minTemp} °C`} />
                                <IconButton
                                  size="small"
                                  onClick={() => updateEnclosure(enclosure.id, 'minTemp', enclosure.minTemp + 1)}
                                >
                                  <AddIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={addColdEnclosure}
                    startIcon={<AddIcon />}
                    sx={{ py: 2, borderStyle: 'dashed' }}
                  >
                    Ajouter une enceinte froide
                  </Button>
                </Grid>
              </Grid>
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
                  bgcolor: 'primary.main', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <CleaningIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Plan de nettoyage
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Nous vous proposons une liste de tâches avec leur fréquence. 
                  Nous vous invitons à choisir les tâches dans chaque zone et à modifier la fréquence proposée si besoin.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Grid container spacing={1}>
                  {zones.map((zone) => (
                    <Grid item key={zone}>
                      <Chip
                        label={zone}
                        onClick={() => setActiveZone(zone)}
                        color={activeZone === zone ? 'primary' : 'default'}
                        variant={activeZone === zone ? 'filled' : 'outlined'}
                      />
                    </Grid>
                  ))}
                </Grid>
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

              <List>
                {getFilteredTasks().map((task) => (
                  <ListItem
                    key={task.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      <Switch
                        checked={task.enabled}
                        onChange={() => toggleTask(task.id)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.name}
                      secondary={task.frequency}
                    />
                  </ListItem>
                ))}
              </List>

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
              <Typography variant="h6" color="text.secondary" paragraph>
                Vous avez terminé vos paramétrages
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                En avant pour utiliser l&apos;application !
              </Typography>
              <Button
                variant="contained"
                size="large"
                color="success"
                sx={{ mt: 2, py: 2, px: 4 }}
              >
                Continuer
              </Button>
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
                StepIconComponent={({ active, completed }) => (
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
                )}
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
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Chargement...' : currentStep === 'complete' ? 'Terminer' : 'Suivant'}
        </Button>
      </Box>
    </Container>
  );
}