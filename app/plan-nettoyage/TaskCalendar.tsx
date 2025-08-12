"use client";

import { useState } from 'react';
import { Tables } from '@/src/types/database';

type CleaningRecordWithTask = Tables<'cleaning_records'> & {
  cleaning_tasks?: Tables<'cleaning_tasks'>;
};
import {
  Box,
  Typography,
  Paper,
  Chip,
  Card,
  CardContent,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  Fab
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Warning,
  Schedule,
  Today,
  Add,
  CalendarMonth
} from '@mui/icons-material';

interface TaskCalendarProps {
  tasks: Tables<'cleaning_tasks'>[];
  records: Tables<'cleaning_records'>[];
  onEditRecord: (record: Tables<'cleaning_records'>) => void;
  onCreateTask?: (date: Date) => void;
}

export default function TaskCalendar({ tasks, records, onEditRecord, onCreateTask }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getRecordsForDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return records.filter(record => {
      const recordDate = new Date(record.scheduled_date);
      return recordDate.toDateString() === targetDate.toDateString();
    });
  };

  const getTaskName = (taskId: string, record?: Tables<'cleaning_records'>) => {
    // First try to get task from joined data in the record
    const recordWithTask = record as CleaningRecordWithTask;
    if (record && recordWithTask.cleaning_tasks) {
      return recordWithTask.cleaning_tasks.name;
    }
    // Fallback to finding the task
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : 'N/A';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToMonth = (month: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(month);
      return newDate;
    });
  };

  const goToYear = (year: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(year);
      return newDate;
    });
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    if (onCreateTask) {
      onCreateTask(clickedDate);
    }
  };

  const getTaskStats = (dayRecords: Tables<'cleaning_records'>[]) => {
    const completed = dayRecords.filter(r => r.is_completed).length;
    const compliant = dayRecords.filter(r => r.is_completed && r.is_compliant).length;
    const overdue = dayRecords.filter(r => {
      if (r.is_completed) return false;
      const today = new Date();
      const scheduledDate = new Date(r.scheduled_date);
      return scheduledDate < today;
    }).length;
    
    return { total: dayRecords.length, completed, compliant, overdue };
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const renderCalendarDays = () => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    // Headers des jours
    const headers = dayNames.map(day => (
      <Box key={day} sx={{ flex: 1, textAlign: 'center', p: 1 }}>
        <Typography variant="body2" fontWeight="bold" color="text.secondary">
          {day}
        </Typography>
      </Box>
    ));

    // Créer toutes les cellules pour le mois
    const cells: React.ReactNode[] = [];
    
    // Espaces vides pour les jours avant le premier du mois
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <Box key={`empty-${i}`} sx={{ flex: 1, p: 0.5 }}>
          <Box sx={{ minHeight: 80 }}></Box>
        </Box>
      );
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const dayRecords = getRecordsForDate(day);
      const stats = getTaskStats(dayRecords);
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = new Date().toDateString() === dayDate.toDateString();
      const isSelected = selectedDate?.toDateString() === dayDate.toDateString();
      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

      cells.push(
        <Box key={day} sx={{ flex: 1, p: 0.5 }}>
          <Paper
            onClick={() => handleDayClick(day)}
            sx={{
              p: 1,
              minHeight: isMobile ? 60 : 90,
              border: isSelected ? 2 : isToday ? 2 : 1,
              borderColor: isSelected ? 'secondary.main' : isToday ? 'primary.main' : 'divider',
              bgcolor: isToday ? 'primary.50' : isWeekend ? 'grey.50' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: isToday ? 'primary.100' : 'grey.100',
                transform: 'translateY(-1px)',
                boxShadow: 2
              },
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Day number with task count badge */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography 
                variant="body2" 
                fontWeight={isToday ? 'bold' : 'normal'}
                color={isToday ? 'primary.main' : 'text.primary'}
              >
                {day}
              </Typography>
              {stats.total > 0 && (
                <Badge 
                  badgeContent={stats.total} 
                  color={stats.overdue > 0 ? 'error' : stats.completed === stats.total ? 'success' : 'warning'}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      minWidth: 16,
                      height: 16
                    }
                  }}
                >
                  <CalendarMonth fontSize="small" />
                </Badge>
              )}
            </Box>

            {/* Task indicators */}
            {dayRecords.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, maxHeight: isMobile ? 30 : 50, overflow: 'hidden' }}>
                {dayRecords.slice(0, isMobile ? 1 : 2).map(record => (
                  <Tooltip
                    key={record.id}
                    title={`${getTaskName(record.cleaning_task_id || '', record)} - ${record.is_completed ? (record.is_compliant ? 'Conforme' : 'Non conforme') : 'En attente'}`}
                    arrow
                  >
                    <Chip
                      size="small"
                      label={isMobile ? '•' : getTaskName(record.cleaning_task_id || '', record).slice(0, 8) + '...'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRecord(record);
                      }}
                      sx={{
                        fontSize: '0.6rem',
                        height: 16,
                        cursor: 'pointer',
                        '& .MuiChip-label': {
                          px: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                      color={
                        record.is_completed 
                          ? record.is_compliant 
                            ? 'success' 
                            : 'warning'
                          : stats.overdue > 0 ? 'error' : 'default'
                      }
                      variant={record.is_completed ? 'filled' : 'outlined'}
                    />
                  </Tooltip>
                ))}
                {dayRecords.length > (isMobile ? 1 : 2) && (
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.6rem' }}>
                    +{dayRecords.length - (isMobile ? 1 : 2)} autres
                  </Typography>
                )}
              </Box>
            )}

            {/* Quick add button on hover */}
            {onCreateTask && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '.MuiPaper-root:hover &': { opacity: 1 }
                }}
              >
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDayClick(day);
                  }}
                  sx={{ 
                    width: 16, 
                    height: 16, 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  <Add sx={{ fontSize: 10 }} />
                </IconButton>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    // Grouper les cellules en semaines
    const weeks: React.ReactNode[] = [];
    let currentWeek: React.ReactNode[] = [];
    
    // Ajouter les headers
    weeks.push(
      <Box key="headers" sx={{ display: 'flex', gap: 0.5 }}>
        {headers}
      </Box>
    );

    cells.forEach((cell, index) => {
      currentWeek.push(cell);
      if (currentWeek.length === 7) {
        weeks.push(
          <Box key={`week-${Math.floor(index / 7)}`} sx={{ display: 'flex', gap: 0.5 }}>
            {currentWeek}
          </Box>
        );
        currentWeek = [];
      }
    });

    // Ajouter la dernière semaine si elle n'est pas complète
    if (currentWeek.length > 0) {
      // Compléter avec des cellules vides
      while (currentWeek.length < 7) {
        currentWeek.push(
          <Box key={`empty-end-${currentWeek.length}`} sx={{ flex: 1, p: 0.5 }}>
            <Box sx={{ minHeight: 80 }}></Box>
          </Box>
        );
      }
      weeks.push(
        <Box key="last-week" sx={{ display: 'flex', gap: 0.5 }}>
          {currentWeek}
        </Box>
      );
    }

    return weeks;
  };

  // Generate years and months for selectors
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent sx={{ pb: 1 }}>
        {/* Enhanced Navigation Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigateMonth('prev')} size="small">
              <ChevronLeft />
            </IconButton>
            
            {!isMobile && (
              <>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={currentDate.getMonth()}
                    onChange={(e) => goToMonth(e.target.value as number)}
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '& .MuiSelect-select': { py: 0.5, textTransform: 'capitalize' }
                    }}
                  >
                    {months.map((month, index) => (
                      <MenuItem key={month} value={index} sx={{ textTransform: 'capitalize' }}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={currentYear}
                    onChange={(e) => goToYear(e.target.value as number)}
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '& .MuiSelect-select': { py: 0.5 }
                    }}
                  >
                    {years.map(year => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            {isMobile && (
              <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                {monthName}
              </Typography>
            )}

            <IconButton onClick={() => navigateMonth('next')} size="small">
              <ChevronRight />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Today />}
              onClick={goToToday}
              sx={{ textTransform: 'none' }}
            >
              Aujourd&apos;hui
            </Button>
          </Box>
        </Box>

        {/* Calendar Statistics Summary */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {(() => {
            const monthRecords = records.filter(r => {
              const recordDate = new Date(r.scheduled_date);
              return recordDate.getMonth() === currentDate.getMonth() && 
                     recordDate.getFullYear() === currentDate.getFullYear();
            });
            const monthStats = getTaskStats(monthRecords);
            
            return (
              <>
                <Chip 
                  size="small" 
                  label={`${monthStats.total} tâches`} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  size="small" 
                  label={`${monthStats.completed} complétées`} 
                  color="success" 
                  variant={monthStats.completed > 0 ? "filled" : "outlined"} 
                />
                <Chip 
                  size="small" 
                  label={`${monthStats.overdue} en retard`} 
                  color="error" 
                  variant={monthStats.overdue > 0 ? "filled" : "outlined"} 
                />
              </>
            );
          })()}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {renderCalendarDays()}
        </Box>

        {/* Enhanced Legend */}
        <Box sx={{ 
          mt: 3, 
          display: 'flex', 
          gap: 3, 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle color="success" fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>Tâche conforme</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warning color="warning" fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>Non conforme</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule color="error" fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>En retard</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule color="disabled" fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>En attente</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2, borderLeft: 1, borderColor: 'divider', pl: 2 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'primary.50', border: 2, borderColor: 'primary.main', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>Aujourd&apos;hui</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'grey.50', border: 1, borderColor: 'divider', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>Week-end</Typography>
          </Box>
        </Box>

        {/* Floating Action Button for Quick Add */}
        {onCreateTask && (
          <Fab
            color="primary"
            size="medium"
            onClick={() => onCreateTask(new Date())}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 1
            }}
          >
            <Add />
          </Fab>
        )}
      </CardContent>
    </Card>
  );
}