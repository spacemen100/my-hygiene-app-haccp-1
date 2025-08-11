"use client";

import { useState, useEffect, useRef } from 'react';
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
  CardMedia,
  Stack,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocalOffer as LabelsIcon,
  PhotoCamera as PhotoIcon,
  CameraAlt,
  Visibility as ViewIcon,
  CalendarToday as DateIcon,
  Business as SupplierIcon,
  Category as ProductIcon,
  Tag as BatchIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';

type LabelRecord = Tables<'label_records'>;
type LabelRecordInsert = TablesInsert<'label_records'>;
type LabelRecordUpdate = TablesUpdate<'label_records'>;

export default function AdminEtiquettesPage() {
  const [records, setRecords] = useState<LabelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LabelRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LabelRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [recordToView, setRecordToView] = useState<LabelRecord | null>(null);
  
  // Camera state
  const [cameraMode, setCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<LabelRecordInsert>({
    photo_url: '',
    record_date: new Date().toISOString(),
    product_name: null,
    batch_number: null,
    supplier_name: null,
  });

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('label_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des enregistrements:', err);
      setError('Erreur lors du chargement des enregistrements d\'étiquettes');
    } finally {
      setLoading(false);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setCameraMode(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Erreur d'accès à la caméra:", error);
      setError("Impossible d'accéder à la caméra");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraMode(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          await uploadPhoto(blob);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const uploadPhoto = async (file: File | Blob) => {
    setUploadingPhoto(true);
    try {
      const fileName = `label_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      const { error } = await supabase.storage
        .from('etiquettes')
        .upload(fileName, file, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('etiquettes')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
      setPreviewUrl(publicUrl);
      setSuccess('Photo uploadée avec succès!');
      
    } catch (error) {
      console.error('Erreur upload photo:', error);
      setError("Erreur lors de l'upload de la photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadPhoto(file);
    }
  };

  const removePhoto = async () => {
    if (formData.photo_url) {
      try {
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

  const handleOpenDialog = (record: LabelRecord | null = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        photo_url: record.photo_url,
        record_date: record.record_date,
        product_name: record.product_name,
        batch_number: record.batch_number,
        supplier_name: record.supplier_name,
      });
      setPreviewUrl(record.photo_url);
    } else {
      setEditingRecord(null);
      setFormData({
        photo_url: '',
        record_date: new Date().toISOString(),
        product_name: null,
        batch_number: null,
        supplier_name: null,
      });
      setPreviewUrl('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
    // Ne pas réinitialiser les messages d'erreur/succès ici pour qu'ils restent visibles
    setPreviewUrl('');
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.photo_url.trim()) {
        setError('La photo est obligatoire');
        return;
      }

      if (editingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('label_records')
          .update(formData as LabelRecordUpdate)
          .eq('id', editingRecord.id);

        if (error) throw error;
        setSuccess('Enregistrement mis à jour avec succès');
      } else {
        // Create new record
        const { error } = await supabase
          .from('label_records')
          .insert([formData]);

        if (error) throw error;
        setSuccess('Enregistrement créé avec succès');
      }

      await loadRecords();
      handleCloseDialog();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
      setError(null);
      setSuccess(null);

      // Delete photo from storage
      if (recordToDelete.photo_url) {
        const fileName = recordToDelete.photo_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('etiquettes').remove([fileName]);
        }
      }

      const { error } = await supabase
        .from('label_records')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) throw error;

      setSuccess('Enregistrement supprimé avec succès');
      await loadRecords();
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          background: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
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
            <LabelsIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Administration des Enregistrements d&apos;Étiquettes
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Gestion des enregistrements d&apos;étiquettes - Consulter, modifier, ajouter et supprimer
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
                <LabelsIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Étiquettes
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {records.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <ProductIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Avec Produit
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {records.filter(r => r.product_name).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <SupplierIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Avec Fournisseur
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {records.filter(r => r.supplier_name).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <BatchIcon />
              </Avatar>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Avec N° Lot
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {records.filter(r => r.batch_number).length}
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
          Nouvel Enregistrement
        </Button>
      </Box>

      {/* Records Table */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Photo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Produit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fournisseur</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>N° Lot</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date d&apos;enregistrement</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date de création</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Avatar
                        src={record.photo_url}
                        sx={{ width: 50, height: 50, borderRadius: 1 }}
                        variant="rounded"
                      >
                        <PhotoIcon />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {record.product_name ? (
                          <>
                            <ProductIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{record.product_name}</Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {record.supplier_name ? (
                          <>
                            <SupplierIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{record.supplier_name}</Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {record.batch_number ? (
                          <>
                            <BatchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{record.batch_number}</Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatDate(record.record_date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.created_at ? formatDate(record.created_at) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Voir la photo">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setRecordToView(record);
                              setViewDialogOpen(true);
                            }}
                            sx={{ color: 'info.main' }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(record)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setRecordToDelete(record);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Aucun enregistrement d&apos;étiquette trouvé
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
          {editingRecord ? 'Modifier l&apos;Enregistrement' : 'Nouvel Enregistrement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Photo Section */}
            <Typography variant="h6" gutterBottom>
              Photo de l&apos;étiquette *
            </Typography>
            
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
                startIcon={<UploadIcon />}
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
                  <DeleteIcon />
                </IconButton>
              )}
            </Stack>

            {/* Camera Mode */}
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
                      startIcon={<PhotoIcon />}
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

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Photo Preview */}
            {previewUrl && (
              <Card sx={{ mb: 3 }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={previewUrl}
                  alt="Prévisualisation de l&apos;étiquette"
                  sx={{ objectFit: 'contain' }}
                />
              </Card>
            )}

            {/* Upload Progress */}
            {uploadingPhoto && (
              <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 2, mb: 2 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography>Upload en cours...</Typography>
              </Box>
            )}

            {/* Form Fields */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <DatePicker
                label="Date d&apos;enregistrement *"
                value={new Date(formData.record_date)}
                onChange={(date) => setFormData({ ...formData, record_date: date?.toISOString() || new Date().toISOString() })}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateIcon />
                        </InputAdornment>
                      ),
                    },
                  } 
                }}
              />

              <TextField
                label="Nom du produit"
                value={formData.product_name || ''}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value || null })}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ProductIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Nom du fournisseur"
                value={formData.supplier_name || ''}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value || null })}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SupplierIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Numéro de lot"
                value={formData.batch_number || ''}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value || null })}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BatchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            startIcon={<SaveIcon />}
            disabled={!formData.photo_url}
          >
            {editingRecord ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Photo Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Photo de l&apos;étiquette - {recordToView?.product_name || 'Sans nom'}
        </DialogTitle>
        <DialogContent>
          {recordToView && (
            <Box>
              <CardMedia
                component="img"
                image={recordToView.photo_url}
                alt="Photo de l&apos;étiquette"
                sx={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: 1 }}
              />
              <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                {recordToView.product_name && (
                  <TextField
                    label="Produit"
                    value={recordToView.product_name}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                )}
                {recordToView.supplier_name && (
                  <TextField
                    label="Fournisseur"
                    value={recordToView.supplier_name}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                )}
                {recordToView.batch_number && (
                  <TextField
                    label="N° de lot"
                    value={recordToView.batch_number}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                )}
                <TextField
                  label="Date d&apos;enregistrement"
                  value={formatDate(recordToView.record_date)}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer cet enregistrement d&apos;étiquette ?
          </Typography>
          {recordToDelete?.product_name && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Produit : {recordToDelete.product_name}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible et supprimera également la photo associée.
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