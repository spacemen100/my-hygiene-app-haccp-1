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
import jsPDF from 'jspdf';
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

  const generatePDF = (data: HACCPReportData): jsPDF => {
    const doc = new jsPDF();
    
    // Configuration des couleurs
    const primaryColor = '#1976d2';
    const secondaryColor = '#f5f5f5';
    const textColor = '#333333';
    const successColor = '#4caf50';
    const warningColor = '#ff9800';
    const errorColor = '#f44336';

    let yPos = 20;

    // Fonction utilitaire pour ajouter une nouvelle page si nécessaire
    const checkPageBreak = (neededSpace: number = 20) => {
      if (yPos + neededSpace > 280) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // Header avec logo et titre
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT HACCP', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${data.period.reportDate}`, 150, 25);
    doc.text(`Période : du ${data.period.startDate} au ${data.period.endDate}`, 150, 32);

    yPos = 60;

    // Section 1: Profil de l'établissement
    doc.setTextColor(textColor);
    doc.setFillColor(secondaryColor);
    doc.rect(10, yPos - 5, 190, 15, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PROFIL DE L\'ÉTABLISSEMENT', 15, yPos + 5);
    
    yPos += 25;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nom : ${data.establishment.name}`, 20, yPos);
    
    yPos += 20;

    // Section 2: Contrôle à réception
    if (selectedModules.controleReception && data.deliveries) {
      checkPageBreak(40);
      
      doc.setFillColor(secondaryColor);
      doc.rect(10, yPos - 5, 190, 15, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('2. CONTRÔLE À RÉCEPTION', 15, yPos + 5);
      
      yPos += 25;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre de livraisons contrôlées : ${data.deliveries.length}`, 20, yPos);
      
      yPos += 15;
      
      // Tableau des livraisons
      if (data.deliveries.length > 0) {
        // Headers du tableau
        doc.setFont('helvetica', 'bold');
        doc.text('Fournisseur', 20, yPos);
        doc.text('N° BL', 80, yPos);
        doc.text('Date/Heure', 130, yPos);
        doc.text('Statut', 170, yPos);
        
        yPos += 8;
        doc.line(15, yPos, 195, yPos); // Ligne de séparation
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        
        data.deliveries.slice(0, 10).forEach((delivery: any) => {
          checkPageBreak();
          
          const supplierName = (delivery.supplier?.name || 'Non spécifié').substring(0, 15);
          const deliveryNumber = (delivery.delivery_number || '(vide)').substring(0, 12);
          const deliveryDate = delivery.delivery_date ? 
            format(new Date(delivery.delivery_date), 'dd/MM/yy HH:mm', { locale: fr }) : 
            'Non spécifié';
          
          doc.text(supplierName, 20, yPos);
          doc.text(deliveryNumber, 80, yPos);
          doc.text(deliveryDate, 130, yPos);
          
          // Statut avec couleur
          if (delivery.is_compliant) {
            doc.setTextColor(successColor);
            doc.text('✓', 170, yPos);
          } else {
            doc.setTextColor(errorColor);
            doc.text('✗', 170, yPos);
          }
          doc.setTextColor(textColor);
          
          yPos += 8;
        });

        if (data.deliveries.length > 10) {
          yPos += 5;
          doc.setFont('helvetica', 'italic');
          doc.text(`... et ${data.deliveries.length - 10} autres livraisons`, 20, yPos);
          doc.setFont('helvetica', 'normal');
        }
      }

      yPos += 15;

      // Observations
      const missingBLs = data.deliveries.filter((d: any) => !d.delivery_number);
      const nonCompliantDeliveries = data.deliveries.filter((d: any) => !d.is_compliant);
      
      if (missingBLs.length > 0 || nonCompliantDeliveries.length > 0) {
        checkPageBreak(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Observations :', 20, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        
        if (missingBLs.length > 0) {
          doc.setTextColor(warningColor);
          doc.text(`• ${missingBLs.length} numéro(s) de BL manquant(s)`, 25, yPos);
          yPos += 8;
        }
        
        if (nonCompliantDeliveries.length > 0) {
          doc.setTextColor(errorColor);
          doc.text(`• ${nonCompliantDeliveries.length} livraison(s) non conforme(s)`, 25, yPos);
          yPos += 8;
        }
        
        doc.setTextColor(textColor);
      }

      yPos += 15;
    }

    // Section 3: Enceintes froides
    if (selectedModules.enceintesFroides && data.temperatureControls) {
      checkPageBreak(40);
      
      doc.setFillColor(secondaryColor);
      doc.rect(10, yPos - 5, 190, 15, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('3. CONTRÔLE DES ENCEINTES FROIDES', 15, yPos + 5);
      
      yPos += 25;
      
      const totalExpected = 16;
      const actualReadings = data.temperatureControls.length;
      const conformityRate = actualReadings > 0 ? (actualReadings / totalExpected * 100).toFixed(1) : '0.0';
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Relevés réalisés : ${actualReadings}/${totalExpected} (${conformityRate}%)`, 20, yPos);
      
      // Barre de progression
      const progressWidth = 100;
      const progressFill = (actualReadings / totalExpected) * progressWidth;
      
      yPos += 10;
      doc.setFillColor(220, 220, 220);
      doc.rect(20, yPos - 3, progressWidth, 6, 'F');
      
      const progressColor = parseFloat(conformityRate) >= 80 ? successColor : 
                           parseFloat(conformityRate) >= 50 ? warningColor : errorColor;
      doc.setFillColor(progressColor);
      doc.rect(20, yPos - 3, progressFill, 6, 'F');
      
      yPos += 15;

      // Détails des relevés
      if (data.temperatureControls.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Zone', 20, yPos);
        doc.text('Date', 80, yPos);
        doc.text('Température', 120, yPos);
        doc.text('Conformité', 160, yPos);
        
        yPos += 8;
        doc.line(15, yPos, 195, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        
        data.temperatureControls.slice(0, 8).forEach((control: any) => {
          checkPageBreak();
          
          const zoneName = (control.zone_name || control.storage_type || 'Zone').substring(0, 15);
          const controlDate = control.control_date ? 
            format(new Date(control.control_date), 'dd/MM/yy', { locale: fr }) : 
            'N/A';
          const temperature = `${control.temperature || 0}°C`;
          
          doc.text(zoneName, 20, yPos);
          doc.text(controlDate, 80, yPos);
          doc.text(temperature, 120, yPos);
          
          if (control.is_compliant) {
            doc.setTextColor(successColor);
            doc.text('Conforme', 160, yPos);
          } else {
            doc.setTextColor(errorColor);
            doc.text('Non conforme', 160, yPos);
          }
          doc.setTextColor(textColor);
          
          yPos += 8;
        });
      }
      
      yPos += 15;
    }

    // Section 4: Plan de nettoyage
    if (selectedModules.planNettoyage && data.cleaningPlan) {
      checkPageBreak(40);
      
      doc.setFillColor(secondaryColor);
      doc.rect(10, yPos - 5, 190, 15, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('4. PLAN DE NETTOYAGE', 15, yPos + 5);
      
      yPos += 25;
      
      const totalExpectedTasks = 157;
      const completedTasks = data.cleaningPlan.length;
      const completionRate = completedTasks > 0 ? (completedTasks / totalExpectedTasks * 100).toFixed(1) : '0.0';
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tâches réalisées : ${completedTasks}/${totalExpectedTasks} (${completionRate}%)`, 20, yPos);
      
      // Barre de progression pour le nettoyage
      yPos += 10;
      const cleaningProgressFill = (completedTasks / totalExpectedTasks) * 100;
      
      doc.setFillColor(220, 220, 220);
      doc.rect(20, yPos - 3, 100, 6, 'F');
      
      const cleaningColor = parseFloat(completionRate) >= 80 ? successColor : 
                           parseFloat(completionRate) >= 50 ? warningColor : errorColor;
      doc.setFillColor(cleaningColor);
      doc.rect(20, yPos - 3, cleaningProgressFill, 6, 'F');
      
      yPos += 20;
    }

    // Section 5: Actions correctives recommandées
    checkPageBreak(40);
    
    doc.setFillColor(secondaryColor);
    doc.rect(10, yPos - 5, 190, 15, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('5. ACTIONS CORRECTIVES RECOMMANDÉES', 15, yPos + 5);
    
    yPos += 25;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    let hasRecommendations = false;

    if (selectedModules.controleReception && data.deliveries) {
      const missingBLs = data.deliveries.filter((d: any) => !d.delivery_number);
      if (missingBLs.length > 0) {
        hasRecommendations = true;
        doc.setTextColor(warningColor);
        doc.text('• Vérifier les numéros de BL manquants avec les fournisseurs', 20, yPos);
        yPos += 8;
      }
    }

    if (selectedModules.planNettoyage && data.cleaningPlan) {
      const completionRate = data.cleaningPlan.length / 157 * 100;
      if (completionRate < 80) {
        hasRecommendations = true;
        doc.setTextColor(errorColor);
        doc.text('• Augmenter le taux de réalisation des tâches de nettoyage', 20, yPos);
        yPos += 8;
      }
    }

    if (selectedModules.enceintesFroides && data.temperatureControls) {
      const completionRate = data.temperatureControls.length / 16 * 100;
      if (completionRate < 100) {
        hasRecommendations = true;
        doc.setTextColor(errorColor);
        doc.text('• Compléter les relevés de température manquants', 20, yPos);
        yPos += 8;
      }
    }

    if (!hasRecommendations) {
      doc.setTextColor(successColor);
      doc.text('Aucune action corrective nécessaire pour cette période.', 20, yPos);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.text(`Rapport HACCP - Page ${i}/${pageCount}`, 15, 285);
      doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, 140, 285);
    }

    return doc;
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
        const pdf = generatePDF(reportData);
        
        // Télécharger le PDF
        const fileName = `rapport-haccp-${format(startDate, 'yyyy-MM-dd')}-au-${format(endDate, 'yyyy-MM-dd')}.pdf`;
        pdf.save(fileName);

        enqueueSnackbar('Rapport PDF généré avec succès', { variant: 'success' });
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
        const pdf = generatePDF(reportData);
        
        // Ici vous pouvez implémenter l'envoi par email
        // Par exemple, utiliser une API ou service d'email
        console.log('Envoi du rapport par email:', {
          recipients: emailRecipients,
          message: customMessage,
          pdf: pdf,
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