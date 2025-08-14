"use client";

import { useState, useMemo, useEffect } from 'react';
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
  Fab,
  Menu,
  MenuList,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Warning,
  Schedule,
  Today,
  Add,
  CalendarMonth,
  ViewDay,
  ViewWeek,
  ViewModule
} from '@mui/icons-material';

interface TaskCalendarProps {
  tasks: Tables<'cleaning_tasks'>[];
  records: Tables<'cleaning_records'>[];
  onEditRecord: (record: Tables<'cleaning_records'>) => void;
  onCreateTask?: (date: Date) => void;
}

type ViewType = 'day' | 'week' | 'month';

export default function TaskCalendar({ tasks, records, onEditRecord, onCreateTask }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  
  // Initialiser le calendrier avec le premier mois qui contient des records
  const initialDate = useMemo(() => {
    if (records.length === 0) return new Date();
    
    // Trouver le mois le plus ancien avec des records
    const dates = records.map(r => new Date(r.scheduled_date));
    const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
    return oldestDate;
  }, [records]);
  
  // Mettre à jour la date courante quand les records changent
  useEffect(() => {
    if (records.length > 0) {
      setCurrentDate(initialDate);
    }
  }, [initialDate, records.length]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; records: Tables<'cleaning_records'>[] } | null>(null);
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

  const getRecordsForDateRange = (startDate: Date, endDate: Date) => {
    return records.filter(record => {
      const recordDate = new Date(record.scheduled_date);
      return recordDate >= startDate && recordDate <= endDate;
    });
  };

  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.getFullYear(), date.getMonth(), diff);
  };

  const getWeekEnd = (date: Date) => {
    const weekStart = getWeekStart(date);
    return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
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

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewType === 'day') {
        if (direction === 'prev') {
          newDate.setDate(prev.getDate() - 1);
        } else {
          newDate.setDate(prev.getDate() + 1);
        }
      } else if (viewType === 'week') {
        if (direction === 'prev') {
          newDate.setDate(prev.getDate() - 7);
        } else {
          newDate.setDate(prev.getDate() + 7);
        }
      } else { // month
        if (direction === 'prev') {
          newDate.setMonth(prev.getMonth() - 1);
        } else {
          newDate.setMonth(prev.getMonth() + 1);
        }
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
              position: 'relative',
              overflow: 'visible'
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
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0.25, 
                maxHeight: isMobile ? 30 : 50, 
                overflow: 'visible',
                position: 'relative',
                zIndex: 10
              }}>
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
                          : 'error'
                      }
                      variant={record.is_completed ? 'filled' : 'outlined'}
                    />
                  </Tooltip>
                ))}
                {dayRecords.length > (isMobile ? 1 : 2) && (
                  <Chip
                    size="small"
                    label={`+${dayRecords.length - (isMobile ? 1 : 2)} autres`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAnchor({ element: e.currentTarget as HTMLElement, records: dayRecords });
                    }}
                    sx={{
                      fontSize: '0.6rem',
                      height: 16,
                      cursor: 'pointer',
                      '& .MuiChip-label': {
                        px: 0.5
                      }
                    }}
                    color="info"
                    variant="outlined"
                  />
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
                  opacity: 1,
                  zIndex: 5
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
                    color: 'white'
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

  const renderDayView = () => {
    const dayRecords = records.filter(record => {
      const recordDate = new Date(record.scheduled_date);
      return recordDate.toDateString() === currentDate.toDateString();
    });

    const stats = getTaskStats(dayRecords);

    return (
      <Box sx={{ p: 2 }}>
        {/* Day header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {currentDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label={`${stats.total} tâches`} color="primary" />
            <Chip label={`${stats.completed} complétées`} color="success" variant={stats.completed > 0 ? "filled" : "outlined"} />
            <Chip label={`${stats.overdue} en retard`} color="error" variant={stats.overdue > 0 ? "filled" : "outlined"} />
          </Box>
        </Box>

        {/* Tasks list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {dayRecords.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="h6" color="text.secondary">
                Aucune tâche prévue pour cette journée
              </Typography>
            </Paper>
          ) : (
            dayRecords.map(record => (
              <Paper
                key={record.id}
                onClick={() => onEditRecord(record)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  borderLeft: 4,
                  borderColor: record.is_completed 
                    ? record.is_compliant 
                      ? 'success.main' 
                      : 'warning.main'
                    : 'error.main',
                  '&:hover': {
                    bgcolor: 'grey.50',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  },
                  transition: 'all 0.2s'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {getTaskName(record.cleaning_task_id || '', record)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Programmé à {new Date(record.scheduled_date).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      record.is_completed 
                        ? record.is_compliant 
                          ? 'Conforme' 
                          : 'Non conforme'
                        : 'En attente'
                    }
                    color={
                      record.is_completed 
                        ? record.is_compliant 
                          ? 'success' 
                          : 'warning'
                        : 'error'
                    }
                    variant="filled"
                  />
                </Box>
              </Paper>
            ))
          )}
        </Box>
      </Box>
    );
  };

  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    const weekRecords = getRecordsForDateRange(weekStart, getWeekEnd(currentDate));
    const weekStats = getTaskStats(weekRecords);

    return (
      <Box sx={{ p: 2 }}>
        {/* Week header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Semaine du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} 
            au {getWeekEnd(currentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label={`${weekStats.total} tâches`} color="primary" />
            <Chip label={`${weekStats.completed} complétées`} color="success" variant={weekStats.completed > 0 ? "filled" : "outlined"} />
            <Chip label={`${weekStats.overdue} en retard`} color="error" variant={weekStats.overdue > 0 ? "filled" : "outlined"} />
          </Box>
        </Box>

        {/* Week grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Day headers */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {weekDays.map(day => (
              <Box key={day.toISOString()} sx={{ flex: 1, textAlign: 'center', p: 1 }}>
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </Typography>
                <Typography variant="h6" fontWeight="600">
                  {day.getDate()}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Day cells */}
          <Box sx={{ display: 'flex', gap: 1, minHeight: 300 }}>
            {weekDays.map(day => {
              const dayRecords = records.filter(record => {
                const recordDate = new Date(record.scheduled_date);
                return recordDate.toDateString() === day.toDateString();
              });
              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <Paper
                  key={day.toISOString()}
                  onClick={() => setCurrentDate(day)}
                  sx={{
                    flex: 1,
                    p: 1,
                    cursor: 'pointer',
                    border: isToday ? 2 : 1,
                    borderColor: isToday ? 'primary.main' : 'divider',
                    bgcolor: isToday ? 'primary.50' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'grey.50'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, height: '100%' }}>
                    {dayRecords.slice(0, 5).map(record => (
                      <Chip
                        key={record.id}
                        size="small"
                        label={getTaskName(record.cleaning_task_id || '', record).slice(0, 12) + '...'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRecord(record);
                        }}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                        color={
                          record.is_completed 
                            ? record.is_compliant 
                              ? 'success' 
                              : 'warning'
                            : 'error'
                        }
                        variant={record.is_completed ? 'filled' : 'outlined'}
                      />
                    ))}
                    {dayRecords.length > 5 && (
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                        +{dayRecords.length - 5} autres
                      </Typography>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
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
            <IconButton onClick={() => navigate('prev')} size="small">
              <ChevronLeft />
            </IconButton>
            
            {!isMobile && viewType === 'month' && (
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

            {(isMobile || viewType !== 'month') && (
              <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                {viewType === 'day' 
                  ? currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : viewType === 'week'
                  ? `Semaine du ${getWeekStart(currentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                  : monthName}
              </Typography>
            )}

            <IconButton onClick={() => navigate('next')} size="small">
              <ChevronRight />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* View selector */}
            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={(_, newView) => newView && setViewType(newView)}
              size="small"
            >
              <ToggleButton value="day" aria-label="vue jour">
                <ViewDay />
              </ToggleButton>
              <ToggleButton value="week" aria-label="vue semaine">
                <ViewWeek />
              </ToggleButton>
              <ToggleButton value="month" aria-label="vue mois">
                <ViewModule />
              </ToggleButton>
            </ToggleButtonGroup>

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

        {/* Calendar Content */}
        {viewType === 'day' && renderDayView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'month' && (
          <>
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
          </>
        )}

        {/* Enhanced Legend - only show in month view */}
        {viewType === 'month' && (
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
        )}

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

      {/* Menu pour afficher toutes les tâches d'un jour */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: 300,
              maxHeight: 400
            }
          }
        }}
      >
        <MenuList dense>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600, borderBottom: 1, borderColor: 'divider' }}>
            Toutes les tâches du jour
          </Typography>
          {menuAnchor?.records.map((record) => (
            <MenuItem
              key={record.id}
              onClick={() => {
                onEditRecord(record);
                setMenuAnchor(null);
              }}
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.5,
                borderLeft: 3,
                borderColor: record.is_completed 
                  ? record.is_compliant 
                    ? 'success.main' 
                    : 'warning.main'
                  : 'error.main',
                '&:hover': {
                  bgcolor: 'grey.50'
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {getTaskName(record.cleaning_task_id || '', record)}
              </Typography>
              <Chip
                size="small"
                label={
                  record.is_completed 
                    ? record.is_compliant 
                      ? 'Conforme' 
                      : 'Non conforme'
                    : 'En attente'
                }
                color={
                  record.is_completed 
                    ? record.is_compliant 
                      ? 'success' 
                      : 'warning'
                    : 'error'
                }
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Card>
  );
}