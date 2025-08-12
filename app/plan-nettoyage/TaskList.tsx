"use client";

import { useState } from 'react';
import { Tables } from '@/src/types/database';
import { supabase } from '@/lib/supabase';
import { useEmployee } from '@/contexts/EmployeeContext';

type CleaningRecordWithTask = Tables<'cleaning_records'> & {
  cleaning_tasks?: Tables<'cleaning_tasks'>;
};
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  List,
  Edit as EditIcon,
  ExpandMore,
  Schedule,
  CheckCircle,
  Warning,
  CalendarToday,
  Assignment,
  AssignmentTurnedIn,
  AssignmentLate,
  Today,
  Photo
} from '@mui/icons-material';
import EditTaskDialog from './EditTaskDialog';
import TaskCalendar from './TaskCalendar';

interface TaskListProps {
  tasks: Tables<'cleaning_tasks'>[];
  records: Tables<'cleaning_records'>[];
  onRefresh: () => void;
}

type TabValue = 'all' | 'todo' | 'completed' | 'overdue' | 'today' | 'calendar';

export default function TaskList({ tasks, records, onRefresh }: TaskListProps) {
  const { selectedEmployee } = useEmployee();
  const [loadingMore, setLoadingMore] = useState(false);
  const [recordsLimit, setRecordsLimit] = useState(10);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Tables<'cleaning_records'> | null>(null);
  const [tabValue, setTabValue] = useState<TabValue>('all');

  // Debug logs
  console.log('TaskList received:', { 
    tasksCount: tasks.length, 
    recordsCount: records.length, 
    tasks: tasks.slice(0, 2), 
    records: records.slice(0, 2) 
  });

  const loadMoreRecords = async () => {
    setLoadingMore(true);
    const newLimit = recordsLimit + 10;
    const { data, error } = await supabase
      .from('cleaning_records')
      .select('*')
      .order('scheduled_date', { ascending: false })
      .limit(newLimit);
    
    if (!error && data) {
      setRecordsLimit(newLimit);
      setHasMoreRecords(data.length === newLimit);
      onRefresh();
    }
    setLoadingMore(false);
  };

  const getTaskFrequencyColor = (frequency: string) => {
    switch (frequency?.toLowerCase()) {
      case 'quotidien': return 'success';
      case 'hebdomadaire': return 'info';
      case 'mensuel': return 'warning';
      default: return 'default';
    }
  };

  // Fonctions de filtrage
  const isToday = (date: string) => {
    const today = new Date();
    const taskDate = new Date(date);
    return today.toDateString() === taskDate.toDateString();
  };

  const isOverdue = (record: Tables<'cleaning_records'>) => {
    if (record.is_completed) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin de journée
    const scheduledDate = new Date(record.scheduled_date);
    return scheduledDate < today;
  };

  // Filtrer les enregistrements selon l'onglet sélectionné
  const getFilteredRecords = () => {
    switch (tabValue) {
      case 'todo':
        return records.filter(record => !record.is_completed);
      case 'completed':
        return records.filter(record => record.is_completed);
      case 'overdue':
        return records.filter(record => isOverdue(record));
      case 'today':
        return records.filter(record => isToday(record.scheduled_date));
      default:
        return records;
    }
  };

  // Compteurs pour les badges
  const getCounts = () => {
    return {
      all: records.length,
      todo: records.filter(record => !record.is_completed).length,
      completed: records.filter(record => record.is_completed).length,
      overdue: records.filter(record => isOverdue(record)).length,
      today: records.filter(record => isToday(record.scheduled_date)).length
    };
  };

  const counts = getCounts();
  const filteredRecords = getFilteredRecords();

  const handleEditRecord = (record: Tables<'cleaning_records'>) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedRecord(null);
  };

  const handleSaveRecord = async (data: Partial<Tables<'cleaning_records'>>) => {
    if (!selectedRecord) return;
    
    const { error } = await supabase
      .from('cleaning_records')
      .update({
        ...data,
        employee_id: selectedEmployee?.id || null
      })
      .eq('id', selectedRecord.id);
    
    if (error) {
      throw error;
    }
    
    onRefresh();
    handleCloseEditDialog();
  };

  return (
    <Card elevation={3} sx={{
      mx: { xs: -1, sm: 0 },
      borderRadius: { xs: 0, sm: 1 },
      overflow: { xs: 'hidden', sm: 'visible' }
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: { xs: 2, sm: 3 }
        }}>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5 },
              color: 'info.main',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            <List />
            Gestion des Tâches
          </Typography>
          
          {hasMoreRecords && tabValue !== 'calendar' && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={loadMoreRecords}
              disabled={loadingMore}
              startIcon={<ExpandMore />}
            >
              {loadingMore ? 'Chargement...' : '+ Voir tâches précédentes'}
            </Button>
          )}
        </Box>

        {/* Onglets */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              value="all" 
              label={
                <Badge badgeContent={counts.all} color="default">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <List fontSize="small" />
                    Toutes
                  </Box>
                </Badge>
              }
            />
            <Tab 
              value="todo" 
              label={
                <Badge badgeContent={counts.todo} color="info">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment fontSize="small" />
                    À faire
                  </Box>
                </Badge>
              }
            />
            <Tab 
              value="completed" 
              label={
                <Badge badgeContent={counts.completed} color="success">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentTurnedIn fontSize="small" />
                    Réalisées
                  </Box>
                </Badge>
              }
            />
            <Tab 
              value="overdue" 
              label={
                <Badge badgeContent={counts.overdue} color="error">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentLate fontSize="small" />
                    En retard
                  </Box>
                </Badge>
              }
            />
            <Tab 
              value="today" 
              label={
                <Badge badgeContent={counts.today} color="warning">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Today fontSize="small" />
                    Aujourd&apos;hui
                  </Box>
                </Badge>
              }
            />
            <Tab 
              value="calendar" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday fontSize="small" />
                  Calendrier
                </Box>
              }
            />
          </Tabs>
        </Box>
        
        {/* Contenu conditionnel selon l'onglet */}
        {tabValue === 'calendar' ? (
          <TaskCalendar 
            tasks={tasks} 
            records={records} 
            onEditRecord={handleEditRecord}
          />
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>Tâche</strong></TableCell>
                    <TableCell><strong>Date programmée</strong></TableCell>
                    <TableCell><strong>Statut</strong></TableCell>
                    <TableCell><strong>Photo</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">
                          {tabValue === 'all' 
                            ? 'Aucune tâche enregistrée' 
                            : `Aucune tâche ${
                                tabValue === 'todo' ? 'à faire' :
                                tabValue === 'completed' ? 'réalisée' :
                                tabValue === 'overdue' ? 'en retard' :
                                tabValue === 'today' ? 'pour aujourd&apos;hui' : ''
                              }`
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map(record => {
                      const task = (record as CleaningRecordWithTask).cleaning_tasks || tasks.find(t => t.id === record.cleaning_task_id);
                      return (
                        <TableRow key={record.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {task ? task.name : 'N/A'}
                              </Typography>
                              {task && (
                                <Chip 
                                  label={task.frequency}
                                  size="small"
                                  color={getTaskFrequencyColor(task.frequency)}
                                  variant="outlined"
                                  sx={{ width: 'fit-content', mt: 0.5 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(record.scheduled_date).toLocaleString('fr-FR', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </Typography>
                            {record.completion_date && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Complété le {new Date(record.completion_date).toLocaleString('fr-FR', {
                                  dateStyle: 'short',
                                  timeStyle: 'short'
                                })}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.is_completed ? (
                              record.is_compliant ? (
                                <Chip
                                  size="small"
                                  icon={<CheckCircle />}
                                  label="Complété (Conforme)"
                                  color="success"
                                  variant="filled"
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  icon={<Warning />}
                                  label="Complété (Non conforme)"
                                  color="warning"
                                  variant="filled"
                                />
                              )
                            ) : (
                              <Chip
                                size="small"
                                icon={<Schedule />}
                                label="En attente"
                                color="default"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {record.photo_url ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  component="img"
                                  src={record.photo_url}
                                  alt="Photo de la tâche"
                                  sx={{
                                    width: 40,
                                    height: 30,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: 'grey.300',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(record.photo_url!, '_blank')}
                                  title="Cliquer pour voir en grand"
                                />
                                <Photo color="success" fontSize="small" />
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Aucune photo
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleEditRecord(record)}
                              sx={{ color: 'primary.main' }}
                              title="Modifier la tâche"
                            >
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredRecords.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Affichage de {filteredRecords.length} tâche(s)
                {tabValue !== 'all' && ` sur ${records.length} au total`}
              </Typography>
            )}
          </>
        )}
      </CardContent>
      
      <EditTaskDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        record={selectedRecord}
        tasks={tasks}
        onSave={handleSaveRecord}
      />
    </Card>
  );
}