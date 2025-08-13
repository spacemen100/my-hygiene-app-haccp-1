'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Paper,
} from '@mui/material';
import {
  ErrorOutline,
  Home,
} from '@mui/icons-material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box sx={{ 
      flexGrow: 1,
      width: '100%',
      maxWidth: '100%',
      mx: 'auto',
      p: 0,
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Card sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '600px', md: '700px' },
        mx: { xs: '-0.75rem', sm: 'auto' },
        borderRadius: { xs: 0, sm: 2, md: 3 },
        boxShadow: { xs: 'none', sm: 2, md: 4 }
      }}>
        <CardContent sx={{ 
          p: { xs: '2rem 1.5rem', sm: '3rem 2.5rem', md: '4rem 3rem' },
          textAlign: 'center'
        }}>
          {/* Error Icon */}
          <Avatar
            sx={{
              bgcolor: '#ff980015',
              color: '#ff9800',
              width: { xs: 80, sm: 96, md: 120 },
              height: { xs: 80, sm: 96, md: 120 },
              mx: 'auto',
              mb: { xs: 3, md: 4 },
              boxShadow: '0 8px 25px rgba(255, 152, 0, 0.2)',
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' }
              }
            }}
          >
            <ErrorOutline />
          </Avatar>

          {/* 404 Title */}
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{ 
              fontWeight: 800,
              fontSize: { 
                xs: '4rem',
                sm: '5rem', 
                md: '6rem',
                lg: '7rem'
              },
              lineHeight: 0.8,
              color: '#ff9800',
              mb: { xs: 1, md: 2 },
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            404
          </Typography>

          {/* Page Not Found */}
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.25rem' },
              color: 'text.primary',
              mb: { xs: 2, md: 3 },
              lineHeight: 1.2
            }}
          >
            Page non trouvée
          </Typography>

          {/* Description */}
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6,
              mb: { xs: 3, md: 4 },
              maxWidth: '500px',
              mx: 'auto'
            }}
          >
            La page que vous recherchez n'existe pas ou a été déplacée. 
            Veuillez vérifier l'adresse ou retourner à l'accueil.
          </Typography>

          {/* Back to Home Button */}
          <Button
            component={Link}
            href="/"
            variant="contained"
            size="large"
            startIcon={<Home />}
            sx={{
              px: { xs: 3, md: 4 },
              py: { xs: 1.5, md: 2 },
              fontSize: { xs: '1rem', md: '1.125rem' },
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
              },
              '&:active': {
                transform: 'translateY(0px)',
              }
            }}
          >
            Retour à l'accueil
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}