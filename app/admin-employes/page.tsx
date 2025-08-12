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
  InputAdornment,
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
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [defaultOrganization, setDefaultOrganization] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Tables<'organizations'>[]>([]);
  const [saving, setSaving] = useState(false);
  const [customRole, setCustomRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { employee: currentEmployee, loading: employeeLoading } = useEmployee();

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
    password: '',
  });

  const loadOrganizations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setOrganizations(data || []);
      
      const { data: defaultData, error: defaultError } = await supabase
        .from('organizations')
        .select('id')
        .order('created_at')
        .limit(1)
        .single();
      
      if (defaultError && defaultError.code !== 'PGRST116') throw defaultError;
      setDefaultOrganization(defaultData?.id || null);
    } catch (err) {
      console.error('Error loading organizations:', err);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const organizationId = currentEmployee?.organization_id || defaultOrganization;
      if (!organizationId) {
        setEmployees([]);
        return;
      }

      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          organizations (
            id,
            name,
            city
          )
        `)
        .eq('organization_id', organizationId)
        .order('last_name')
        .order('first_name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  }, [currentEmployee?.organization_id, defaultOrganization]);

  useEffect(() => {
    loadOrganizations();
    
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [loadOrganizations, loading]);

  useEffect(() => {
    if (!employeeLoading && defaultOrganization !== null) {
      loadEmployees();
      
      if (!dialogOpen) {
        const organizationId = currentEmployee?.organization_id || defaultOrganization;
        if (organizationId) {
          setFormData(prev => ({ ...prev, organization_id: organizationId }));
        }
      }
    }
  }, [currentEmployee?.organization_id, defaultOrganization, loadEmployees, employeeLoading, currentEmployee, dialogOpen]);

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setFormData({ ...formData, password: newPassword });
  };

  const handleOpenDialog = (employee: Employee | null = null) => {
    setError(null);
    setSuccess(null);
    
    if (employee) {
      setEditingEmployee(employee);
      const isCustomRole = employee.role && !ROLES.includes(employee.role);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        role: isCustomRole ? 'Autre' : employee.role,
        is_active: employee.is_active ?? true,
        organization_id: employee.organization_id,
        password: '', // Ne pas afficher le mot de passe existant
      });
      setCustomRole(isCustomRole ? (employee.role || '') : '');
    } else {
      setEditingEmployee(null);
      setFormData({
        first_name: '',
        last_name: '',
        role: null,
        is_active: true,
        organization_id: currentEmployee?.organization_id || defaultOrganization || '',
        password: '',
      });
      setCustomRole('');
    }
    setDialogOpen(true);
    setShowPassword(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEmployee(null);
    setError(null);
    setCustomRole('');
    setShowPassword(false);
    
    setFormData({
      first_name: '',
      last_name: '',
      role: null,
      is_active: true,
      organization_id: currentEmployee?.organization_id || defaultOrganization || '',
      password: '',
    });
  };

  const handleSave = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!formData.first_name.trim()) {
        setError('Le prénom est obligatoire');
        setSaving(false);
        return;
      }

      if (!formData.last_name.trim()) {
        setError('Le nom de famille est obligatoire');
        setSaving(false);
        return;
      }

      if (!formData.organization_id) {
        setError('L\'organisation est obligatoire');
        setSaving(false);
        return;
      }

      if (!editingEmployee && !formData.password?.trim()) {
        setError('Le mot de passe est obligatoire pour un nouvel employé');
        setSaving(false);
        return;
      }

      if (formData.password && formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        setSaving(false);
        return;
      }

      if (formData.role === 'Autre' && !customRole.trim()) {
        setError('Veuillez spécifier le rôle personnalisé');
        setSaving(false);
        return;
      }

      const organizationId = formData.organization_id;
      const finalRole = formData.role === 'Autre' ? customRole.trim() || null : formData.role;
      
      const employeeData = {
        ...formData,
        role: finalRole,
        organization_id: organizationId
      };

      if (editingEmployee) {
        // Update existing employee - only include password if provided
        const updateData: Partial<EmployeeUpdate> = {
          first_name: employeeData.first_name,
          last_name: employeeData.last_name,
          role: employeeData.role,
          is_active: employeeData.is_active,
          organization_id: employeeData.organization_id
        };

        if (formData.password?.trim()) {
          updateData.password = formData.password;
        }

        const { error } = await supabase
          .from('employees')
          .update(updateData)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        setSuccess('Employé mis à jour avec succès');
      } else {
        // Create new employee - password is required
        const { error } = await supabase
          .from('employees')
          .insert([employeeData]);

        if (error) throw error;
        setSuccess('Employé créé avec succès');
      }

      await loadEmployees();
      handleCloseDialog();
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
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

  if (loading || employeeLoading) {
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
                  <TableCell sx={{ fontWeight: 600 }}>Organisation</TableCell>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {(employee as Employee & { organizations?: { name: string; city?: string } }).organizations?.name || 'Organisation inconnue'}
                          </Typography>
                          {(employee as Employee & { organizations?: { name: string; city?: string } }).organizations?.city && (
                            <Typography variant="caption" color="text.secondary">
                              {(employee as Employee & { organizations?: { name: string; city?: string } }).organizations?.city}
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
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                onChange={(e) => {
                  const selectedRole = e.target.value || null;
                  setFormData({ ...formData, role: selectedRole });
                  if (selectedRole !== 'Autre') {
                    setCustomRole('');
                  }
                }}
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

            {formData.role === 'Autre' && (
              <TextField
                label="Spécifiez le rôle *"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                fullWidth
                placeholder="Saisissez le rôle personnalisé"
                helperText="Veuillez spécifier le rôle de l'employé"
                sx={{
                  gridColumn: { xs: 'span 1', md: 'span 2' },
                }}
              />
            )}

            {/* Password Field */}
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, display: 'flex', gap: 2, alignItems: 'start' }}>
              <TextField
                label={editingEmployee ? "Nouveau mot de passe" : "Mot de passe *"}
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
                required={!editingEmployee}
                helperText={
                  editingEmployee 
                    ? "Laissez vide pour conserver le mot de passe actuel. Minimum 6 caractères."
                    : "Le mot de passe doit contenir au moins 6 caractères"
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                onClick={handleGeneratePassword}
                sx={{ 
                  mt: 0.5,
                  minWidth: 'auto',
                  px: 2,
                  whiteSpace: 'nowrap'
                }}
              >
                Générer
              </Button>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Organisation *</InputLabel>
              <Select
                value={formData.organization_id || ''}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                label="Organisation *"
                required
              >
                {organizations.length === 0 ? (
                  <MenuItem disabled>
                    <Typography color="text.secondary" style={{ fontStyle: 'italic' }}>
                      Aucune organisation disponible
                    </Typography>
                  </MenuItem>
                ) : (
                  organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {org.name}
                          </Typography>
                          {org.city && (
                            <Typography variant="caption" color="text.secondary">
                              {org.city}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
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
          <Button 
            variant="contained" 
            onClick={handleSave} 
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Sauvegarde...' : (editingEmployee ? 'Mettre à jour' : 'Créer')}
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