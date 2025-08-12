"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/src/types/database';
import { useSnackbar } from 'notistack';
import {
  Container,
  Typography,
  Box,
  Card,
  Tabs,
  Tab,
  Paper,
  Avatar
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
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchTasks();
    fetchRecords();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('cleaning_tasks').select('*');
    if (!error && data) setTasks(data);
  };

  const fetchRecords = async (limit = 10) => {
    const { data, error } = await supabase
      .from('cleaning_records')
      .select('*')
      .order('scheduled_date', { ascending: false })
      .limit(limit);
    if (!error && data) setRecords(data);
  };

  const { enqueueSnackbar } = useSnackbar();

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

        {/* Tabs pour les formulaires */}
        <Card sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} aria-label="cleaning tabs">
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
              enqueueSnackbar={enqueueSnackbar}
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