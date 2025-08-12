"use client";

import { useState } from 'react';
import { Tables } from '@/src/types/database';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Warning,
  Schedule
} from '@mui/icons-material';

interface TaskCalendarProps {
  tasks: Tables<'cleaning_tasks'>[];
  records: Tables<'cleaning_records'>[];
  onEditRecord: (record: Tables<'cleaning_records'>) => void;
}

export default function TaskCalendar({ tasks, records, onEditRecord }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getTaskName = (taskId: string) => {
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
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

      cells.push(
        <Box key={day} sx={{ flex: 1, p: 0.5 }}>
          <Paper
            sx={{
              p: 1,
              minHeight: 80,
              border: isToday ? 2 : 1,
              borderColor: isToday ? 'primary.main' : 'divider',
              bgcolor: isToday ? 'primary.50' : 'background.paper',
              cursor: dayRecords.length > 0 ? 'pointer' : 'default'
            }}
          >
            <Typography variant="body2" fontWeight={isToday ? 'bold' : 'normal'}>
              {day}
            </Typography>
            {dayRecords.map(record => (
              <Chip
                key={record.id}
                size="small"
                label={getTaskName(record.cleaning_task_id || '')}
                onClick={() => onEditRecord(record)}
                sx={{
                  mt: 0.5,
                  fontSize: '0.7rem',
                  height: 20,
                  cursor: 'pointer',
                  display: 'block',
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }
                }}
                color={
                  record.is_completed 
                    ? record.is_compliant 
                      ? 'success' 
                      : 'warning'
                    : 'default'
                }
                icon={
                  record.is_completed 
                    ? record.is_compliant 
                      ? <CheckCircle /> 
                      : <Warning />
                    : <Schedule />
                }
              />
            ))}
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

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <IconButton onClick={() => navigateMonth('prev')}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
            {monthName}
          </Typography>
          <IconButton onClick={() => navigateMonth('next')}>
            <ChevronRight />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {renderCalendarDays()}
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle color="success" fontSize="small" />
            <Typography variant="caption">Conforme</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warning color="warning" fontSize="small" />
            <Typography variant="caption">Non conforme</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule color="disabled" fontSize="small" />
            <Typography variant="caption">En attente</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}