"use client";

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Alert
} from '@mui/material';
import {
  AcUnit,
  Thermostat,
  CheckCircle,
  Cancel,
  ShowChart,
  History,
  Warning
} from '@mui/icons-material';
import { Tables } from '@/src/types/database';

interface EnceinteSectionProps {
  unit: Tables<'cold_storage_units'>;
  readings: Tables<'cold_storage_temperature_readings'>[];
  loading?: boolean;
}

export default function EnceinteSection({ unit, readings, loading = false }: EnceinteSectionProps) {
  // Filtrer les lectures pour cette enceinte uniquement
  const unitReadings = useMemo(() => {
    return readings
      .filter(reading => reading.cold_storage_unit_id === unit.id)
      .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime());
  }, [readings, unit.id]);

  // Données pour le graphique (ordre chronologique)
  const chartData = useMemo(() => {
    return unitReadings
      .slice(0, 20) // Dernières 20 lectures
      .map(reading => {
        const isOutOfBounds = reading.temperature < unit.min_temperature || reading.temperature > unit.max_temperature;
        return {
          date: new Date(reading.reading_date).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          }),
          temperature: reading.temperature,
          timestamp: new Date(reading.reading_date).getTime(),
          isOutOfBounds,
          isCompliant: reading.is_compliant
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [unitReadings, unit.min_temperature, unit.max_temperature]);

  // Statistiques de l'enceinte
  const stats = useMemo(() => {
    const recentReadings = unitReadings.slice(0, 10);
    const compliantReadings = recentReadings.filter(r => r.is_compliant);
    const outOfBoundsReadings = recentReadings.filter(r => 
      r.temperature < unit.min_temperature || r.temperature > unit.max_temperature
    );
    const avgTemp = recentReadings.length > 0 ? 
      recentReadings.reduce((sum, r) => sum + r.temperature, 0) / recentReadings.length : 
      0;
    const lastReading = unitReadings[0];

    return {
      totalReadings: recentReadings.length,
      compliantReadings: compliantReadings.length,
      outOfBoundsReadings: outOfBoundsReadings.length,
      avgTemp,
      lastReading,
      complianceRate: recentReadings.length > 0 ? (compliantReadings.length / recentReadings.length) * 100 : 0,
      hasAlerts: outOfBoundsReadings.length > 0
    };
  }, [unitReadings, unit.min_temperature, unit.max_temperature]);

  const getTemperatureColor = (temp: number) => {
    return temp < unit.min_temperature || temp > unit.max_temperature ? 'error.main' : 'success.main';
  };

  // Composant personnalisé pour les points du graphique
  const CustomDot = (props: { cx?: number; cy?: number; payload?: { isOutOfBounds?: boolean } }) => {
    const { cx, cy, payload } = props;
    if (!payload || typeof cx !== 'number' || typeof cy !== 'number') return null;
    
    const isOutOfBounds = payload.isOutOfBounds;
    const color = isOutOfBounds ? '#ff5252' : '#00bcd4';
    
    return (
      <Dot 
        cx={cx} 
        cy={cy} 
        r={isOutOfBounds ? 5 : 3} 
        fill={color}
        stroke={isOutOfBounds ? '#d32f2f' : '#0097a7'}
        strokeWidth={2}
      />
    );
  };


  return (
    <Card sx={{ mb: 4, boxShadow: 3 }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header de l'enceinte */}
        <Box sx={{ 
          p: 3, 
          bgcolor: stats.hasAlerts ? 'error.main' : 'primary.main', 
          color: 'white',
          borderRadius: '4px 4px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
              {stats.hasAlerts ? <Warning /> : <AcUnit />}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {unit.name}
                </Typography>
                {stats.hasAlerts && (
                  <Warning sx={{ color: 'warning.light' }} />
                )}
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {unit.location} • {unit.type}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Plage autorisée: {unit.min_temperature}°C à {unit.max_temperature}°C
              </Typography>
            </Box>
            {stats.lastReading && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.lastReading.temperature}°C
                </Typography>
                <Chip
                  size="small"
                  icon={stats.lastReading.is_compliant ? <CheckCircle /> : <Cancel />}
                  label={stats.lastReading.is_compliant ? 'Conforme' : 'Non conforme'}
                  color={stats.lastReading.is_compliant ? 'success' : 'error'}
                  sx={{ bgcolor: 'white', color: stats.lastReading.is_compliant ? 'success.main' : 'error.main' }}
                />
              </Box>
            )}
          </Box>

          {/* Statistiques rapides */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {stats.totalReadings}
              </Typography>
              <Typography variant="caption">Lectures récentes</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {stats.complianceRate.toFixed(0)}%
              </Typography>
              <Typography variant="caption">Conformité</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {stats.avgTemp.toFixed(1)}°C
              </Typography>
              <Typography variant="caption">Température moy.</Typography>
            </Box>
          </Box>
        </Box>

        {/* Alerte pour lectures hors limites */}
        {stats.hasAlerts && (
          <Box sx={{ p: 3, pt: 0 }}>
            <Alert 
              severity="error" 
              icon={<Warning />}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '& .MuiAlert-icon': { color: 'warning.light' }
              }}
            >
              <Typography variant="body2">
                <strong>{stats.outOfBoundsReadings}</strong> lecture{stats.outOfBoundsReadings > 1 ? 's' : ''} récente{stats.outOfBoundsReadings > 1 ? 's' : ''} hors limites détectée{stats.outOfBoundsReadings > 1 ? 's' : ''}
              </Typography>
            </Alert>
          </Box>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, p: 3 }}>
          {/* Graphique */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <ShowChart />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Évolution des Températures
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dernières 20 lectures
                  </Typography>
                </Box>
              </Box>

              {loading ? (
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      label={{ value: '°C', angle: -90, position: 'insideLeft' }}
                      domain={[unit.min_temperature - 2, unit.max_temperature + 2]}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string, props: { payload?: { isOutOfBounds?: boolean } }) => {
                        const isOutOfBounds = props.payload?.isOutOfBounds;
                        return [
                          `${value}°C ${isOutOfBounds ? '⚠️ Hors limites' : '✅ Conforme'}`, 
                          'Température'
                        ];
                      }}
                      labelFormatter={(label: string) => `Temps: ${label}`}
                    />
                    
                    {/* Lignes de référence */}
                    <ReferenceLine 
                      y={unit.min_temperature} 
                      stroke="#ff5252" 
                      strokeDasharray="5 5" 
                      strokeWidth={1}
                      label={{ value: `Min: ${unit.min_temperature}°C`, position: "insideTopRight" }}
                    />
                    <ReferenceLine 
                      y={unit.max_temperature} 
                      stroke="#ff9800" 
                      strokeDasharray="5 5" 
                      strokeWidth={1}
                      label={{ value: `Max: ${unit.max_temperature}°C`, position: "insideBottomRight" }}
                    />
                    
                    {/* Ligne avec points personnalisés colorés */}
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#00bcd4"
                      strokeWidth={2}
                      dot={<CustomDot />}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  height: 250, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 1
                }}>
                  <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.500' }}>
                    <ShowChart />
                  </Avatar>
                  <Typography color="text.secondary">
                    Aucune donnée disponible
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Historique des lectures */}
          <Card variant="outlined">
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                    <History />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Historique des Lectures
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {unitReadings.length} lecture{unitReadings.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Date & Heure</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Température</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={`skeleton-${i}`}>
                          <TableCell><Skeleton variant="text" /></TableCell>
                          <TableCell><Skeleton variant="text" /></TableCell>
                          <TableCell><Skeleton variant="text" /></TableCell>
                        </TableRow>
                      ))
                    ) : unitReadings.slice(0, 10).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Aucune lecture enregistrée
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      unitReadings.slice(0, 10).map(reading => {
                        const isRecent = new Date().getTime() - new Date(reading.reading_date).getTime() < 3600000;
                        return (
                          <TableRow 
                            key={reading.id} 
                            sx={{ 
                              bgcolor: isRecent ? 'success.light' : 'inherit',
                              opacity: isRecent ? 1 : 0.8
                            }}
                          >
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {new Date(reading.reading_date).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                  })}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(reading.reading_date).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                  variant="body1" 
                                  fontWeight="bold"
                                  color={getTemperatureColor(reading.temperature)}
                                >
                                  {reading.temperature}°C
                                </Typography>
                                <Thermostat 
                                  fontSize="small" 
                                  sx={{ color: getTemperatureColor(reading.temperature) }} 
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                icon={reading.is_compliant ? <CheckCircle /> : <Cancel />}
                                label={reading.is_compliant ? 'Conforme' : 'Non conforme'}
                                color={reading.is_compliant ? 'success' : 'error'}
                                variant={reading.is_compliant ? 'outlined' : 'filled'}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </CardContent>
    </Card>
  );
}