"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/src/types/database';
import { useSnackbar } from 'notistack';
import {
  Container,
  Typography,
  Box,
  Card,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Button
} from '@mui/material';
import { CleaningServices } from '@mui/icons-material';
import CleaningStats from './CleaningStats';
import CleaningTaskForm from './CleaningTaskForm';
import RepeatTaskForm from './RepeatTaskForm';
import TaskList from './TaskList';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CleaningPlan() {
  const [tasks, setTasks] = useState<Tables<'cleaning_tasks'>[]>([]);
  const [records, setRecords] = useState<Tables<'cleaning_records'>[]>([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchTasks();
    fetchRecords();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('cleaning_tasks')
      .select(`
        *,
        cleaning_zones:cleaning_zone_id(id, name),
        cleaning_sub_zones:cleaning_sub_zone_id(id, name),
        cleaning_products:cleaning_product_id(id, name),
        cleaning_equipment:cleaning_equipment_id(id, name),
        cleaning_methods:cleaning_method_id(id, name)
      `);
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      console.log('Fetched tasks with relations:', data);
      setTasks(data || []);
    }
  };

  const fetchRecords = async (limit?: number) => {
    let query = supabase
      .from('cleaning_records')
      .select(`
        *,
        cleaning_tasks:cleaning_task_id(
          id, 
          name, 
          frequency, 
          action_to_perform,
          cleaning_zones:cleaning_zone_id(id, name),
          cleaning_sub_zones:cleaning_sub_zone_id(id, name),
          cleaning_products:cleaning_product_id(id, name),
          cleaning_equipment:cleaning_equipment_id(id, name)
        ),
        users:user_id(id, email),
        employees:employee_id(id, first_name, last_name)
      `)
      .order('scheduled_date', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching records:', error);
    } else {
      console.log('Fetched records with relations:', data);
      setRecords(data || []);
    }
  };

  const { enqueueSnackbar } = useSnackbar();

  // Fonction de test pour créer des données d'exemple
  const createTestData = async () => {
    try {
      // Créer une tâche de test
      const { data: taskData, error: taskError } = await supabase
        .from('cleaning_tasks')
        .insert([{
          name: 'Nettoyage sol cuisine',
          frequency: 'quotidien',
          action_to_perform: 'Nettoyer et désinfecter le sol'
        }])
        .select()
        .single();

      if (taskError) {
        console.error('Error creating test task:', taskError);
        return;
      }

      // Créer des enregistrements de test
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { error: recordsError } = await supabase
        .from('cleaning_records')
        .insert([
          {
            cleaning_task_id: taskData.id,
            scheduled_date: today.toISOString().split('T')[0],
            is_completed: false
          },
          {
            cleaning_task_id: taskData.id,
            scheduled_date: yesterday.toISOString().split('T')[0],
            is_completed: true,
            is_compliant: true,
            completion_date: yesterday.toISOString()
          },
          {
            cleaning_task_id: taskData.id,
            scheduled_date: tomorrow.toISOString().split('T')[0],
            is_completed: false
          }
        ]);

      if (recordsError) {
        console.error('Error creating test records:', recordsError);
      } else {
        console.log('Test data created successfully!');
        fetchTasks();
        fetchRecords();
        enqueueSnackbar('Données de test créées!', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error in createTestData:', error);
    }
  };

  return (
    <Box sx={{ 
      flexGrow: 1,
      width: '100%',
      maxWidth: { xs: '100vw', lg: '1400px' },
      mx: 'auto'
    }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
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
            <CleaningServices fontSize="large" />
          </Avatar>
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.75rem' },
                lineHeight: 1.2
              }}
            >
              Plan de Nettoyage HACCP
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
              Planification et suivi des tâches de nettoyage
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Statistiques */}
        <CleaningStats tasks={tasks} records={records} />

        {/* Bouton de test temporaire */}
        {records.length === 0 && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={createTestData}
              sx={{ mb: 2 }}
            >
              Créer des données de test
            </Button>
            <Typography variant="body2" color="text.secondary">
              Aucune donnée trouvée. Cliquez ci-dessus pour créer des données de test.
            </Typography>
          </Box>
        )}

        {/* Tabs pour les formulaires */}
        <Card sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} aria-label="cleaning tabs">
              <Tab label="Tâche unique" />
              <Tab label="Tâches répétitives" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <CleaningTaskForm 
              tasks={tasks}
              onSuccess={() => fetchRecords()} 
              enqueueSnackbar={enqueueSnackbar}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <RepeatTaskForm 
              tasks={tasks} 
              onSuccess={() => fetchRecords()}
            />
          </TabPanel>
        </Card>

        {/* Liste des tâches */}
        <TaskList 
          tasks={tasks} 
          records={records} 
          onRefresh={() => fetchRecords()}
        />
      </Container>
    </Box>
  );
}