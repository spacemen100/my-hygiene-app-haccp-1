import { Tables } from '@/src/types/database';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar
} from '@mui/material';
import {
  Assignment,
  TaskAlt,
  TrendingUp,
  CalendarToday
} from '@mui/icons-material';

interface CleaningStatsProps {
  tasks: Tables<'cleaning_tasks'>[];
  records: Tables<'cleaning_records'>[];
}

export default function CleaningStats({ tasks, records }: CleaningStatsProps) {
  const stats = {
    totalTasks: tasks.length,
    completedToday: records.filter(r => {
      const today = new Date();
      const recordDate = new Date(r.scheduled_date);
      return recordDate.toDateString() === today.toDateString() && r.is_completed;
    }).length,
    complianceRate: records.length > 0 ? 
      Math.round((records.filter(r => r.is_compliant).length / records.length) * 100) : 
      0,
    pendingTasks: tasks.length - records.filter(r => r.is_completed).length
  };

  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
      gap: { xs: 2, sm: 3 }, 
      mb: { xs: 3, md: 4 }
    }}>
      <StatCard 
        title="Tâches totales" 
        value={stats.totalTasks} 
        icon={<Assignment />} 
        color="#4caf50"
      />
      <StatCard 
        title="Complétées aujourd'hui" 
        value={stats.completedToday} 
        icon={<TaskAlt />} 
        color="#ff9800"
      />
      <StatCard 
        title="Taux conformité" 
        value={`${stats.complianceRate}%`} 
        icon={<TrendingUp />} 
        color="#2196f3"
      />
      <StatCard 
        title="En attente" 
        value={stats.pendingTasks} 
        icon={<CalendarToday />} 
        color="#9c27b0"
      />
    </Box>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Box>
      <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography 
                color="text.secondary" 
                gutterBottom 
                variant="body2"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {value}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}20`, color }}>
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}