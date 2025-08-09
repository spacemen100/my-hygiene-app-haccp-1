// components/ui/card.tsx
import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { CardActionArea } from '@mui/material';

interface CardProps {
  /**
   * Titre de la carte
   */
  title: string;
  /**
   * Description de la carte
   */
  description: string;
  /**
   * URL de l'image (optionnelle)
   */
  imageUrl?: string;
  /**
   * Texte du bouton (optionnel)
   */
  buttonText?: string;
  /**
   * Handler pour le clic sur la carte
   */
  onClick?: () => void;
  /**
   * Handler pour le clic sur le bouton
   */
  onButtonClick?: () => void;
}

/**
 * Composant Card réutilisable avec Material-UI
 */
export const CardComponent = ({
  title,
  description,
  imageUrl,
  buttonText,
  onClick,
  onButtonClick,
}: CardProps) => {
  return (
    <Card sx={{ maxWidth: 345, minWidth: 275 }}>
      <CardActionArea onClick={onClick}>
        {imageUrl && (
          <CardMedia
            component="img"
            height="140"
            image={imageUrl}
            alt={title}
            sx={{ objectFit: 'cover' }}
          />
        )}
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
      {buttonText && (
        <CardActions>
          <Button size="small" onClick={onButtonClick}>
            {buttonText}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

// Export nommé alternatif si vous préférez
export const MuiCard = CardComponent;