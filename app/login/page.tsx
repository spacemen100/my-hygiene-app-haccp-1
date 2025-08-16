// app/login/page.tsx
'use client';
import { useAuth } from '@/components/AuthProvider';
import { Box, Button, TextField, Typography, CircularProgress, IconButton, InputAdornment, Link } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { session, isLoading, signInWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = await signInWithEmail(email, password);
    if (error) setError(error);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        p: { xs: 1, sm: 2 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: { xs: '100%', sm: 420 },
          width: '100%',
          p: { xs: 3, sm: 4, md: 5 },
          boxShadow: { xs: 'none', sm: '0 20px 40px rgba(0,0,0,0.15)' },
          borderRadius: { xs: 0, sm: 3 },
          bgcolor: 'background.paper',
          backdropFilter: 'blur(10px)',
          border: { xs: 'none', sm: '1px solid rgba(255,255,255,0.1)' },
          minHeight: { xs: '100vh', sm: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'center', sm: 'flex-start' },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              lineHeight: 1.2
            }}
          >
            HACCP Manager
          </Typography>
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              color: 'text.secondary', 
              fontWeight: 400,
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            Connexion à votre espace
          </Typography>
        </Box>
        
        {error && (
          <Typography 
            color="error"
            sx={{ 
              mb: { xs: 2, md: 3 }, 
              textAlign: 'center', 
              p: { xs: 1.5, md: 2 }, 
              borderRadius: 1,
              border: '1px solid #ef5350',
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}
          >
            {error}
          </Typography>
        )}

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
          sx={{ mb: { xs: 1.5, md: 2 } }}
        />

        <TextField
          fullWidth
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          sx={{ mb: { xs: 2, md: 3 } }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
          size="large"
          sx={{ 
            mt: { xs: 1, md: 2 }, 
            mb: { xs: 1, md: 2 }, 
            py: { xs: 1.25, md: 1.5 },
            fontWeight: 600,
            fontSize: { xs: '1rem', md: '1.1rem' },
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            minHeight: '48px',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
        </Button>

        {/* Lien vers l'inscription */}
        <Box sx={{ textAlign: 'center', mt: { xs: 2, md: 3 }, mb: { xs: 2, md: 3 } }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Vous n&apos;avez pas de compte ?{' '}
            <Link
              href="/register"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.dark'
                }
              }}
            >
              Créez-en un ici
            </Link>
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mt: { xs: 1, md: 2 } }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
          >
            Système de gestion HACCP - Version 1.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}