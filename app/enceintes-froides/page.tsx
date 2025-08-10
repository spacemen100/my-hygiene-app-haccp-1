'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CardHeader,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AcUnit as SnowflakeIcon,
  Thermostat as ThermometerIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ColdChamber {
  id: string;
  name: string;
  location: string;
  min_temperature: number;
  max_temperature: number;
  is_active: boolean;
  last_reading?: {
    temperature: number;
    reading_time: string;
    is_alert: boolean;
  };
}

export default function EnceintesFroidesPage() {
  const [chambers, setChambers] = useState<ColdChamber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les enceintes froides
        const { data: coldStorageData, error: coldStorageError } = await supabase
          .from('cold_storage_units')
          .select('*')
          .eq('is_active', true);
        
        if (coldStorageError) throw coldStorageError;

        // Récupérer les derniers relevés pour chaque enceinte
        const chambersWithReadings = await Promise.all(
          coldStorageData.map(async (chamber) => {
            const { data: readingData, error: readingError } = await supabase
              .from('cold_storage_temperature_readings')
              .select('temperature, reading_date, is_compliant')
              .eq('cold_storage_unit_id', chamber.id)
              .order('reading_date', { ascending: false })
              .limit(1);
            
            if (readingError) throw readingError;
            
            return {
              ...chamber,
              last_reading: readingData[0] ? {
                temperature: readingData[0].temperature,
                reading_time: readingData[0].reading_date,
                is_alert: !readingData[0].is_compliant
              } : undefined
            };
          })
        );

        setChambers(chambersWithReadings);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();

    // Configurer un abonnement en temps réel pour les nouvelles lectures
    const subscription = supabase
      .channel('temperature_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cold_storage_temperature_readings'
        },
        (payload) => {
          setChambers(prevChambers => 
            prevChambers.map(chamber => 
              chamber.id === payload.new.cold_storage_unit_id
                ? {
                    ...chamber,
                    last_reading: {
                      temperature: payload.new.temperature,
                      reading_time: payload.new.reading_date,
                      is_alert: !payload.new.is_compliant
                    }
                  }
                : chamber
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Fonction pour déterminer le statut d'une chambre
  const getChamberStatus = (chamber: ColdChamber) => {
    if (!chamber.last_reading) return 'disconnected';
    if (chamber.last_reading.is_alert) return 'alert';
    const temp = chamber.last_reading.temperature;
    if (temp < chamber.min_temperature || temp > chamber.max_temperature) return 'warning';
    return 'normal';
  };

  // Fonction pour formater la date
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Pas de données';
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `Il y a ${diffInSeconds} secondes`;
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} minutes`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} heures`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;
  };

  // Calcul des statistiques
  const totalChambers = chambers.length;
  const normalChambers = chambers.filter(chamber => 
    chamber.last_reading && getChamberStatus(chamber) === 'normal'
  ).length;
  const warningChambers = chambers.filter(chamber => 
    chamber.last_reading && getChamberStatus(chamber) === 'warning'
  ).length;
  const alertChambers = chambers.filter(chamber => 
    chamber.last_reading && getChamberStatus(chamber) === 'alert'
  ).length;
  const averageTemp = chambers.reduce((sum, chamber) => 
    sum + (chamber.last_reading?.temperature || 0), 0
  ) / chambers.filter(chamber => chamber.last_reading).length;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(to right, #0891b2, #0e7490)',
        borderRadius: '16px',
        p: 4,
        color: 'white',
        boxShadow: 3,
        mb: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '12px' }}>
            <SnowflakeIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Enceintes froides
            </Typography>
            <Typography variant="body1" sx={{ color: '#bae6fd' }}>
              Surveillance des températures en temps réel
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 4,
        '& > *': {
          flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
          minWidth: 0
        }
      }}>
        <Card sx={{ boxShadow: 2, border: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Enceintes
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {totalChambers}
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#e0f2fe' }}>
                <SnowflakeIcon sx={{ color: '#0284c7', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ boxShadow: 2, border: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Normales
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#16a34a' }}>
                  {normalChambers}
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#dcfce7' }}>
                <ThermometerIcon sx={{ color: '#16a34a', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ boxShadow: 2, border: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Alertes
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#ea580c' }}>
                  {warningChambers + alertChambers}
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#ffedd5' }}>
                <WarningIcon sx={{ color: '#ea580c', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ boxShadow: 2, border: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Moyenne
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#0d9488' }}>
                  {isNaN(averageTemp) ? 'N/A' : averageTemp.toFixed(1) + '°C'}
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#ccfbf1' }}>
                <TrendingDownIcon sx={{ color: '#0d9488', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Chambers Grid */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 4,
        '& > *': {
          flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' },
          minWidth: 0
        }
      }}>
        {chambers.map((chamber) => {
          const status = getChamberStatus(chamber);
          const hasReading = !!chamber.last_reading;
          const targetTemp = (chamber.min_temperature + chamber.max_temperature) / 2;
          const tempRange = chamber.max_temperature - chamber.min_temperature;
          
          // Calcul du pourcentage pour la barre de progression
          let progressPercent = 50;
          if (hasReading && tempRange > 0) {
            const tempDiff = chamber.last_reading!.temperature - chamber.min_temperature;
            progressPercent = (tempDiff / tempRange) * 100;
          }

          return (
            <Card key={chamber.id} sx={{
              boxShadow: 3,
              transition: 'all 0.2s',
              ...(status === 'warning' ? { 
                border: '1px solid #fed7aa',
                backgroundColor: 'rgba(254, 215, 170, 0.1)'
              } : status === 'alert' ? {
                border: '1px solid #fecaca',
                backgroundColor: 'rgba(254, 202, 202, 0.1)'
              } : status === 'disconnected' ? {
                border: '1px solid #d1d5db',
                backgroundColor: 'rgba(209, 213, 219, 0.1)'
              } : { '&:hover': { boxShadow: 6 } })
            }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component="div">
                        {chamber.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {chamber.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: 
                          status === 'normal' ? '#16a34a' :
                          status === 'warning' ? '#ea580c' : 
                          status === 'alert' ? '#dc2626' : '#6b7280'
                      }} />
                    </Box>
                  </Box>
                }
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        {hasReading ? `${chamber.last_reading!.temperature.toFixed(1)}°C` : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Température actuelle
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" component="div">
                        {targetTemp.toFixed(1)}°C
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Consigne
                      </Typography>
                    </Box>
                  </Box>
                  {hasReading ? (
                    <>
                      <Box sx={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: 8 }}>
                        <Box sx={{
                          height: '100%',
                          borderRadius: '9999px',
                          backgroundColor: 
                            status === 'normal' ? '#16a34a' :
                            status === 'warning' ? '#ea580c' : 
                            status === 'alert' ? '#dc2626' : '#6b7280',
                          width: `${Math.min(100, Math.max(0, progressPercent))}%`
                        }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                        {formatTimeAgo(chamber.last_reading!.reading_time)}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                      Aucune donnée de température disponible
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Temperature History */}
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div">
              Historique des températures
            </Typography>
          }
          subheader="Évolution des températures sur les dernières 24h"
        />
        <CardContent>
          <Box sx={{
            height: 256,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #e5e7eb',
            borderRadius: '12px'
          }}>
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <TrendingDownIcon sx={{ fontSize: 48, opacity: 0.5, mx: 'auto', mb: 2 }} />
              <Typography>Graphique des températures</Typography>
              <Typography variant="caption">À implémenter avec les données historiques</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}