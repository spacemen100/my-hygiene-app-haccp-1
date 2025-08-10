-- Script pour créer l'organisation par défaut
-- À exécuter dans la console SQL de Supabase

INSERT INTO public.organizations (
    id, 
    name, 
    address,
    city,
    zip_code,
    country,
    phone,
    email,
    created_at, 
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'Organisation par défaut',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(), 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Vérification que l'organisation a été créée
SELECT id, name, created_at FROM public.organizations WHERE id = '00000000-0000-0000-0000-000000000000';