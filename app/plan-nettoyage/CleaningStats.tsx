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

export default function CleaningStats({ records }: CleaningStatsProps) {
  const completedRecords = records.filter(r => r.is_completed);
  const todayCompletedRecords = records.filter(r => {
    const today = new Date();
    const completionDate = r.completion_date ? new Date(r.completion_date) : null;
    return completionDate && 
           completionDate.toDateString() === today.toDateString() && 
           r.is_completed;
  });
  
  const stats = {
    totalTasks: records.length, // Total des enregistrements de nettoyage
    completedToday: todayCompletedRecords.length, // Complétées aujourd'hui (par completion_date)
    complianceRate: completedRecords.length > 0 ? 
      Math.round((completedRecords.filter(r => r.is_compliant).length / completedRecords.length) * 100) : 
      0, // Taux de conformité seulement sur les tâches complétées
    pendingTasks: records.filter(r => !r.is_completed).length // Tâches non complétées
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