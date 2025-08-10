"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelledIcon,
} from '@mui/icons-material';

type Employee = Tables<'employees'>;
type EmployeeInsert = TablesInsert<'employees'>;
type EmployeeUpdate = TablesUpdate<'employees'>;

const ROLES = [
  'Manager',
  'Chef de cuisine', 
  'Cuisinier',
  'Commis de cuisine',
  'Serveur',
  'Réceptionnaire',
  'Agent de nettoyage',
  'Responsable qualité',
  'Autre'
];

export default function AdminEmployesPage() {
  console.log('[AdminEmployes] Component rendering');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { employee: currentEmployee } = useEmployee();
  
  console.log('[AdminEmployes] Current employee:', currentEmployee);
  console.log('[AdminEmployes] Loading state:', loading);
  console.log('[AdminEmployes] Employees count:', employees.length);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<EmployeeInsert>({
    first_name: '',
    last_name: '',
    role: null,
    is_active: true,
    organization_id: '',
  });

  const loadEmployees = useCallback(async () => {
    console.log('[AdminEmployes] loadEmployees called with org ID:', currentEmployee?.organization_id);
    
    try {
      console.log('[AdminEmployes] Starting to load employees...');
      setLoading(true);
      setError(null);

      if (!currentEmployee?.organization_id) {
        console.log('[AdminEmployes] No organization ID, setting empty employees list');
        setEmployees([]);
        return;
      }

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', currentEmployee.organization_id)
        .order('last_name')
        .order('first_name');

      console.log('[AdminEmployes] Supabase response:', { data, error });
      
      if (error) throw error;
      setEmployees(data || []);
      console.log('[AdminEmployes] Employees loaded successfully, count:', data?.length || 0);
    } catch (err) {
      console.error('[AdminEmployes] Error loading employees:', err);
      setError('Erreur lors du chargement des employés');
    } finally {
      console.log('[AdminEmployes] Setting loading to false');
      setLoading(false);
    }
  }, [currentEmployee?.organization_id]);

  useEffect(() => {
    console.log('[AdminEmployes] useEffect triggered with:', {
      organizationId: currentEmployee?.organization_id,
      hasCurrentEmployee: !!currentEmployee
    });
    
    // Toujours charger les employés, même sans organisation
    loadEmployees();
    
    if (currentEmployee?.organization_id) {
      console.log('[AdminEmployes] Setting form data with org ID');
      setFormData(prev => ({ ...prev, organization_id: currentEmployee.organization_id }));
    } else {
      console.log('[AdminEmployes] No organization ID available, will need to create first employee');
    }
  }, [currentEmployee?.organization_id, loadEmployees, currentEmployee]);


  const handleOpenDialog = (employee: Employee | null = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        role: employee.role,
        is_active: employee.is_active ?? true,
        organization_id: employee.organization_id,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        first_name: '',
        last_name: '',
        role: null,
        is_active: true,
        organization_id: currentEmployee?.organization_id || '', // Peut être vide
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEmployee(null);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.first_name.trim()) {
        setError('Le prénom est obligatoire');
        return;
      }

      if (!formData.last_name.trim()) {
        setError('Le nom de famille est obligatoire');
        return;
      }

      // Si pas d'organisation, créer une organisation par défaut
      let organizationId = formData.organization_id;
      if (!organizationId) {
        console.log('[AdminEmployes] No organization, creating default one');
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert([{ name: 'Organisation par défaut', description: 'Créée automatiquement' }])
          .select()
          .single();
        
        if (orgError) {
          console.error('[AdminEmployes] Error creating organization:', orgError);
          setError('Erreur lors de la création de l\'organisation');
          return;
        }
        
        organizationId = orgData.id;
        console.log('[AdminEmployes] Created organization with ID:', organizationId);
      }

      if (editingEmployee) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update({ ...formData, organization_id: organizationId } as EmployeeUpdate)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        setSuccess('Employé mis à jour avec succès');
      } else {
        // Create new employee
        const { error } = await supabase
          .from('employees')
          .insert([{ ...formData, organization_id: organizationId }]);

        if (error) throw error;
        setSuccess('Employé créé avec succès');
      }

      await loadEmployees();
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    try {
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeToDelete.id);

      if (error) throw error;

      setSuccess('Employé supprimé avec succès');
      await loadEmployees();
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getEmployeeFullName = (employee: Employee) => {
    return `${employee.first_name} ${employee.last_name}`;
  };

  if (loading) {
    console.log('[AdminEmployes] Rendering loading state');
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  console.log('[AdminEmployes] Rendering main content');

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
            <PeopleIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Administration des Employés
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Gestion des employés - Créer, modifier et supprimer
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
      
      {!currentEmployee && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Première utilisation ?</strong> Créez votre premier employé pour commencer à utiliser le système.
            Une organisation sera automatiquement créée pour vous.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Employés
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {employees.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <CheckCircleIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Actifs
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {employees.filter(e => e.is_active).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <CancelledIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Inactifs
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {employees.filter(e => !e.is_active).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <WorkIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Avec Rôle
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {employees.filter(e => e.role).length}
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
          Nouvel Employé
        </Button>
      </Box>

      {/* Employees Table */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Employé</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Rôle</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date de création</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {getEmployeeFullName(employee)}
                          </Typography>
                          {employee.user_id && (
                            <Typography variant="caption" color="text.secondary">
                              Compte utilisateur lié
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {employee.role ? (
                        <Chip
                          label={employee.role}
                          size="small"
                          sx={{ bgcolor: 'primary.50', color: 'primary.main' }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.is_active ? 'Actif' : 'Inactif'}
                        size="small"
                        color={employee.is_active ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(employee.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(employee)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEmployeeToDelete(employee);
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
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Aucun employé trouvé
                      </Typography>
                      {!currentEmployee && (
                        <Typography variant="body2" color="text.secondary">
                          Cliquez sur &quot;Nouvel Employé&quot; pour créer votre premier employé
                        </Typography>
                      )}
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
          {editingEmployee ? 'Modifier l\'Employé' : 'Nouvel Employé'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, pt: 1 }}>
            <TextField
              label="Prénom *"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              fullWidth
            />

            <TextField
              label="Nom de famille *"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value || null })}
                label="Rôle"
              >
                <MenuItem value="">
                  <em>Aucun rôle</em>
                </MenuItem>
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                label="Statut"
              >
                <MenuItem value="true">Actif</MenuItem>
                <MenuItem value="false">Inactif</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>
            {editingEmployee ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l&apos;employé &quot;{employeeToDelete ? getEmployeeFullName(employeeToDelete) : ''}&quot; ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible et supprimera également toutes les données liées à cet employé.
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