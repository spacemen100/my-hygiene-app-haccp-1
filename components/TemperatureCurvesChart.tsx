"use client";

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, Avatar } from '@mui/material';
import { ShowChart } from '@mui/icons-material';
import { Tables } from '@/src/types/database';

interface TemperatureCurvesChartProps {
  readings: Tables<'cold_storage_temperature_readings'>[];
  units: Tables<'cold_storage_units'>[];
}

const COLORS = [
  '#00bcd4', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', 
  '#3f51b5', '#795548', '#607d8b', '#f44336', '#cddc39'
];

export default function TemperatureCurvesChart({ readings, units }: TemperatureCurvesChartProps) {
  const chartData = useMemo(() => {
    // Grouper les lectures par timestamp pour créer des points de données cohérents
    const timeGroups = readings
      .slice(0, 100) // Limiter aux 100 dernières lectures
      .reduce((acc, reading) => {
        const timeKey = new Date(reading.reading_date).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
        if (!acc[timeKey]) {
          acc[timeKey] = {
            time: timeKey,
            displayTime: new Date(reading.reading_date).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit'
            })
          };
        }
        
        const unit = units.find(u => u.id === reading.cold_storage_unit_id);
        if (unit) {
          acc[timeKey][unit.name] = reading.temperature;
        }
        
        return acc;
      }, {} as Record<string, { time: string; displayTime: string; [key: string]: string | number }>);

    return Object.values(timeGroups)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [readings, units]);

  const activeUnits = useMemo(() => {
    return units.filter(unit => 
      readings.some(reading => reading.cold_storage_unit_id === unit.id)
    );
  }, [units, readings]);

  if (readings.length === 0 || activeUnits.length === 0) {
    return (
      <Box sx={{ 
        height: 300, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2
      }}>
        <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500' }}>
          <ShowChart />
        </Avatar>
        <Typography color="text.secondary">
          Aucune donnée disponible pour le graphique
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: '#00bcd420', color: '#00bcd4' }}>
          <ShowChart />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Courbes de Température par Enceinte
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Évolution temporelle des {activeUnits.length} enceinte{activeUnits.length > 1 ? 's' : ''} active{activeUnits.length > 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>
      
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="displayTime" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [`${value}°C`, name]}
            labelFormatter={(label: string) => `Temps: ${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '14px' }}
          />
          
          {activeUnits.map((unit, index) => (
            <Line
              key={unit.id}
              type="monotone"
              dataKey={unit.name}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
              connectNulls={false}
              name={`${unit.name} (${unit.location})`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}