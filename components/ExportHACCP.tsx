'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import {
  AssignmentTurnedIn as ClipboardCheckIcon,
  Label as TagIcon,
  Print as PrintIcon,
  AcUnit as SnowflakeIcon,
  Thermostat as ThermometerIcon,
  CleaningServices as SprayCanIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface ModuleSelection {
  controleReception: boolean;
  etiquettes: boolean;
  impressionDLC: boolean;
  enceintesFroides: boolean;
  suiviRefroidissement: boolean;
  planNettoyage: boolean;
}

export default function ExportHACCP() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedModules, setSelectedModules] = useState<ModuleSelection>({
    controleReception: true,
    etiquettes: true,
    impressionDLC: true,
    enceintesFroides: true,
    suiviRefroidissement: true,
    planNettoyage: true,
  });
  const [emailRecipients, setEmailRecipients] = useState('');
  const [customMessage, setCustomMessage] = useState(
    'Bonjour,\nSuite à votre demande, veuillez trouver ci-dessous un lien de téléchargement vers le rapport HACCP du au'
  );

  const modules = [
    {
      key: 'controleReception' as keyof ModuleSelection,
      label: 'CONTRÔLE À RÉCEPTION',
      icon: <ClipboardCheckIcon />,
    },
    {
      key: 'etiquettes' as keyof ModuleSelection,
      label: 'ENREGISTREMENT DES ÉTIQUETTES',
      icon: <TagIcon />,
    },
    {
      key: 'impressionDLC' as keyof ModuleSelection,
      label: 'IMPRESSION DES DLC SECONDAIRES',
      icon: <PrintIcon />,
    },
    {
      key: 'enceintesFroides' as keyof ModuleSelection,
      label: 'ENCEINTES FROIDES',
      icon: <SnowflakeIcon />,
    },
    {
      key: 'suiviRefroidissement' as keyof ModuleSelection,
      label: 'SUIVI DE REFROIDISSEMENT',
      icon: <ThermometerIcon />,
    },
    {
      key: 'planNettoyage' as keyof ModuleSelection,
      label: 'PLAN DE NETTOYAGE',
      icon: <SprayCanIcon />,
    },
  ];

  const handleModuleChange = (moduleKey: keyof ModuleSelection) => {
    setSelectedModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  const handleSelectBaskets = () => {
    // TODO: Implement basket selection logic
    console.log('Sélection des paniers');
  };

  const handleGenerateReport = () => {
    // TODO: Implement report generation logic
    console.log('Génération du rapport', {
      startDate,
      endDate,
      selectedModules,
      customMessage,
    });
  };

  const handleSendReportByEmail = () => {
    // TODO: Implement email sending logic
    console.log('Envoi du rapport par email', {
      startDate,
      endDate,
      selectedModules,
      emailRecipients,
      customMessage,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            Export HACCP
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            CONTRÔLE HACCP : EXPORTEZ TOUTES VOS DONNÉES HACCP DANS UN SEUL PDF
          </Typography>
        </Paper>

        {/* Section 1 - Sélection de période */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
              SÉLECTIONNEZ LA PÉRIODE :
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="DU"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  inputFormat="dd/MM/yyyy"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="AU"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  inputFormat="dd/MM/yyyy"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Section 2 - Sélection des modules */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
              SÉLECTIONNEZ LES MODULES DONT VOUS VOULEZ LES DONNÉES :
            </Typography>
            <Grid container spacing={2}>
              {modules.map((module) => (
                <Grid item xs={12} sm={6} md={4} key={module.key}>
                  <Button
                    variant={selectedModules[module.key] ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleModuleChange(module.key)}
                    startIcon={module.icon}
                    endIcon={selectedModules[module.key] ? <CheckIcon /> : null}
                    sx={{
                      py: 1.5,
                      px: 2,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      '& .MuiButton-startIcon': {
                        mr: 1,
                      },
                      '& .MuiButton-endIcon': {
                        ml: 'auto',
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      {module.label}
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Section 3 - Configuration spécifique */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
              ENREGISTREMENT DES ÉTIQUETTES :
            </Typography>
            <Button
              variant="outlined"
              onClick={handleSelectBaskets}
              sx={{ py: 1.5, px: 3 }}
            >
              SÉLECTIONNEZ LES PANIERS
            </Button>
          </CardContent>
        </Card>

        {/* Section 4 - Destinataires */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
              INDIQUER LES ADRESSES MAILS DES DESTINATAIRES
            </Typography>
            <TextField
              fullWidth
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              placeholder="example@exemple.com, example2@exemple.com"
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
          </CardContent>
        </Card>

        {/* Section 5 - Message personnalisé */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
              SAISIR VOTRE MESSAGE
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              variant="outlined"
            />
          </CardContent>
        </Card>

        {/* Actions finales */}
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleGenerateReport}
                sx={{ py: 2, fontSize: '1.1rem', fontWeight: 600 }}
              >
                Générer le rapport
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleSendReportByEmail}
                sx={{ py: 2, fontSize: '1.1rem', fontWeight: 600 }}
              >
                Envoyer le rapport par mail
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}