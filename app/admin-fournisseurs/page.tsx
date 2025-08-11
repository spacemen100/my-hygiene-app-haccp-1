"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/src/types/database';
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
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

type Supplier = Tables<'suppliers'>;
type SupplierInsert = TablesInsert<'suppliers'>;
type SupplierUpdate = TablesUpdate<'suppliers'>;

export default function AdminFournisseursPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<SupplierInsert>({
    name: '',
    address: null,
    phone: null,
    email: null,
    contact_person: null,
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des fournisseurs:', err);
      setError('Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (supplier: Supplier | null = null) => {
    // Réinitialiser les alertes au moment d'ouvrir le dialogue
    setError(null);
    setSuccess(null);
    
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        address: supplier.address,
        phone: supplier.phone,
        email: supplier.email,
        contact_person: supplier.contact_person,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        address: null,
        phone: null,
        email: null,
        contact_person: null,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSupplier(null);
    // Ne pas réinitialiser les alertes ici pour les laisser visibles
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.name.trim()) {
        setError('Le nom du fournisseur est obligatoire');
        return;
      }

      // Validate email format if provided
      if (formData.email && formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError('Format d\'email invalide');
          return;
        }
      }

      if (editingSupplier) {
        // Update existing supplier
        const { error } = await supabase
          .from('suppliers')
          .update(formData as SupplierUpdate)
          .eq('id', editingSupplier.id);

        if (error) throw error;
        setSuccess('Fournisseur mis à jour avec succès');
      } else {
        // Create new supplier
        const { error } = await supabase
          .from('suppliers')
          .insert([formData]);

        if (error) throw error;
        setSuccess('Fournisseur créé avec succès');
      }

      await loadSuppliers();
      // Fermer le modal immédiatement après le succès
      handleCloseDialog();
      
      // Auto-masquer l'alerte de succès après 3 secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;

    try {
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete.id);

      if (error) throw error;

      setSuccess('Fournisseur supprimé avec succès');
      await loadSuppliers();
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
      
      // Auto-masquer l'alerte de succès après 3 secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
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
          background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
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
              Administration des Fournisseurs
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Gestion des fournisseurs - Créer, modifier et supprimer
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Alerts */}
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Fournisseurs
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {suppliers.length}
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
                  {suppliers.filter(s => s.email).length}
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
                  {suppliers.filter(s => s.phone).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Avec Contact
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {suppliers.filter(s => s.contact_person).length}
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
          Nouveau Fournisseur
        </Button>
      </Box>

      {/* Suppliers Table */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Adresse</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Téléphone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Personne de contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date de création</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <BusinessIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {supplier.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {supplier.address ? (
                          <>
                            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {supplier.address}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {supplier.phone ? (
                          <>
                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{supplier.phone}</Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {supplier.email ? (
                          <>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{supplier.email}</Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {supplier.contact_person ? (
                          <>
                            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{supplier.contact_person}</Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(supplier.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(supplier)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSupplierToDelete(supplier);
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
                {suppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Aucun fournisseur trouvé
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
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {editingSupplier ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, pt: 1 }}>
            <TextField
              label="Nom du fournisseur *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
            />

            <TextField
              label="Personne de contact"
              value={formData.contact_person || ''}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value || null })}
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
              sx={{ gridColumn: '1 / -1' }}
            />

            <TextField
              label="Adresse"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
              fullWidth
              multiline
              rows={3}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>
            {editingSupplier ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le fournisseur &quot;{supplierToDelete?.name}&quot; ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible et supprimera également toutes les données liées à ce fournisseur.
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