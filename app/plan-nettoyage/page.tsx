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
  CardContent,
  Paper,
  Avatar,
  Button
} from '@mui/material';
import { CleaningServices, Help, Schedule, Assignment } from '@mui/icons-material';
import CleaningStats from './CleaningStats';
import CleaningTaskForm from './CleaningTaskForm';
import RepeatTaskForm from './RepeatTaskForm';
import TaskList from './TaskList';
import UserGuideModal from './UserGuideModal';
import CleaningScheduler from './CleaningScheduler';


export default function CleaningPlan() {
  const [tasks, setTasks] = useState<Tables<'cleaning_tasks'>[]>([]);
  const [records, setRecords] = useState<Tables<'cleaning_records'>[]>([]);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'none' | 'scheduler' | 'single' | 'repeat'>('none');

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
            <Button
              variant="outlined"
              size="small"
              startIcon={<Help />}
              onClick={() => setGuideModalOpen(true)}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                },
                fontSize: '0.8rem',
                mt: 1
              }}
            >
              Mode d&apos;emploi
            </Button>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Statistiques */}
        <CleaningStats tasks={tasks} records={records} />

        {/* Interface avec 3 boutons principaux */}
        <Card sx={{ mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
              Choisissez votre mode de planification
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3
            }}>
              {/* Bouton Plan Standard */}
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: activeForm === 'scheduler' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => setActiveForm(activeForm === 'scheduler' ? 'none' : 'scheduler')}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <Schedule fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" component="h4" sx={{ fontWeight: 600, mb: 1 }}>
                    Plan de Nettoyage Standard
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Créez un plan complet avec des tâches pré-remplies par zone
                  </Typography>
                  <Button
                    variant={activeForm === 'scheduler' ? 'contained' : 'outlined'}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    {activeForm === 'scheduler' ? 'Fermer' : 'Configurer'}
                  </Button>
                </CardContent>
              </Card>

              {/* Bouton Tâche Unique */}
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: activeForm === 'single' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => setActiveForm(activeForm === 'single' ? 'none' : 'single')}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'secondary.main',
                      color: 'white',
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <Assignment fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" component="h4" sx={{ fontWeight: 600, mb: 1 }}>
                    Tâche Unique
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ajoutez une tâche ponctuelle à effectuer une seule fois
                  </Typography>
                  <Button
                    variant={activeForm === 'single' ? 'contained' : 'outlined'}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    {activeForm === 'single' ? 'Fermer' : 'Ajouter'}
                  </Button>
                </CardContent>
              </Card>

              {/* Bouton Tâches Répétitives */}
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: activeForm === 'repeat' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => setActiveForm(activeForm === 'repeat' ? 'none' : 'repeat')}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'success.main',
                      color: 'white',
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <CleaningServices fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" component="h4" sx={{ fontWeight: 600, mb: 1 }}>
                    Tâches Répétitives
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Programmez des tâches récurrentes avec une fréquence définie
                  </Typography>
                  <Button
                    variant={activeForm === 'repeat' ? 'contained' : 'outlined'}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    {activeForm === 'repeat' ? 'Fermer' : 'Programmer'}
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Card>

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

        {/* Affichage conditionnel des formulaires */}
        {activeForm === 'scheduler' && (
          <Card sx={{ mb: 4 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                Programmeur de plan de nettoyage standard
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => setActiveForm('none')}
                size="small"
              >
                Fermer
              </Button>
            </Box>
            <CleaningScheduler />
          </Card>
        )}

        {activeForm === 'single' && (
          <Card sx={{ mb: 4 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                Ajouter une tâche unique
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => setActiveForm('none')}
                size="small"
              >
                Fermer
              </Button>
            </Box>
            <Box sx={{ p: 3 }}>
              <CleaningTaskForm 
                tasks={tasks}
                onSuccess={() => fetchRecords()} 
                enqueueSnackbar={enqueueSnackbar}
              />
            </Box>
          </Card>
        )}

        {activeForm === 'repeat' && (
          <Card sx={{ mb: 4 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                Programmer des tâches répétitives
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => setActiveForm('none')}
                size="small"
              >
                Fermer
              </Button>
            </Box>
            <Box sx={{ p: 3 }}>
              <RepeatTaskForm 
                tasks={tasks} 
                onSuccess={() => fetchRecords()}
              />
            </Box>
          </Card>
        )}

        {/* Liste des tâches */}
        <TaskList 
          tasks={tasks} 
          records={records} 
          onRefresh={() => fetchRecords()}
        />
      </Container>
      
      {/* Modal du guide utilisateur */}
      <UserGuideModal 
        open={guideModalOpen} 
        onClose={() => setGuideModalOpen(false)} 
      />
    </Box>
  );
}