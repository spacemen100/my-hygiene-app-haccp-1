"use client";

import { useState } from 'react';
import { Tables } from '@/src/types/database';
import { supabase } from '@/lib/supabase';
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
  Button
} from '@mui/material';
import {
  List,
  Edit as EditIcon,
  ExpandMore,
  Schedule,
  CheckCircle,
  Warning
} from '@mui/icons-material';

interface TaskListProps {
  tasks: Tables<'cleaning_tasks'>[];
  records: Tables<'cleaning_records'>[];
  onRefresh: () => void;
}

export default function TaskList({ tasks, records, onRefresh }: TaskListProps) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [recordsLimit, setRecordsLimit] = useState(10);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);

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
            Liste des Tâches
          </Typography>
          
          {hasMoreRecords && (
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
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>Tâche</strong></TableCell>
                <TableCell><strong>Date programmée</strong></TableCell>
                <TableCell><strong>Statut</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      Aucune tâche enregistrée
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map(record => {
                  const task = tasks.find(t => t.id === record.cleaning_task_id);
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
                        <IconButton
                          size="small"
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
        
        {records.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Affichage de {records.length} tâches
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}