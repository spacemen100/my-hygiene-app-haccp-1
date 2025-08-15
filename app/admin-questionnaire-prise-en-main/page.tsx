"use client";

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Container,
  Alert,
  IconButton,
  InputAdornment,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  LocalShipping as TruckIcon,
  AcUnit as SnowflakeIcon,
  CleaningServices as CleaningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIconGreen,
} from '@mui/icons-material';

// Import existing components
import AdminEmployesPage from '@/app/admin-employes/page';
import AdminFournisseursPage from '@/app/admin-fournisseurs/page';
import ColdStoragePage from '@/app/enceintes-froides/page';
import AdminPlanNettoyagePage from '@/app/admin-plan-nettoyage/page';

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
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Info form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [establishmentName, setEstablishmentName] = useState('');
  const [activitySector, setActivitySector] = useState('');

  // Password validation
  const passwordRequirements = React.useMemo(() => [
    { text: 'Une lettre minuscule', met: /[a-z]/.test(password) },
    { text: 'Une lettre majuscule', met: /[A-Z]/.test(password) },
    { text: 'Un chiffre', met: /[0-9]/.test(password) },
    { text: '8 caractères minimum', met: password.length >= 8 }
  ], [password]);


  const handleNext = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (currentStep === 'login') {
        if (!email || !password) {
          setError('Veuillez remplir tous les champs');
          return;
        }
        if (!passwordRequirements.every(req => req.met)) {
          setError('Le mot de passe ne respecte pas les critères requis');
          return;
        }
        
        await signUp(email, password);
        setCurrentStep('info');
      } else if (currentStep === 'info') {
        if (!firstName || !lastName || !establishmentName || !activitySector) {
          setError('Veuillez remplir tous les champs');
          return;
        }
        setCurrentStep('users');
      } else {
        // For other steps, just navigate
        const stepOrder: Step[] = ['login', 'info', 'users', 'suppliers', 'enclosures', 'cleaning', 'complete'];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex < stepOrder.length - 1) {
          setCurrentStep(stepOrder[currentIndex + 1]);
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [currentStep, email, password, passwordRequirements, signUp, firstName, lastName, establishmentName, activitySector]);

  const handlePrevious = useCallback(() => {
    const stepOrder: Step[] = ['login', 'info', 'users', 'suppliers', 'enclosures', 'cleaning', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep]);

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
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
                  mb: 2 
                }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Créer votre compte
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Commencez votre mise en conformité HACCP
                </Typography>
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
                          <CheckCircleIconGreen color="success" />
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
                              <CheckCircleIconGreen color="success" sx={{ ml: 1 }} />
                            )}
                          </InputAdornment>
                        ),
                      }
                    }}
                  />
                  <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                    {passwordRequirements.map((req, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIconGreen 
                          sx={{ 
                            fontSize: 16, 
                            color: req.met ? 'success.main' : 'grey.300' 
                          }} 
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
                  bgcolor: 'secondary.main', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <BusinessIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Informations sur l&apos;établissement
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Configurez les informations de votre établissement
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <TextField
                    label="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <TextField
                    label="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Nom de l'établissement"
                  value={establishmentName}
                  onChange={(e) => setEstablishmentName(e.target.value)}
                />
                <FormControl fullWidth>
                  <InputLabel>Secteur d&apos;activité</InputLabel>
                  <Select
                    value={activitySector}
                    onChange={(e) => setActivitySector(e.target.value)}
                    label="Secteur d'activité"
                  >
                    <MenuItem value="">
                      <em>Sélectionnez un secteur</em>
                    </MenuItem>
                    <MenuItem value="restaurant">Restaurant</MenuItem>
                    <MenuItem value="boulangerie-patisserie">Boulangerie / pâtisserie</MenuItem>
                    <MenuItem value="boucherie-charcuterie">Boucherie / charcuterie</MenuItem>
                    <MenuItem value="restauration-collective">Restauration collective</MenuItem>
                    <MenuItem value="creches">Crèches</MenuItem>
                    <MenuItem value="franchises-reseaux">Franchises et réseaux</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        );

      case 'users':
        return (
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ 
                textAlign: 'center', 
                mb: 3,
                p: 3,
                bgcolor: 'primary.50',
                borderRadius: 2
              }}>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  bgcolor: 'primary.main', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Configuration des employés
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gérez votre équipe dans cette section
                </Typography>
              </Box>
              <AdminEmployesPage />
            </CardContent>
          </Card>
        );

      case 'suppliers':
        return (
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ 
                textAlign: 'center', 
                mb: 3,
                p: 3,
                bgcolor: 'success.50',
                borderRadius: 2
              }}>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  bgcolor: 'success.main', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <TruckIcon />
                </Avatar>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Configuration des fournisseurs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gérez vos fournisseurs dans cette section
                </Typography>
              </Box>
              <AdminFournisseursPage />
            </CardContent>
          </Card>
        );

      case 'enclosures':
        return (
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ 
                textAlign: 'center', 
                mb: 3,
                p: 3,
                bgcolor: 'info.50',
                borderRadius: 2
              }}>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  bgcolor: 'info.main', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <SnowflakeIcon />
                </Avatar>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Configuration des enceintes froides
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configurez la surveillance des températures
                </Typography>
              </Box>
              <ColdStoragePage />
            </CardContent>
          </Card>
        );

      case 'cleaning':
        return (
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ 
                textAlign: 'center', 
                mb: 3,
                p: 3,
                bgcolor: 'warning.50',
                borderRadius: 2
              }}>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  bgcolor: 'warning.main', 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <CleaningIcon />
                </Avatar>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Configuration du plan de nettoyage
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configurez votre plan de nettoyage HACCP
                </Typography>
              </Box>
              <AdminPlanNettoyagePage />
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'success.main', 
                  mx: 'auto', 
                  mb: 3 
                }}>
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
                <Typography variant="h3" component="h1" gutterBottom fontWeight={700} color="success.main">
                  Félicitations !
                </Typography>
                <Typography variant="h5" gutterBottom color="text.secondary">
                  Votre système HACCP est maintenant configuré
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                  Vous pouvez maintenant commencer à utiliser toutes les fonctionnalités 
                  de votre système de gestion HACCP. Toutes vos données ont été sauvegardées 
                  et votre établissement est prêt pour la mise en conformité.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => window.location.href = '/'}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Accéder au tableau de bord
                </Button>
              </Box>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, textAlign: 'center' }}>
          Configuration HACCP
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, textAlign: 'center', mt: 1 }}>
          Configurez votre système de gestion HACCP étape par étape
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

      {/* Alerts */}
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
      {currentStep !== 'complete' && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handlePrevious}
              disabled={currentStep === 'login'}
            >
              Précédent
            </Button>

            <Typography variant="body2" color="text.secondary">
              Étape {getCurrentStepIndex() + 1} sur {steps.length}
            </Typography>

            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? 'Chargement...' : 'Suivant'}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
}