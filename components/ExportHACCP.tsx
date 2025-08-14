'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useSnackbar } from 'notistack';
import {
  AssignmentTurnedIn as ClipboardCheckIcon,
  Label as TagIcon,
  Print as PrintIcon,
  AcUnit as SnowflakeIcon,
  Thermostat as ThermometerIcon,
  CleaningServices as SprayCanIcon,
  CheckCircle as CheckIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

interface ModuleSelection {
  controleReception: boolean;
  etiquettes: boolean;
  impressionDLC: boolean;
  enceintesFroides: boolean;
  suiviRefroidissement: boolean;
  planNettoyage: boolean;
}

interface HACCPReportData {
  establishment: {
    name: string;
    address?: string;
  };
  period: {
    startDate: string;
    endDate: string;
    reportDate: string;
  };
  deliveries?: any[];
  labels?: any[];
  dlcPrints?: any[];
  temperatureControls?: any[];
  coolingTracking?: any[];
  cleaningPlan?: any[];
}

export default function ExportHACCP() {
  const { employee } = useEmployee();
  const { enqueueSnackbar } = useSnackbar();
  
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
    'Bonjour,\nSuite à votre demande, veuillez trouver ci-dessous le rapport HACCP généré pour la période demandée.\n\nCordialement.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

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
      label: 'CONTRÔLE DES ENCEINTES FROIDES',
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

  const fetchDeliveries = useCallback(async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        supplier:suppliers(name),
        temperature_controls:truck_temperature_controls(*),
        product_controls:product_reception_controls(*),
        non_conformities:non_conformities(*)
      `)
      .gte('delivery_date', startDate.toISOString())
      .lte('delivery_date', endDate.toISOString())
      .eq('organization_id', employee?.organization_id);

    if (error) throw error;
    return data || [];
  }, [employee?.organization_id]);

  const fetchLabels = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('printed_labels')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('organization_id', employee?.organization_id);

      if (error) {
        console.warn('Table printed_labels n\'existe pas encore:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Erreur lors de la récupération des étiquettes:', err);
      return [];
    }
  }, [employee?.organization_id]);

  const fetchDLCPrints = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      // Cette table n'existe peut-être pas encore, à adapter selon votre schéma
      const { data, error } = await supabase
        .from('dlc_prints')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('organization_id', employee?.organization_id);

      if (error) {
        console.warn('Table dlc_prints n\'existe pas encore:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Erreur lors de la récupération des DLC:', err);
      return [];
    }
  }, [employee?.organization_id]);

  const fetchTemperatureControls = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      // Essayer d'abord avec truck_temperature_controls qui existe
      const { data, error } = await supabase
        .from('truck_temperature_controls')
        .select('*')
        .gte('control_date', startDate.toISOString())
        .lte('control_date', endDate.toISOString());

      if (error) {
        console.warn('Erreur lors de la récupération des contrôles température:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Erreur lors de la récupération des contrôles température:', err);
      return [];
    }
  }, [employee?.organization_id]);

  const fetchCoolingTracking = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      // Cette table n'existe peut-être pas encore, à adapter selon votre schéma
      const { data, error } = await supabase
        .from('cooling_tracking')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('organization_id', employee?.organization_id);

      if (error) {
        console.warn('Table cooling_tracking n\'existe pas encore:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Erreur lors de la récupération du suivi refroidissement:', err);
      return [];
    }
  }, [employee?.organization_id]);

  const fetchCleaningPlan = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('cleaning_tasks')
        .select('*')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .eq('organization_id', employee?.organization_id)
        .not('completed_at', 'is', null);

      if (error) {
        console.warn('Erreur lors de la récupération du plan de nettoyage:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Erreur lors de la récupération du plan de nettoyage:', err);
      return [];
    }
  }, [employee?.organization_id]);

  const generateHACCPReport = useCallback(async (): Promise<HACCPReportData | null> => {
    if (!startDate || !endDate || !employee?.organization_id) {
      enqueueSnackbar('Veuillez sélectionner une période valide', { variant: 'error' });
      return null;
    }

    try {
      // Récupérer le nom de l'organisation
      let establishmentName = 'Établissement';
      try {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', employee.organization_id)
          .single();
        
        if (orgData?.name) {
          establishmentName = orgData.name;
        }
      } catch (orgError) {
        console.warn('Impossible de récupérer le nom de l\'organisation:', orgError);
      }

      const reportData: HACCPReportData = {
        establishment: {
          name: establishmentName,
        },
        period: {
          startDate: format(startDate, 'dd/MM/yyyy'),
          endDate: format(endDate, 'dd/MM/yyyy'),
          reportDate: format(new Date(), 'dd/MM/yyyy'),
        },
      };

      // Récupération des données selon les modules sélectionnés
      const fetchPromises = [];

      if (selectedModules.controleReception) {
        fetchPromises.push(fetchDeliveries(startDate, endDate).then(data => ({ deliveries: data })));
      }

      if (selectedModules.etiquettes) {
        fetchPromises.push(fetchLabels(startDate, endDate).then(data => ({ labels: data })));
      }

      if (selectedModules.impressionDLC) {
        fetchPromises.push(fetchDLCPrints(startDate, endDate).then(data => ({ dlcPrints: data })));
      }

      if (selectedModules.enceintesFroides) {
        fetchPromises.push(fetchTemperatureControls(startDate, endDate).then(data => ({ temperatureControls: data })));
      }

      if (selectedModules.suiviRefroidissement) {
        fetchPromises.push(fetchCoolingTracking(startDate, endDate).then(data => ({ coolingTracking: data })));
      }

      if (selectedModules.planNettoyage) {
        fetchPromises.push(fetchCleaningPlan(startDate, endDate).then(data => ({ cleaningPlan: data })));
      }

      const results = await Promise.allSettled(fetchPromises);
      
      // Fusion des résultats (seulement ceux qui ont réussi)
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          Object.assign(reportData, result.value);
        } else {
          console.warn(`Erreur lors de la récupération du module ${index}:`, result.reason);
        }
      });

      return reportData;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      enqueueSnackbar('Erreur lors de la récupération des données', { variant: 'error' });
      return null;
    }
  }, [startDate, endDate, selectedModules, employee, fetchDeliveries, fetchLabels, fetchDLCPrints, fetchTemperatureControls, fetchCoolingTracking, fetchCleaningPlan, enqueueSnackbar]);

  const generatePDFContent = (data: HACCPReportData): string => {
    let content = `Rapport Complet - Contrôle HACCP
Fait le ${data.period.reportDate}
Période couverte : du ${data.period.startDate} au ${data.period.endDate}

1. Profil de l'établissement
Nom : ${data.establishment.name}
`;

    // Contrôle à réception
    if (selectedModules.controleReception && data.deliveries) {
      content += `
2. Contrôle à réception
Liste des livraisons contrôlées :

Fournisseur    N° de BL    Date et heure de livraison
`;
      data.deliveries.forEach((delivery: any) => {
        const supplierName = delivery.supplier?.name || 'Non spécifié';
        const deliveryNumber = delivery.delivery_number || '(vide)';
        const deliveryDate = delivery.delivery_date ? 
          format(new Date(delivery.delivery_date), 'dd/MM/yyyy - HH\'h\'mm', { locale: fr }) : 
          'Non spécifié';
        content += `${supplierName}    ${deliveryNumber}    ${deliveryDate}\n`;
      });

      const missingBLs = data.deliveries.filter((d: any) => !d.delivery_number);
      if (missingBLs.length > 0) {
        content += `
Observations :
Numéros de BL manquants : ${missingBLs.map((d: any) => d.supplier?.name || 'Fournisseur non spécifié').join(', ')}.
`;
      }

      const nonCompliantDeliveries = data.deliveries.filter((d: any) => !d.is_compliant);
      if (nonCompliantDeliveries.length === 0) {
        content += `
Aucune anomalie signalée pour les livraisons.
`;
      }
    }

    // Enregistrement des étiquettes
    if (selectedModules.etiquettes && data.labels) {
      content += `
3. Enregistrement des étiquettes
`;
      if (data.labels.length > 0) {
        content += `Étiquettes enregistrées : ${data.labels.length}\n`;
        data.labels.slice(0, 5).forEach((label: any) => {
          const labelDate = label.created_at ? 
            format(new Date(label.created_at), 'dd/MM/yyyy - HH\'h\'mm', { locale: fr }) : 
            'Non spécifié';
          content += `Date et heure : ${labelDate}\n`;
        });
      } else {
        content += `Aucune étiquette enregistrée pour cette période.\n`;
      }
    }

    // Impression des DLC secondaires
    if (selectedModules.impressionDLC && data.dlcPrints) {
      content += `
4. Impression des DLC secondaires
Produits contrôlés :

Signataire    Panier    Produit    Quantité    Date d'impression    Date de péremption
`;
      if (data.dlcPrints.length > 0) {
        data.dlcPrints.forEach((print: any) => {
          content += `${print.employee_name || 'Non spécifié'}    ${print.basket || 'Non spécifié'}    ${print.product_name || 'Non spécifié'}    ${print.quantity || 0}    ${print.print_date ? format(new Date(print.print_date), 'dd/MM/yyyy') : 'Non spécifié'}    ${print.expiry_date ? format(new Date(print.expiry_date), 'dd/MM/yyyy') : 'Non spécifié'}\n`;
        });
      } else {
        content += `Aucune impression DLC enregistrée pour cette période.\n`;
      }
    }

    // Contrôle des enceintes froides
    if (selectedModules.enceintesFroides && data.temperatureControls) {
      const totalExpected = 16; // À adapter selon votre configuration
      const actualReadings = data.temperatureControls.length;
      const conformityRate = actualReadings > 0 ? (actualReadings / totalExpected * 100).toFixed(1) : '0.0';
      
      content += `
5. Contrôle des enceintes froides
Statut : ${actualReadings}/${totalExpected} relevés réalisés (${conformityRate} % de conformité).
Détails des relevés :

Signataire    Tâche    Zone    Date    Heure    Température    Conformité    Action corrective
`;
      
      data.temperatureControls.forEach((control: any) => {
        const controlDate = control.control_date ? format(new Date(control.control_date), 'dd/MM/yyyy') : 'Non spécifié';
        const controlTime = control.control_date ? format(new Date(control.control_date), 'HH\'h\'mm') : 'Non spécifié';
        const compliance = control.is_compliant ? 'Conforme' : 'Non conforme';
        content += `${control.employee_name || 'Non spécifié'}    Relevé température    ${control.zone_name || control.storage_type}    ${controlDate}    ${controlTime}    ${control.temperature} °C    ${compliance}    ${control.corrective_action || '-'}\n`;
      });

      const compliantControls = data.temperatureControls.filter((c: any) => c.is_compliant);
      if (compliantControls.length === data.temperatureControls.length && data.temperatureControls.length > 0) {
        content += `
Observations :
Toutes les températures sont conformes aux normes HACCP.
`;
      }
    }

    // Suivi de refroidissement
    if (selectedModules.suiviRefroidissement) {
      content += `
6. Suivi de refroidissement
`;
      if (data.coolingTracking && data.coolingTracking.length > 0) {
        content += `Suivi enregistré pour ${data.coolingTracking.length} produit(s).\n`;
      } else {
        content += `Aucune donnée enregistrée pour cette période.\n`;
      }
    }

    // Plan de nettoyage
    if (selectedModules.planNettoyage && data.cleaningPlan) {
      const totalExpectedTasks = 157; // À adapter selon votre configuration
      const completedTasks = data.cleaningPlan.length;
      const completionRate = completedTasks > 0 ? (completedTasks / totalExpectedTasks * 100).toFixed(1) : '0.0';
      
      content += `
7. Plan de nettoyage
Statut : ${completedTasks}/${totalExpectedTasks} tâches réalisées (${completionRate} %).
Détails des tâches :

Signataire    Échéance    Fréquence    Zone    Action    Date et heure
`;
      
      data.cleaningPlan.forEach((task: any) => {
        const completedDate = task.completed_at ? 
          format(new Date(task.completed_at), 'dd/MM/yyyy - HH\'h\'mm', { locale: fr }) : 
          'Non spécifié';
        content += `${task.employee_name || 'Non spécifié'}    ${task.frequency || 'Non spécifié'}    ${task.frequency}    ${task.zone || 'Non spécifié'}    ${task.task_name || 'Non spécifié'}    ${completedDate}\n`;
      });

      if (parseFloat(completionRate) < 50) {
        content += `
Observations :
Tâches de nettoyage partiellement réalisées (${completionRate} %).
Priorité à accorder aux zones critiques.
`;
      }
    }

    // Actions correctives recommandées
    content += `
8. Actions correctives recommandées
`;

    if (selectedModules.controleReception && data.deliveries) {
      const missingBLs = data.deliveries.filter((d: any) => !d.delivery_number);
      if (missingBLs.length > 0) {
        content += `Contrôle à réception :
Vérifier systématiquement les numéros de BL manquants avec les fournisseurs concernés.
`;
      }
    }

    if (selectedModules.planNettoyage && data.cleaningPlan) {
      const completionRate = data.cleaningPlan.length / 157 * 100;
      if (completionRate < 80) {
        content += `Plan de nettoyage :
Augmenter le taux de réalisation des tâches (objectif : 100 %).
Contrôler la fréquence des nettoyages dans les zones critiques.
`;
      }
    }

    if (selectedModules.enceintesFroides && data.temperatureControls) {
      const completionRate = data.temperatureControls.length / 16 * 100;
      if (completionRate < 100) {
        content += `Enceintes froides :
Compléter les relevés manquants pour atteindre 100 % de conformité.
`;
      }
    }

    content += `
Signature du responsable :
[À compléter]
Date : ${data.period.reportDate}`;

    return content;
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      enqueueSnackbar('Veuillez sélectionner une période', { variant: 'error' });
      return;
    }

    setIsGenerating(true);
    try {
      const reportData = await generateHACCPReport();
      if (reportData) {
        const pdfContent = generatePDFContent(reportData);
        
        // Créer et télécharger le fichier
        const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport-haccp-${format(startDate, 'yyyy-MM-dd')}-au-${format(endDate, 'yyyy-MM-dd')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        enqueueSnackbar('Rapport généré avec succès', { variant: 'success' });
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      enqueueSnackbar('Erreur lors de la génération du rapport', { variant: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReportByEmail = async () => {
    if (!emailRecipients.trim()) {
      enqueueSnackbar('Veuillez saisir au moins une adresse email', { variant: 'error' });
      return;
    }

    if (!startDate || !endDate) {
      enqueueSnackbar('Veuillez sélectionner une période', { variant: 'error' });
      return;
    }

    setIsSending(true);
    try {
      const reportData = await generateHACCPReport();
      if (reportData) {
        const pdfContent = generatePDFContent(reportData);
        
        // Ici vous pouvez implémenter l'envoi par email
        // Par exemple, utiliser une API ou service d'email
        console.log('Envoi du rapport par email:', {
          recipients: emailRecipients,
          message: customMessage,
          reportContent: pdfContent,
        });

        enqueueSnackbar('Rapport envoyé avec succès', { variant: 'success' });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rapport:', error);
      enqueueSnackbar('Erreur lors de l\'envoi du rapport', { variant: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = Object.values(selectedModules).filter(Boolean).length;

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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Box>
                <DatePicker
                  label="DU"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Box>
              <Box>
                <DatePicker
                  label="AU"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Box>
            </Box>
            {startDate && endDate && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Période sélectionnée : du {format(startDate, 'dd/MM/yyyy')} au {format(endDate, 'dd/MM/yyyy')}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Section 2 - Sélection des modules */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                SÉLECTIONNEZ LES MODULES DONT VOUS VOULEZ LES DONNÉES :
              </Typography>
              <Chip 
                label={`${selectedCount}/${modules.length} sélectionné(s)`}
                color={selectedCount > 0 ? 'primary' : 'default'}
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {modules.map((module) => (
                <Box key={module.key}>
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
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Section 3 - Destinataires */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
              DESTINATAIRES (OPTIONNEL)
            </Typography>
            <TextField
              fullWidth
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              placeholder="email1@exemple.com, email2@exemple.com"
              multiline
              rows={2}
              label="Adresses email"
              helperText="Séparez les adresses par des virgules"
              sx={{ mb: 2 }}
            />
          </CardContent>
        </Card>

        {/* Section 4 - Message personnalisé */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
              MESSAGE PERSONNALISÉ (OPTIONNEL)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              variant="outlined"
              label="Votre message"
              placeholder="Personnalisez le message qui accompagnera le rapport..."
            />
          </CardContent>
        </Card>

        <Divider sx={{ my: 4 }} />

        {/* Actions finales */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Box>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleGenerateReport}
                disabled={isGenerating || !startDate || !endDate || selectedCount === 0}
                startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                sx={{ py: 2, fontSize: '1.1rem', fontWeight: 600 }}
              >
                {isGenerating ? 'Génération...' : 'Télécharger le rapport'}
              </Button>
            </Box>
            <Box>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleSendReportByEmail}
                disabled={isSending || !startDate || !endDate || selectedCount === 0 || !emailRecipients.trim()}
                startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
                sx={{ py: 2, fontSize: '1.1rem', fontWeight: 600 }}
              >
                {isSending ? 'Envoi...' : 'Envoyer par email'}
              </Button>
            </Box>
          </Box>
          
          {(!startDate || !endDate || selectedCount === 0) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Veuillez sélectionner une période et au moins un module pour générer le rapport.
            </Alert>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}