-- Migration: Ajouter la colonne operation_type à la table cooling_records
-- Date: 2024-08-16
-- Description: Transformation du composant de refroidissement en système polyvalent de gestion des opérations HACCP

-- Ajouter la colonne operation_type avec une valeur par défaut
ALTER TABLE cooling_records 
ADD COLUMN operation_type VARCHAR(50) NOT NULL DEFAULT 'cooling';

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN cooling_records.operation_type IS 'Type d''opération HACCP: cold_preparation, cooling, hot_preparation, hot_serving, reheating';

-- Ajouter une contrainte pour valider les valeurs possibles
ALTER TABLE cooling_records 
ADD CONSTRAINT check_operation_type 
CHECK (operation_type IN (
    'cold_preparation',
    'cooling', 
    'hot_preparation',
    'hot_serving',
    'reheating'
));

-- Optionnel: Créer un index pour améliorer les performances des requêtes par type d'opération
CREATE INDEX idx_cooling_records_operation_type ON cooling_records(operation_type);

-- Optionnel: Mettre à jour les enregistrements existants si nécessaire
-- Tous les enregistrements existants sont automatiquement définis comme 'cooling' 
-- grâce à la valeur par défaut

-- Vérification: Afficher la structure mise à jour de la table
-- \d cooling_records;

-- Migration de rollback (à utiliser si besoin d'annuler les changements)
/*
-- Supprimer l'index
DROP INDEX IF EXISTS idx_cooling_records_operation_type;

-- Supprimer la contrainte
ALTER TABLE cooling_records DROP CONSTRAINT IF EXISTS check_operation_type;

-- Supprimer la colonne
ALTER TABLE cooling_records DROP COLUMN IF EXISTS operation_type;
*/