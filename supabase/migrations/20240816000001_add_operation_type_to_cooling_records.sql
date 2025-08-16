-- Migration Supabase: Ajouter operation_type à cooling_records
-- Fichier: 20240816000001_add_operation_type_to_cooling_records.sql

BEGIN;

-- Ajouter la colonne operation_type
ALTER TABLE public.cooling_records 
ADD COLUMN operation_type TEXT NOT NULL DEFAULT 'cooling';

-- Ajouter un commentaire descriptif
COMMENT ON COLUMN public.cooling_records.operation_type IS 'Type d''opération de contrôle HACCP';

-- Ajouter une contrainte de validation
ALTER TABLE public.cooling_records 
ADD CONSTRAINT cooling_records_operation_type_check 
CHECK (operation_type IN (
    'cold_preparation',
    'cooling',
    'hot_preparation', 
    'hot_serving',
    'reheating'
));

-- Créer un index pour les requêtes par type d'opération
CREATE INDEX cooling_records_operation_type_idx 
ON public.cooling_records(operation_type);

-- Ajouter une politique RLS si nécessaire (Row Level Security)
-- Cette politique permet aux utilisateurs de voir seulement les enregistrements de leur organisation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cooling_records' 
        AND policyname = 'Users can view own organization cooling records'
    ) THEN
        -- Mettre à jour la politique existante pour inclure operation_type
        DROP POLICY IF EXISTS "Users can view own organization cooling records" ON public.cooling_records;
    END IF;
END $$;

-- Recréer la politique avec la nouvelle colonne
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

-- Politique pour l'insertion
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

-- Politique pour la mise à jour
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

-- Politique pour la suppression
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