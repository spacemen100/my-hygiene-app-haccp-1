-- Migration: Ajout de la colonne activity_sector_id à la table organizations
-- Date: 2025-08-15

-- Ajouter la colonne activity_sector_id
ALTER TABLE public.organizations 
ADD COLUMN activity_sector_id uuid REFERENCES public.activity_sectors(id);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.organizations.activity_sector_id IS 'Référence vers le secteur d''activité de l''organisation';

-- Optionnel: créer un index pour améliorer les performances des jointures
CREATE INDEX idx_organizations_activity_sector_id ON public.organizations(activity_sector_id);