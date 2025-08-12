"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface UserGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ open, onClose }: UserGuideModalProps) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: '#4caf50',
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: 600
      }}>
        🧹 Plan de Nettoyage et Désinfection - Mode d'emploi
        <Button 
          onClick={onClose} 
          sx={{ color: 'white', minWidth: 'auto', p: 1 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Introduction */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f3e5f5' }}>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            Il est essentiel de bien faire la différence entre <strong>« nettoyage »</strong> et <strong>« désinfection »</strong>. 
            Le nettoyage est préalable à la désinfection et consiste à enlever les souillures visibles 
            ou invisibles à l'œil nu avant la désinfection. La désinfection, quant à elle, permet 
            d'éliminer les micro-organismes et d'inactiver les virus présents.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            Établir un PND permet donc de définir et de savoir à quelle fréquence et selon quel 
            mode opératoire nettoyer et désinfecter chaque surface (locaux et matériel) de 
            votre établissement.
          </Typography>
        </Paper>

        {/* Objectifs */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            👉 <strong>QUELS OBJECTIFS POUR MON ÉTABLISSEMENT ?</strong>
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            Présent dans toutes les cuisines, le PND s'adapte en fonction de la taille de la 
            cuisine, et du matériel que vous utilisez. Il permet de :
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="S'assurer que tous les locaux de l'établissement, équipements et matériels sont convenablement nettoyés et désinfectés"
                primaryTypographyProps={{ fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Maîtriser la contamination microbiologique de l'environnement (bactéries, levures, champignons, virus)"
                primaryTypographyProps={{ fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Maintenir le matériel et l'environnement de production en bon état"
                primaryTypographyProps={{ fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Se conformer à la réglementation en vigueur qui demande aux établissements préparant, entreposant ou distribuant des denrées alimentaires de faire preuve d'un état de propreté permanent de ses locaux"
                primaryTypographyProps={{ fontSize: '0.95rem' }}
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* En pratique */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            ✅ <strong>EN PRATIQUE</strong>
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
            Le PND présenté sous forme de tableau, résume les points d'attente suivants :
          </Typography>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {/* QUOI */}
            <Paper sx={{ p: 2, bgcolor: '#e8f5e8' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" fontSize="small" />
                QUOI ?
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                Il faut lister <strong>TOUS</strong> les éléments à nettoyer et désinfecter dans votre établissement.
              </Typography>
            </Paper>

            {/* QUAND */}
            <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="primary" fontSize="small" />
                QUAND ?
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.5 }}>
                Pour chaque point ciblé, il vous faudra définir une fréquence de nettoyage et désinfection.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.5 }}>
                En effet, certaines surfaces nécessitent un nettoyage plus régulier que d'autres.
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.5 }}>
                En raison de la crise sanitaire Covid-19, veillez à renforcer la désinfection des 
                éléments sensibles en fonction de leur fréquence d'utilisation.
              </Typography>
            </Paper>

            {/* QUI */}
            <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" fontSize="small" />
                QUI ?
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.5 }}>
                Poste par poste ; il est nécessaire d'identifier les personnes qui exécutent les 
                opérations de nettoyage et de désinfection.
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                Il est également préconisé de définir les moyens de vérifications.
              </Typography>
            </Paper>

            {/* COMMENT */}
            <Paper sx={{ p: 2, bgcolor: '#fce4ec' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BuildIcon color="primary" fontSize="small" />
                COMMENT ?
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                Préciser le mode opératoire appliqué pour le nettoyage et la désinfection de chaque élément.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary"
          size="large"
        >
          J'ai compris
        </Button>
      </DialogActions>
    </Dialog>
  );
}