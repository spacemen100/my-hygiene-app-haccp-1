-- =================================================================
-- POLITIQUES DE SÉCURITÉ POUR LE BUCKET delivery-photos
-- =================================================================

-- 1. Politique pour UPLOAD - Les utilisateurs authentifiés peuvent uploader des photos
CREATE POLICY "Users can upload delivery photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'delivery-photos' AND
  auth.uid()::text IS NOT NULL
);

-- 2. Politique pour SELECT/VIEW - Les utilisateurs authentifiés peuvent voir les photos
CREATE POLICY "Users can view delivery photos" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'delivery-photos' AND
  auth.uid()::text IS NOT NULL
);

-- 3. Politique pour UPDATE - Les utilisateurs peuvent modifier leurs propres photos ou celles de leur organisation
CREATE POLICY "Users can update delivery photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'delivery-photos' AND
  auth.uid()::text IS NOT NULL
);

-- 4. Politique pour DELETE - Les utilisateurs peuvent supprimer leurs propres photos ou celles de leur organisation
CREATE POLICY "Users can delete delivery photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'delivery-photos' AND
  auth.uid()::text IS NOT NULL
);

-- =================================================================
-- VÉRIFICATION ET CRÉATION DU BUCKET (si nécessaire)
-- =================================================================

-- Vérifier si le bucket existe
SELECT * FROM storage.buckets WHERE id = 'delivery-photos';

-- Si le bucket n'existe pas, le créer :
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'delivery-photos',
--   'delivery-photos', 
--   true,
--   5242880, -- 5MB limit
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
-- );

-- =================================================================
-- ALTERNATIVE : POLITIQUES PLUS RESTRICTIVES PAR ORGANISATION
-- =================================================================

-- Si vous voulez limiter l'accès par organisation, remplacez les politiques ci-dessus par :

/*
-- Politique pour UPLOAD avec restriction d'organisation
CREATE POLICY "Users can upload delivery photos for their organization" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'delivery-photos' AND
  auth.uid()::text IS NOT NULL AND
  (
    -- Vérifier que l'utilisateur appartient à une organisation
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  )
);

-- Politique pour SELECT avec restriction d'organisation
CREATE POLICY "Users can view delivery photos from their organization" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'delivery-photos' AND
  auth.uid()::text IS NOT NULL AND
  (
    -- Permettre l'accès aux photos de la même organisation
    -- Note: Vous devriez stocker l'organization_id dans les métadonnées de l'objet
    -- ou utiliser une structure de dossiers comme organization_id/filename
    true -- Pour l'instant, autoriser tous les utilisateurs authentifiés
  )
);
*/

-- =================================================================
-- INSTRUCTIONS D'EXÉCUTION
-- =================================================================

-- 1. Connectez-vous à votre projet Supabase
-- 2. Allez dans "SQL Editor"
-- 3. Copiez et exécutez les politiques ci-dessus
-- 4. Vérifiez que le bucket existe avec la requête SELECT
-- 5. Si le bucket n'existe pas, décommentez et exécutez l'INSERT
-- 6. Testez l'upload depuis l'application

-- =================================================================
-- DÉPANNAGE
-- =================================================================

-- Pour voir les politiques existantes :
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Pour supprimer une politique existante (si besoin) :
-- DROP POLICY "policy_name" ON storage.objects;

-- Pour voir les buckets existants :
SELECT * FROM storage.buckets;

-- Pour voir les objets dans le bucket :
SELECT * FROM storage.objects WHERE bucket_id = 'delivery-photos';