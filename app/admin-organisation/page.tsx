"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/src/types/database';
// import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

type Organization = Tables<'organizations'>;
type OrganizationInsert = TablesInsert<'organizations'>;
type OrganizationUpdate = TablesUpdate<'organizations'>;

export default function AdminOrganisationPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [incomingMessage, setIncomingMessage] = useState<{type: 'info' | 'error' | 'success', message: string} | null>(null);
  // const { employee: currentEmployee } = useEmployee();
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<OrganizationInsert>({
    name: '',
    address: null,
    city: null,
    zip_code: null,
    country: null,
    phone: null,
    email: null,
    user_id: null,
  });

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setOrganizations(data || []);
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError('Erreur lors du chargement des organisations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
    
    // Vérifier s'il y a un message depuis la page employés
    const messageData = localStorage.getItem('organizationMessage');
    if (messageData) {
      try {
        const message = JSON.parse(messageData);
        setIncomingMessage(message);
        localStorage.removeItem('organizationMessage');
        
        // Ouvrir automatiquement le dialog de création si le message vient des employés
        if (message.type === 'info') {
          setTimeout(() => {
            handleOpenDialog();
          }, 1000);
        }
      } catch (err) {
        console.error('Error parsing organization message:', err);
      }
    }
  }, [loadOrganizations]);

  const handleOpenDialog = (organization: Organization | null = null) => {
    if (organization) {
      setEditingOrganization(organization);
      setFormData({
        name: organization.name,
        address: organization.address,
        city: organization.city,
        zip_code: organization.zip_code,
        country: organization.country,
        phone: organization.phone,
        email: organization.email,
        user_id: organization.user_id,
      });
    } else {
      setEditingOrganization(null);
      setFormData({
        name: '',
        address: null,
        city: null,
        zip_code: null,
        country: null,
        phone: null,
        email: null,
        user_id: null,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOrganization(null);
    // Ne pas réinitialiser les messages d'erreur/succès ici pour qu'ils restent visibles
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.name.trim()) {
        setError('Le nom de l\'organisation est obligatoire');
        return;
      }

      if (editingOrganization) {
        // Update existing organization
        const { error } = await supabase
          .from('organizations')
          .update(formData as OrganizationUpdate)
          .eq('id', editingOrganization.id);

        if (error) throw error;
        setSuccess('Organisation mise à jour avec succès');
      } else {
        // Create new organization
        const { error } = await supabase
          .from('organizations')
          .insert([{
            ...formData,
            user_id: user?.id || null
          }]);

        if (error) throw error;
        setSuccess('Organisation créée avec succès');
      }

      await loadOrganizations();
      handleCloseDialog();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!organizationToDelete) return;

    try {
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationToDelete.id);

      if (error) throw error;

      setSuccess('Organisation supprimée avec succès');
      await loadOrganizations();
      setDeleteDialogOpen(false);
      setOrganizationToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BusinessIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Administration des Organisations
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Gestion des organisations - Créer, modifier et supprimer
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Alerts */}
      {incomingMessage && (
        <Alert severity={incomingMessage.type} sx={{ mb: 3 }} onClose={() => setIncomingMessage(null)}>
          {incomingMessage.message}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Organisations
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {organizations.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <EmailIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Avec Email
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {organizations.filter(org => org.email).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <PhoneIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Avec Téléphone
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {organizations.filter(org => org.phone).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Add Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            px: 3, 
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          Nouvelle Organisation
        </Button>
      </Box>

      {/* Organizations Table */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Organisation</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Adresse</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date de création</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map((organization) => (
                  <TableRow key={organization.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <BusinessIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {organization.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {organization.address && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 14 }} />
                            {organization.address}
                          </Typography>
                        )}
                        {(organization.city || organization.zip_code) && (
                          <Typography variant="body2" color="text.secondary">
                            {organization.zip_code} {organization.city}
                          </Typography>
                        )}
                        {organization.country && (
                          <Typography variant="body2" color="text.secondary">
                            {organization.country}
                          </Typography>
                        )}
                        {!organization.address && !organization.city && !organization.zip_code && !organization.country && (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {organization.phone && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14 }} />
                            {organization.phone}
                          </Typography>
                        )}
                        {organization.email && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 14 }} />
                            {organization.email}
                          </Typography>
                        )}
                        {!organization.phone && !organization.email && (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(organization.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(organization)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setOrganizationToDelete(organization);
                            setDeleteDialogOpen(true);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {organizations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Aucune organisation trouvée
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cliquez sur &quot;Nouvelle Organisation&quot; pour créer votre première organisation
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {editingOrganization ? 'Modifier l\'Organisation' : 'Nouvelle Organisation'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, pt: 1 }}>
            <TextField
              label="Nom de l'organisation *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
            />

            <TextField
              label="Adresse"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
              fullWidth
              multiline
              rows={2}
              sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
            />

            <TextField
              label="Ville"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
              fullWidth
            />

            <TextField
              label="Code postal"
              value={formData.zip_code || ''}
              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value || null })}
              fullWidth
            />

            <TextField
              label="Pays"
              value={formData.country || ''}
              onChange={(e) => setFormData({ ...formData, country: e.target.value || null })}
              fullWidth
            />

            <TextField
              label="Téléphone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
              fullWidth
              sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>
            {editingOrganization ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            {`Êtes-vous sûr de vouloir supprimer l'organisation "${organizationToDelete?.name}" ?`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible et supprimera également toutes les données liées à cette organisation.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}