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
  Chip
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Person as PersonIcon,
  PersonOff as PersonOffIcon 
} from '@mui/icons-material';
import { useAuth } from './AuthProvider';
import { useEmployee, getEmployeeFullName } from '@/contexts/EmployeeContext';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { session, signOut } = useAuth();
  const { employee: currentEmployee, employees, setCurrentEmployee, loading: employeeLoading } = useEmployee();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [employeeSelectOpen, setEmployeeSelectOpen] = useState(false);
  
  // Debug logs
  console.log('[Header] Employee data:', { 
    currentEmployee: !!currentEmployee, 
    employeesCount: employees.length, 
    employeeLoading,
    employees: employees.map(e => ({ id: e.id, name: getEmployeeFullName(e) }))
  });

  const drawerWidth = 280;

  const handleEmployeeChange = (employeeId: string) => {
    const selectedEmployee = employees.find(emp => emp.id === employeeId) || null;
    setCurrentEmployee(selectedEmployee);
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        top: 0,
        left: { xs: 0, md: `${drawerWidth}px` }, // Laisse l'espace pour le sidebar sur desktop
        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }, // Ajuste la largeur
        zIndex: 1300, // Valeur explicite élevée
        m: 0,
        p: 0,
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
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
            {/* Employee Selector - Always show for debug */}
            {session && (
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: 200,
                  display: { xs: 'none', sm: 'block' },
                  zIndex: 9999,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                    '&.Mui-focused': {
                      color: 'white',
                    },
                  },
                  '& .MuiSelect-icon': {
                    color: 'white',
                  },
                }}
              >
                <InputLabel>Employé actuel</InputLabel>
                <Select
                  value={currentEmployee?.id || ''}
                  onChange={(e) => {
                    const selectedEmployee = employees.find(emp => emp.id === e.target.value);
                    setCurrentEmployee(selectedEmployee || null);
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
            
            {/* User Email */}
            <Typography variant="body1" sx={{ mr: 1, display: { xs: 'none', md: 'block' } }}>
              {session.user.email}
            </Typography>
            
            <Button color="inherit" onClick={signOut} size="small">
              Déconnexion
            </Button>
          </Box>
        ) : (
          <Button color="inherit" href="/login">
            Connexion
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
