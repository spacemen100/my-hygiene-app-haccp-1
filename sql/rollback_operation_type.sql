-- Script de rollback pour annuler l'ajout de operation_type
-- À utiliser uniquement si vous devez revenir à l'état précédent

-- ATTENTION: Ce script supprimera définitivement la colonne operation_type
-- et toutes les données associées. Assurez-vous d'avoir une sauvegarde !

BEGIN;

-- 1. Supprimer l'index
DROP INDEX IF EXISTS idx_cooling_records_operation_type;
DROP INDEX IF EXISTS cooling_records_operation_type_idx;

-- 2. Supprimer les politiques RLS spécifiques à operation_type (Supabase)
DROP POLICY IF EXISTS "Users can view own organization cooling records" ON public.cooling_records;
DROP POLICY IF EXISTS "Users can insert cooling records for their organization" ON public.cooling_records;
DROP POLICY IF EXISTS "Users can update cooling records for their organization" ON public.cooling_records;
DROP POLICY IF EXISTS "Users can delete cooling records for their organization" ON public.cooling_records;

-- 3. Supprimer la contrainte de validation
ALTER TABLE cooling_records DROP CONSTRAINT IF EXISTS check_operation_type;
ALTER TABLE cooling_records DROP CONSTRAINT IF EXISTS cooling_records_operation_type_check;

-- 4. Supprimer la colonne operation_type
ALTER TABLE cooling_records DROP COLUMN IF EXISTS operation_type;

-- 5. Recréer les politiques RLS originales (si elles existaient)
-- Politique de lecture
CREATE POLICY "Users can view own organization cooling records" 
ON public.cooling_records FOR SELECT 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.employees 
        WHERE user_id = auth.uid()
        UNION
        SELECT user_metadata->>'organization_id'::TEXT
        FROM auth.users 
        WHERE id = auth.uid()
    )
);

-- Politique d'insertion
CREATE POLICY "Users can insert cooling records for their organization" 
ON public.cooling_records FOR INSERT 
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM public.employees 
        WHERE user_id = auth.uid()
        UNION
        SELECT user_metadata->>'organization_id'::TEXT
        FROM auth.users 
        WHERE id = auth.uid()
    )
);

-- Politique de mise à jour
CREATE POLICY "Users can update cooling records for their organization" 
ON public.cooling_records FOR UPDATE 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.employees 
        WHERE user_id = auth.uid()
        UNION
        SELECT user_metadata->>'organization_id'::TEXT
        FROM auth.users 
        WHERE id = auth.uid()
    )
);

-- Politique de suppression
CREATE POLICY "Users can delete cooling records for their organization" 
ON public.cooling_records FOR DELETE 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.employees 
        WHERE user_id = auth.uid()
        UNION
        SELECT user_metadata->>'organization_id'::TEXT
        FROM auth.users 
        WHERE id = auth.uid()
    )
);

COMMIT;

-- Vérification: Afficher la structure de la table après rollback
-- \d cooling_records;