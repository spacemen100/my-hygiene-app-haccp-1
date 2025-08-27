"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Pagination,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Archive,
  ExpandMore,
  Search,
  FilterList,
  CheckCircle,
  Cancel,
  Warning,
  LocalShipping,
  Thermostat,
  Inventory,
  Label,
  CleaningServices,
  LocalDining,
  Timeline,
  Assessment,
  Today,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSnackbar } from 'notistack';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`archive-tabpanel-${index}`}
      aria-labelledby={`archive-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

type RecordType = 'deliveries' | 'temperature_readings' | 'label_records' | 'cleaning_records' | 'oil_quality_controls' | 'cooling_records';

interface ArchiveRecord {
  id: string;
  created_at: string;
  type: RecordType;
  title: string;
  description?: string;
  is_compliant?: boolean;
  employee_name?: string;
  data: Record<string, unknown>;
}

export default function AdminConsultationArchivePage() {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ArchiveRecord[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedRecord, setExpandedRecord] = useState<string | false>(false);


  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<RecordType | 'all'>('all');
  const [selectedCompliance, setSelectedCompliance] = useState<'all' | 'compliant' | 'non_compliant'>('all');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const recordTypes = [
    { value: 'deliveries', label: 'Contrôle Réception', icon: <LocalShipping />, color: 'primary' },
    { value: 'temperature_readings', label: 'Relevés Température', icon: <Thermostat />, color: 'info' },
    { value: 'label_records', label: 'Étiquettes', icon: <Label />, color: 'secondary' },
    { value: 'cleaning_records', label: 'Plan Nettoyage', icon: <CleaningServices />, color: 'success' },
    { value: 'oil_quality_controls', label: 'Contrôle Huile', icon: <LocalDining />, color: 'warning' },
    { value: 'cooling_records', label: 'Suivi Refroidissement', icon: <Timeline />, color: 'error' },
  ];

  const fetchArchiveRecords = useCallback(async () => {
    console.log('Fetching archive records...');
    setLoading(true);
    setError(null);
    try {
      const allRecords: ArchiveRecord[] = [];

      // Fetch Deliveries - simplified query first
      console.log('Fetching deliveries...');
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*')
        .order('delivery_date', { ascending: false })
        .limit(10);

      if (deliveriesError) {
        console.error('Error fetching deliveries:', deliveriesError);
        throw deliveriesError;
      }

      console.log(`Found ${deliveries?.length || 0} deliveries`);
      deliveries?.forEach(delivery => {
        allRecords.push({
          id: delivery.id,
          created_at: delivery.delivery_date,
          type: 'deliveries',
          title: `Livraison - ${delivery.delivery_number || 'Sans numéro'}`,
          description: `Date: ${new Date(delivery.delivery_date).toLocaleDateString()}`,
          is_compliant: delivery.is_compliant,
          employee_name: undefined,
          data: delivery,
        });
      });

      // Fetch Cold Storage Temperature Readings - simplified
      console.log('Fetching temperature readings...');
      const { data: tempReadings, error: tempError } = await supabase
        .from('cold_storage_temperature_readings')
        .select('*')
        .order('reading_date', { ascending: false })
        .limit(10);

      if (tempError) throw tempError;

      console.log(`Found ${tempReadings?.length || 0} temperature readings`);
      tempReadings?.forEach(reading => {
        allRecords.push({
          id: reading.id,
          created_at: reading.reading_date,
          type: 'temperature_readings',
          title: `Relevé Température`,
          description: `${reading.temperature}°C`,
          is_compliant: reading.is_compliant,
          employee_name: undefined,
          data: reading,
        });
      });

      // TODO: Re-enable other queries once basic loading works
      /*
      // Fetch Label Records
      const { data: labelRecords, error: labelError } = await supabase
        .from('label_records')
        .select('*')
        .order('record_date', { ascending: false })
        .limit(10);

      if (labelError) throw labelError;
      console.log(`Found ${labelRecords?.length || 0} label records`);

      // Fetch Cleaning Records  
      const { data: cleaningRecords, error: cleaningError } = await supabase
        .from('cleaning_records')
        .select('*')
        .order('scheduled_date', { ascending: false })
        .limit(10);

      if (cleaningError) throw cleaningError;
      console.log(`Found ${cleaningRecords?.length || 0} cleaning records`);

      // Fetch Oil Quality Controls
      const { data: oilControls, error: oilError } = await supabase
        .from('oil_quality_controls')
        .select('*')
        .order('control_date', { ascending: false })
        .limit(10);

      if (oilError) throw oilError;
      console.log(`Found ${oilControls?.length || 0} oil controls`);

      // Fetch Cooling Records
      const { data: coolingRecords, error: coolingError } = await supabase
        .from('cooling_records')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(10);

      if (coolingError) throw coolingError;
      console.log(`Found ${coolingRecords?.length || 0} cooling records`);
      */

      // Sort all records by date (most recent first)
      allRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log(`Total records found: ${allRecords.length}`);
      setRecords(allRecords);
      setFilteredRecords(allRecords);
    } catch (error) {
      console.error('Error fetching archive records:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      enqueueSnackbar('Erreur lors du chargement des archives', { variant: 'error' });
    } finally {
      setLoading(false);
      console.log('Finished loading archive records');
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchArchiveRecords();
  }, [fetchArchiveRecords]);

  // Apply filters
  useEffect(() => {
    let filtered = [...records];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by record type
    if (selectedType !== 'all') {
      filtered = filtered.filter(record => record.type === selectedType);
    }

    // Filter by compliance
    if (selectedCompliance !== 'all') {
      filtered = filtered.filter(record => {
        if (selectedCompliance === 'compliant') {
          return record.is_compliant === true;
        } else if (selectedCompliance === 'non_compliant') {
          return record.is_compliant === false;
        }
        return true;
      });
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.created_at);
        if (dateFrom && recordDate < dateFrom) return false;
        if (dateTo && recordDate > dateTo) return false;
        return true;
      });
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);
  }, [records, searchTerm, selectedType, selectedCompliance, dateFrom, dateTo]);

  const handleExpandRecord = (recordId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedRecord(isExpanded ? recordId : false);
  };

  const getTypeConfig = (type: RecordType) => {
    return recordTypes.find(rt => rt.value === type) || recordTypes[0];
  };

  // Helper function to safely format dates
  const formatDate = (date: string | Date, formatString: string) => {
    try {
      return format(new Date(date), formatString, { locale: fr });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Date invalide';
    }
  };

  const renderRecordDetails = (record: ArchiveRecord) => {

    switch (record.type) {
      case 'deliveries':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Informations générales
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Fournisseur" secondary={(record.data.supplier as { name?: string })?.name} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Date de livraison" secondary={formatDate(record.data.delivery_date as string, 'PPPp')} />
                    </ListItem>
                    {record.data.delivery_number && (
                      <ListItem>
                        <ListItemText primary="Numéro de livraison" secondary={record.data.delivery_number as string} />
                      </ListItem>
                    )}
                    {record.data.comments && (
                      <ListItem>
                        <ListItemText primary="Commentaires" secondary={record.data.comments as string} />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Contrôles effectués
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Thermostat fontSize="small" />
                      <Typography variant="body2">
                        {(record.data.temperature_controls as unknown[])?.length || 0} contrôle(s) température camion
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inventory fontSize="small" />
                      <Typography variant="body2">
                        {(record.data.product_controls as unknown[])?.length || 0} produit(s) contrôlé(s)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Warning fontSize="small" />
                      <Typography variant="body2">
                        {(record.data.non_conformities as unknown[])?.length || 0} non-conformité(s)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'temperature_readings':
        return (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Détails du relevé de température
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Unité de stockage" secondary={(record.data.cold_storage_unit as { name?: string })?.name} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Localisation" secondary={(record.data.cold_storage_unit as { location?: string })?.location} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Température relevée" secondary={`${record.data.temperature}°C`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Date et heure" secondary={formatDate(record.data.reading_date as string, 'PPPp')} />
                </ListItem>
                {record.data.comments && (
                  <ListItem>
                    <ListItemText primary="Commentaires" secondary={record.data.comments as string} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        );

      case 'cleaning_records':
        return (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Détails de la tâche de nettoyage
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Tâche" secondary={(record.data.cleaning_task as { name?: string })?.name} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Action à effectuer" secondary={(record.data.cleaning_task as { action_to_perform?: string })?.action_to_perform} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Date prévue" secondary={formatDate(record.data.scheduled_date as string, 'PPP')} />
                </ListItem>
                {record.data.completion_date && (
                  <ListItem>
                    <ListItemText primary="Date de réalisation" secondary={formatDate(record.data.completion_date as string, 'PPP')} />
                  </ListItem>
                )}
                {record.data.comments && (
                  <ListItem>
                    <ListItemText primary="Commentaires" secondary={record.data.comments as string} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Données de l&apos;enregistrement
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                {JSON.stringify(record.data, null, 2)}
              </Typography>
            </CardContent>
          </Card>
        );
    }
  };

  // Calculate statistics
  const stats = {
    total: records.length,
    compliant: records.filter(r => r.is_compliant === true).length,
    nonCompliant: records.filter(r => r.is_compliant === false).length,
    byType: recordTypes.map(type => ({
      ...type,
      count: records.filter(r => r.type === type.value).length
    }))
  };

  // Paginated records
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  // Show loading state during initial load
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ flexGrow: 1, width: '100%', maxWidth: '1400px', mx: 'auto', px: { xs: 1, md: 2 } }}>
        <Alert severity="error" sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Erreur de chargement
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
          <Button onClick={fetchArchiveRecords} sx={{ mt: 2 }}>
            Réessayer
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, width: '100%', maxWidth: '1400px', mx: 'auto', px: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
          color: 'white',
          p: { xs: 2, md: 4 },
          mb: { xs: 2, md: 4 },
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              width: { xs: 56, md: 80 },
              height: { xs: 56, md: 80 },
            }}
          >
            <Archive fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Consultation Archives HACCP
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Historique exhaustif de tous les contrôles et enregistrements
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Enregistrements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {stats.compliant}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conformes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                {stats.nonCompliant}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Non Conformes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                {Math.round((stats.compliant / (stats.total || 1)) * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Taux Conformité
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs and Filters */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<Assessment />}
            label="Tous les Enregistrements"
            iconPosition="start"
          />
          <Tab
            icon={<Today />}
            label="Vue Chronologique"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <TabPanel value={selectedTab} index={0}>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Filtres
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Rechercher"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedType}
                  label="Type"
                  onChange={(e) => setSelectedType(e.target.value as RecordType | 'all')}
                >
                  <MenuItem value="all">Tous types</MenuItem>
                  {recordTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Conformité</InputLabel>
                <Select
                  value={selectedCompliance}
                  label="Conformité"
                  onChange={(e) => setSelectedCompliance(e.target.value as 'all' | 'compliant' | 'non_compliant')}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="compliant">Conforme</MenuItem>
                  <MenuItem value="non_compliant">Non conforme</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Date de début"
                value={dateFrom}
                onChange={(date) => setDateFrom(date)}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Date de fin"
                value={dateTo}
                onChange={(date) => setDateTo(date)}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedCompliance('all');
                  setDateFrom(null);
                  setDateTo(null);
                }}
                size="small"
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Records List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : filteredRecords.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun enregistrement trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Essayez de modifier vos filtres de recherche
            </Typography>
          </Paper>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {filteredRecords.length} enregistrement(s) trouvé(s)
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {paginatedRecords.map((record) => {
                const typeConfig = getTypeConfig(record.type);
                return (
                  <Accordion
                    key={record.id}
                    expanded={expandedRecord === record.id}
                    onChange={handleExpandRecord(record.id)}
                    elevation={1}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ 
                        width: '100%', 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <Avatar
                          sx={{
                            bgcolor: `${typeConfig.color}.main`,
                            color: 'white',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {typeConfig.icon}
                        </Avatar>
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" noWrap>
                            {record.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {record.description} • {formatDate(record.created_at, 'PPP')}
                            {record.employee_name && ` • Par ${record.employee_name}`}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={typeConfig.label}
                            size="small"
                            color={typeConfig.color as 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'}
                            variant="outlined"
                          />
                          
                          {record.is_compliant !== undefined && (
                            <Tooltip title={record.is_compliant ? 'Conforme' : 'Non conforme'}>
                              <Box>
                                {record.is_compliant ? (
                                  <CheckCircle color="success" fontSize="small" />
                                ) : (
                                  <Cancel color="error" fontSize="small" />
                                )}
                              </Box>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails sx={{ pt: 2 }}>
                      {renderRecordDetails(record)}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(e, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Vue chronologique en développement - Cette section permettra de visualiser l&apos;évolution des contrôles dans le temps avec des graphiques et des tendances.
          </Typography>
        </Alert>
      </TabPanel>
    </Box>
  );
}