// components/Header.tsx
'use client';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  useMediaQuery, 
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Person as PersonIcon,
  PersonOff as PersonOffIcon 
} from '@mui/icons-material';
import { useAuth } from './AuthProvider';
import { useEmployee, getEmployeeFullName } from '@/contexts/EmployeeContext';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { session, signOut } = useAuth();
  const { employee: currentEmployee, employees, setCurrentEmployee, loading: employeeLoading } = useEmployee();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [employeeSelectOpen, setEmployeeSelectOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedEmployeeTemp, setSelectedEmployeeTemp] = useState<typeof employees[0] | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  
  // Debug logs
  console.log('[Header] Employee data:', { 
    currentEmployee: !!currentEmployee, 
    employeesCount: employees.length, 
    employeeLoading,
    employees: employees.map(e => ({ id: e.id, name: getEmployeeFullName(e) }))
  });

  const tabletDrawerWidth = 260;
  const desktopDrawerWidth = 280;

  const handleEmployeeSelect = (selectedEmployee: typeof employees[0] | null) => {
    // Si l'employé n'a pas de mot de passe, sélectionner directement
    if (!selectedEmployee || !selectedEmployee.password) {
      setCurrentEmployee(selectedEmployee || null);
      return;
    }

    // Si l'employé a un mot de passe, ouvrir la boîte de dialogue de vérification
    setSelectedEmployeeTemp(selectedEmployee);
    setPasswordDialogOpen(true);
    setPassword('');
    setPasswordError(null);
  };

  const verifyPassword = async () => {
    if (!selectedEmployeeTemp || !password.trim()) {
      setPasswordError('Veuillez saisir le mot de passe');
      return;
    }

    setVerifyingPassword(true);
    setPasswordError(null);

    try {
      // Récupérer l'employé avec son mot de passe depuis la base de données
      const { data: employeeData, error } = await supabase
        .from('employees')
        .select('password')
        .eq('id', selectedEmployeeTemp.id)
        .single();

      if (error) throw error;

      // Comparer le mot de passe (comparaison simple - dans un vrai système, il faudrait hasher)
      if (employeeData.password === password.trim()) {
        setCurrentEmployee(selectedEmployeeTemp);
        setPasswordDialogOpen(false);
        setSelectedEmployeeTemp(null);
        setPassword('');
      } else {
        setPasswordError('Mot de passe incorrect');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      setPasswordError('Erreur lors de la vérification');
    } finally {
      setVerifyingPassword(false);
    }
  };

  const cancelPasswordDialog = () => {
    setPasswordDialogOpen(false);
    setSelectedEmployeeTemp(null);
    setPassword('');
    setPasswordError(null);
  };

  // const handleEmployeeChange = (employeeId: string) => {
  //   const selectedEmployee = employees.find(emp => emp.id === employeeId) || null;
  //   setCurrentEmployee(selectedEmployee);
  // };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        top: 0,
        left: { 
          xs: 0, 
          md: `${tabletDrawerWidth}px`,
          lg: `${desktopDrawerWidth}px`
        },
        width: { 
          xs: '100%', 
          md: `calc(100% - ${tabletDrawerWidth}px)`,
          lg: `calc(100% - ${desktopDrawerWidth}px)`
        },
        zIndex: 1300,
        m: 0,
        p: 0,
        '& .MuiToolbar-root': {
          minHeight: { xs: '56px', sm: '64px' },
          px: { xs: '0.75rem', sm: '1rem', md: '1.5rem', lg: '2rem' },
        }
      }}
    >
      <Toolbar sx={{ 
        minHeight: { xs: '56px !important', sm: '64px !important' },
        px: { xs: '0.75rem', sm: '1rem', md: '1.5rem', lg: '2rem' },
        gap: { xs: 1, sm: 1.5, md: 2 }
      }}>
        {isMobile && onMenuClick && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box sx={{ flexGrow: 1 }} />
        
        {session ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Employee Selector - Responsive */}
            {session && (
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: { sm: 160, md: 180, lg: 200 },
                  maxWidth: { sm: 180, md: 200, lg: 240 },
                  display: { xs: 'none', sm: 'block' },
                  flex: { sm: '0 1 180px', md: '0 1 200px' },
                  zIndex: 9999,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    fontSize: { sm: '0.875rem', md: '1rem' },
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: { sm: '0.8rem', md: '0.875rem' },
                    '&.Mui-focused': {
                      color: 'white',
                    },
                  },
                  '& .MuiSelect-icon': {
                    color: 'white',
                  },
                }}
              >
                <InputLabel></InputLabel>
                <Select
                  value={currentEmployee?.id || ''}
                  onChange={(e) => {
                    const selectedEmployee = employees.find(emp => emp.id === e.target.value) || null;
                    handleEmployeeSelect(selectedEmployee);
                  }}
                  label="Employé actuel"
                  open={employeeSelectOpen}
                  onOpen={() => setEmployeeSelectOpen(true)}
                  onClose={() => setEmployeeSelectOpen(false)}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        zIndex: 9999,
                        maxHeight: 300,
                        mt: 1,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        '& .MuiMenuItem-root': {
                          minHeight: 'auto',
                          py: 1,
                        },
                      },
                    },
                    MenuListProps: {
                      sx: {
                        py: 1,
                      }
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonOffIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">Aucun employé</Typography>
                        </Box>
                      );
                    }
                    const employee = employees.find(emp => emp.id === selected);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 20, height: 20, bgcolor: 'rgba(255,255,255,0.3)' }}>
                          <PersonIcon sx={{ fontSize: 12 }} />
                        </Avatar>
                        <Typography variant="body2">
                          {employee ? getEmployeeFullName(employee) : 'Aucun employé'}
                        </Typography>
                      </Box>
                    );
                  }}
                >
                  <MenuItem value="">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonOffIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography>Aucun employé sélectionné</Typography>
                    </Box>
                  </MenuItem>
                  {employees.length === 0 && (
                    <MenuItem disabled>
                      <Typography color="text.secondary" style={{ fontStyle: 'italic' }}>
                        Aucun employé trouvé
                      </Typography>
                    </MenuItem>
                  )}
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                          <PersonIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {getEmployeeFullName(employee)}
                          </Typography>
                          {employee.role && (
                            <Typography variant="caption" color="text.secondary">
                              {employee.role}
                            </Typography>
                          )}
                        </Box>
                        {employee.is_active && (
                          <Chip 
                            label="Actif" 
                            size="small" 
                            color="success" 
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.6rem' }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {/* Current Employee Display on Mobile */}
            {currentEmployee && (
              <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgba(255,255,255,0.3)' }}>
                  <PersonIcon sx={{ fontSize: 14 }} />
                </Avatar>
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {getEmployeeFullName(currentEmployee)}
                </Typography>
              </Box>
            )}
            
            {/* User Avatar with first letter */}
            <Avatar 
              sx={{ 
                width: 32,
                height: 32,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                mr: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.3)',
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              {session.user.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            
            <Button 
              color="inherit" 
              onClick={signOut} 
              size={isMobile ? "small" : "medium"}
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              {isMobile ? 'Déco' : 'Déconnexion'}
            </Button>
          </Box>
        ) : (
          <Button color="inherit" href="/login">
            Connexion
          </Button>
        )}
      </Toolbar>
      
      {/* Dialog de vérification de mot de passe */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={cancelPasswordDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Authentification requise
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedEmployeeTemp && (
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
                Veuillez saisir le mot de passe pour <strong>{getEmployeeFullName(selectedEmployeeTemp)}</strong>
              </Typography>
            )}
            
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}
            
            <TextField
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              disabled={verifyingPassword}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  verifyPassword();
                }
              }}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelPasswordDialog} disabled={verifyingPassword}>
            Annuler
          </Button>
          <Button 
            onClick={verifyPassword} 
            variant="contained"
            disabled={verifyingPassword || !password.trim()}
            startIcon={verifyingPassword ? <CircularProgress size={16} /> : null}
          >
            {verifyingPassword ? 'Vérification...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Header;
