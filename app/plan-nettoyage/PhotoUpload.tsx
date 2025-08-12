"use client";

import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  PhotoCamera,
  Delete as DeleteIcon,
  CloudUpload,
  Image as ImageIcon
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  label?: string;
}

export default function PhotoUpload({ value, onChange, disabled, label = "Photo" }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La taille de l\'image ne doit pas dépasser 5 MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `cleaning_photos/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('cleaning-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cleaning-photos')
        .getPublicUrl(data.path);

      onChange(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (value) {
      try {
        // Extract file path from URL
        const url = new URL(value);
        const filePath = url.pathname.split('/').slice(-2).join('/'); // Get last 2 parts (bucket/filename)
        
        // Delete from storage
        await supabase.storage
          .from('cleaning-photos')
          .remove([filePath]);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
    onChange(null);
    setError(null);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        ref={fileInputRef}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {value ? (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                component="img"
                src={value}
                alt="Photo uploaded"
                sx={{
                  width: 120,
                  height: 90,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'grey.300'
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                  ✓ Photo téléchargée
                </Typography>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleRemovePhoto}
                  disabled={disabled || uploading}
                >
                  Supprimer
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card 
          variant="outlined" 
          sx={{ 
            mb: 2, 
            cursor: disabled || uploading ? 'not-allowed' : 'pointer',
            '&:hover': !disabled && !uploading ? { bgcolor: 'grey.50' } : {}
          }}
          onClick={!disabled && !uploading ? handleButtonClick : undefined}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <ImageIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Aucune photo sélectionnée
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Formats acceptés: JPG, PNG, WebP (max 5 MB)
            </Typography>
            {uploading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Téléchargement en cours...
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<PhotoCamera />}
          onClick={handleButtonClick}
          disabled={disabled || uploading}
          size="small"
        >
          {value ? 'Changer la photo' : 'Sélectionner une photo'}
        </Button>
        
        {!value && (
          <Button
            variant="text"
            startIcon={<CloudUpload />}
            onClick={handleButtonClick}
            disabled={disabled || uploading}
            size="small"
          >
            Télécharger
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}