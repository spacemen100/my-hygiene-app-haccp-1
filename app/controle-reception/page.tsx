'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Assignment as ClipboardCheck,
  Inventory2,
  CheckCircle,
  Warning,
  Add,
  Circle,
} from '@mui/icons-material';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types basés sur votre schéma de base de données
type Supplier = {
  id: string;
  name: string;
};

type ProductReceptionControl = {
  id: string;
  temperature: number | null;
  is_compliant: boolean;
};

type Delivery = {
  id: string;
  delivery_number: string | null;
  delivery_date: string;
  is_compliant: boolean | null;
  supplier: Supplier | null;
  product_reception_controls: ProductReceptionControl[];
};

type DeliveryStats = {
  today: number;
  approved: number;
  pending: number;
};

export default function ControleReceptionPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [recentControls, setRecentControls] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DeliveryStats>({
    today: 0,
    approved: 0,
    pending: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'utilisateur actuel
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Erreur d\'authentification:', userError);
          router.push('/login');
          return;
        }
        
        if (!user) {
          console.log('Utilisateur non connecté, redirection vers login');
          router.push('/login');
          return;
        }

        // Récupérer les livraisons récentes avec les fournisseurs et contrôles associés
        const today = new Date().toISOString().split('T')[0];
        
        const { data: deliveries, error: deliveriesError } = await supabase
          .from('deliveries')
          .select(`
            id,
            delivery_number,
            delivery_date,
            is_compliant,
            supplier:suppliers!deliveries_supplier_id_fkey (
              id,
              name
            ),
            product_reception_controls (
              id,
              temperature,
              is_compliant
            )
          `)
          .order('delivery_date', { ascending: false })
          .limit(10);

        if (deliveriesError) {
          console.error('Erreur lors du chargement des livraisons:', deliveriesError);
          throw deliveriesError;
        }

        console.log('Livraisons récupérées:', deliveries);
        
        // Formatter les données pour correspondre au type attendu
        const formattedDeliveries: Delivery[] = (deliveries || []).map(delivery => ({
          id: delivery.id,
          delivery_number: delivery.delivery_number,
          delivery_date: delivery.delivery_date,
          is_compliant: delivery.is_compliant,
          supplier: delivery.supplier,
          product_reception_controls: delivery.product_reception_controls || []
        }));

        setRecentControls(formattedDeliveries);

        // Calculer les statistiques
        const todayDeliveries = formattedDeliveries.filter(d => 
          d.delivery_date?.startsWith(today)
        ).length;
        
        const approvedDeliveries = formattedDeliveries.filter(d => 
          d.is_compliant === true
        ).length;
        
        const pendingDeliveries = formattedDeliveries.filter(d => 
          d.is_compliant === null
        ).length;

        setStats({
          today: todayDeliveries,
          approved: approvedDeliveries,
          pending: pendingDeliveries,
        });

        console.log('Statistiques calculées:', {
          today: todayDeliveries,
          approved: approvedDeliveries,
          pending: pendingDeliveries
        });

      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  const handleCloseSnackbar = () => {
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 56,
              height: 56,
            }}
          >
            <ClipboardCheck sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              Contrôle à réception
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Vérification qualité des marchandises
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Quick Stats */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 4,
        '& > *': {
          flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' },
          minWidth: 0
        }
      }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Aujourd&apos;hui
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                  {stats.today}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: '#2196f320',
                  color: '#2196f3',
                  width: 56,
                  height: 56,
                }}
              >
                <Inventory2 />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Approuvés
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                  {stats.approved}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: '#4caf5020',
                  color: '#4caf50',
                  width: 56,
                  height: 56,
                }}
              >
                <CheckCircle />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  En attente
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                  {stats.pending}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: '#ff980020',
                  color: '#ff9800',
                  width: 56,
                  height: 56,
                }}
              >
                <Warning />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* New Control Button */}
      <Link href="/controle-reception/nouveau" passHref>
        <Card
          sx={{
            mb: 4,
            border: '2px dashed',
            borderColor: 'primary.light',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                width: 72,
                height: 72,
                mx: 'auto',
                mb: 2,
              }}
            >
              <Add sx={{ fontSize: 36 }} />
            </Avatar>
            <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
              Nouveau contrôle à réception
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Cliquez pour démarrer un nouveau contrôle qualité
            </Typography>
          </CardContent>
        </Card>
      </Link>

      {/* Recent Controls */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Contrôles récents
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Historique des derniers contrôles effectués
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {recentControls.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Aucun contrôle trouvé
            </Typography>
          ) : (
            <List>
              {recentControls.map((control) => {
                // Calculer la température moyenne
                const temperatures = control.product_reception_controls
                  ?.filter(prc => prc.temperature !== null)
                  ?.map(prc => prc.temperature!) || [];
                
                const avgTemp = temperatures.length > 0
                  ? (temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length).toFixed(1)
                  : 'N/A';

                return (
                  <ListItem
                    key={control.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    secondaryAction={
                      <Button 
                        size="small" 
                        onClick={() => router.push(`/controle-reception/${control.id}`)}
                      >
                        Détails
                      </Button>
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
                      <Circle
                        sx={{
                          fontSize: 12,
                          color: 
                            control.is_compliant === true ? 'success.main' :
                            control.is_compliant === false ? 'error.main' : 'warning.main'
                        }}
                      />
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {control.delivery_number || `Livraison ${control.id.slice(0, 6)}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {control.supplier?.name || 'Fournisseur inconnu'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {avgTemp}°C
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Température
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {new Date(control.delivery_date).toLocaleDateString('fr-FR')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Date
                              </Typography>
                            </Box>
                            <Chip
                              label={
                                control.is_compliant === true ? 'Approuvé' :
                                control.is_compliant === false ? 'Rejeté' : 'En attente'
                              }
                              color={
                                control.is_compliant === true ? 'success' :
                                control.is_compliant === false ? 'error' : 'warning'
                              }
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}