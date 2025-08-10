'use client';
import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import { Thermostat as TemperatureIcon, Add, Edit, Delete } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/supabase';

export default function ColdStoragePage() {
  const [coldStorageUnits, setColdStorageUnits] = useState<Tables<'cold_storage_units'>[]>([]);
  const [temperatureReadings, setTemperatureReadings] = useState<Tables<'cold_storage_temperature_readings'>[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentReading, setCurrentReading] = useState<Partial<Tables<'cold_storage_temperature_readings'>>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchColdStorageUnits();
    fetchTemperatureReadings();
  }, []);

  const fetchColdStorageUnits = async () => {
    const { data, error } = await supabase
      .from('cold_storage_units')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setError('Erreur lors du chargement des enceintes froides');
      console.error(error);
    } else {
      setColdStorageUnits(data || []);
    }
  };

  const fetchTemperatureReadings = async () => {
    const { data, error } = await supabase
      .from('cold_storage_temperature_readings')
      .select('*, cold_storage_units(name)')
      .order('reading_date', { ascending: false });

    if (error) {
      setError('Erreur lors du chargement des relevés de température');
      console.error(error);
    } else {
      setTemperatureReadings(data || []);
    }
  };

  const handleAddReading = () => {
    setCurrentReading({
      reading_date: new Date().toISOString().split('T')[0],
      is_compliant: true,
    });
    setOpenDialog(true);
  };

  const handleEditReading = (reading: Tables<'cold_storage_temperature_readings'>) => {
    setCurrentReading(reading);
    setOpenDialog(true);
  };

  const handleDeleteReading = async (id: string) => {
    const { error } = await supabase
      .from('cold_storage_temperature_readings')
      .delete()
      .eq('id', id);

    if (error) {
      setError('Erreur lors de la suppression du relevé');
      console.error(error);
    } else {
      setSuccess('Relevé supprimé avec succès');
      fetchTemperatureReadings();
    }
  };

  const handleSubmit = async () => {
    try {
      if (currentReading.id) {
        // Mise à jour
        const { error } = await supabase
          .from('cold_storage_temperature_readings')
          .update(currentReading)
          .eq('id', currentReading.id);

        if (error) throw error;
        setSuccess('Relevé mis à jour avec succès');
      } else {
        // Création
        const { error } = await supabase
          .from('cold_storage_temperature_readings')
          .insert([currentReading]);

        if (error) throw error;
        setSuccess('Relevé enregistré avec succès');
      }

      setOpenDialog(false);
      fetchTemperatureReadings();
    } catch (error) {
      setError('Erreur lors de l\'enregistrement du relevé');
      console.error(error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentReading({});
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
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
            <TemperatureIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              Relevés des températures des enceintes froides
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Enregistrement et suivi des températures des chambres froides et réfrigérateurs
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Historique des relevés
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddReading}
            >
              Nouveau relevé
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Enceinte froide</TableCell>
                  <TableCell align="right">Température (°C)</TableCell>
                  <TableCell>Conforme</TableCell>
                  <TableCell>Commentaires</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {temperatureReadings.map((reading) => (
                  <TableRow key={reading.id}>
                    <TableCell>{new Date(reading.reading_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {reading.cold_storage_units ? (reading.cold_storage_units as unknown as { name: string }).name : 'N/A'}
                    </TableCell>
                    <TableCell align="right">{reading.temperature}</TableCell>
                    <TableCell>
                      {reading.is_compliant ? (
                        <Typography color="success.main">Conforme</Typography>
                      ) : (
                        <Typography color="error.main">Non conforme</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{reading.comments}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditReading(reading)}>
                        <Edit color="primary" />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteReading(reading.id)}>
                        <Delete color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog pour ajouter/modifier un relevé */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentReading.id ? 'Modifier le relevé' : 'Nouveau relevé de température'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Date du relevé"
              type="date"
              value={currentReading.reading_date || ''}
              onChange={(e) => setCurrentReading({ ...currentReading, reading_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              select
              label="Enceinte froide"
              value={currentReading.cold_storage_unit_id || ''}
              onChange={(e) => setCurrentReading({ ...currentReading, cold_storage_unit_id: e.target.value })}
              fullWidth
            >
              {coldStorageUnits.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name} ({unit.location}) - {unit.min_temperature}°C à {unit.max_temperature}°C
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Température (°C)"
              type="number"
              value={currentReading.temperature || ''}
              onChange={(e) => setCurrentReading({ ...currentReading, temperature: Number(e.target.value) })}
              fullWidth
              inputProps={{ step: '0.1' }}
            />

            <TextField
              select
              label="Conformité"
              value={currentReading.is_compliant ? 'true' : 'false'}
              onChange={(e) => setCurrentReading({ ...currentReading, is_compliant: e.target.value === 'true' })}
              fullWidth
            >
              <MenuItem value="true">Conforme</MenuItem>
              <MenuItem value="false">Non conforme</MenuItem>
            </TextField>

            <TextField
              label="Commentaires"
              multiline
              rows={3}
              value={currentReading.comments || ''}
              onChange={(e) => setCurrentReading({ ...currentReading, comments: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={handleCloseSnackbar}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={handleCloseSnackbar}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}