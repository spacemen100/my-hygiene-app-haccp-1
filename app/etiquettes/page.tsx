"use client";

import { useState, useRef } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  IconButton,
  Stack
} from '@mui/material';
import { 
  PhotoCamera, 
  Delete, 
  Save, 
  CameraAlt 
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';

export default function LabelRecording() {
  const [formData, setFormData] = useState<TablesInsert<'label_records'>>({
    record_date: new Date().toISOString(),
    photo_url: '',
    product_name: '',
    supplier_name: '',
    batch_number: '',
    organization_id: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [cameraMode, setCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Fonction pour démarrer la caméra
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Caméra arrière par défaut
      });
      setStream(mediaStream);
      setCameraMode(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Erreur d accès à la caméra:", error);
      setAlert({ type: 'error', message: "Impossible d accéder à la caméra" });
    }
  };

  // Fonction pour arrêter la caméra
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraMode(false);
  };

  // Fonction pour prendre une photo
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      
      // Convertir en blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          await uploadPhoto(blob);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // Fonction pour uploader la photo vers Supabase Storage
  const uploadPhoto = async (file: File | Blob) => {
    setUploadingPhoto(true);
    try {
      // Générer un nom de fichier unique
      const fileName = `label_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('etiquettes')
        .upload(fileName, file, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('etiquettes')
        .getPublicUrl(fileName);

      // Mettre à jour le formulaire
      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
      setPreviewUrl(publicUrl);
      setAlert({ type: 'success', message: 'Photo uploadée avec succès!' });
      
    } catch (error) {
      console.error('Erreur upload photo:', error);
      setAlert({ type: 'error', message: "Erreur lors de l'upload de la photo" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Fonction pour gérer l'upload de fichier
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadPhoto(file);
    }
  };

  // Fonction pour supprimer la photo
  const removePhoto = async () => {
    if (formData.photo_url) {
      try {
        // Extraire le nom du fichier de l'URL
        const fileName = formData.photo_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('etiquettes').remove([fileName]);
        }
      } catch (error) {
        console.error('Erreur suppression photo:', error);
      }
    }
    
    setFormData(prev => ({ ...prev, photo_url: '' }));
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('label_records')
        .insert([formData]);
      
      if (error) throw error;
      
      setAlert({ type: 'success', message: "Enregistrement d'étiquette réussi!" });
      
      // Reset du formulaire
      setFormData({
        record_date: new Date().toISOString(),
        photo_url: '',
        product_name: '',
        supplier_name: '',
        batch_number: '',
        organization_id: null,
      });
      setPreviewUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error saving label:', error);
      setAlert({ type: 'error', message: "Erreur lors de l'enregistrement" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Enregistrement des Étiquettes
        </Typography>

        {alert && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 3 }}
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            
            {/* Section Photo */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Photo de l'étiquette *
              </Typography>
              
              {/* Boutons pour la photo */}
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  onClick={startCamera}
                  disabled={uploadingPhoto || cameraMode}
                >
                  Prendre une photo
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  component="label"
                  disabled={uploadingPhoto}
                >
                  Choisir un fichier
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </Button>
                
                {formData.photo_url && (
                  <IconButton 
                    color="error" 
                    onClick={removePhoto}
                    disabled={uploadingPhoto}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Stack>

              {/* Mode caméra */}
              {cameraMode && (
                <Card sx={{ mb: 2 }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', maxHeight: '400px' }}
                  />
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button
                        variant="contained"
                        onClick={takePhoto}
                        disabled={uploadingPhoto}
                        startIcon={<PhotoCamera />}
                      >
                        Capturer
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={stopCamera}
                      >
                        Annuler
                      </Button>
                    </Stack>
                  </Box>
                </Card>
              )}

              {/* Canvas caché pour la capture */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Prévisualisation de la photo */}
              {previewUrl && (
                <Card sx={{ mb: 2 }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={previewUrl}
                    alt="Prévisualisation de l'étiquette"
                    sx={{ objectFit: 'contain' }}
                  />
                </Card>
              )}

              {/* Indicateur de chargement */}
              {uploadingPhoto && (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 2 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography>Upload en cours...</Typography>
                </Box>
              )}
            </Box>

            {/* Champs du formulaire */}
            <TextField
              label="Nom du produit"
              value={formData.product_name || ''}
              onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              fullWidth
              required
            />

            <TextField
              label="Nom du fournisseur"
              value={formData.supplier_name || ''}
              onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
              fullWidth
              required
            />

            <TextField
              label="Numéro de lot"
              value={formData.batch_number || ''}
              onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
              fullWidth
            />

            {/* Bouton de soumission */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !formData.photo_url}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{ mt: 3 }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}