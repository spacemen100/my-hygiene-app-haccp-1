-- Script de données d'exemple pour les nouveaux types d'opérations
-- À exécuter après la migration add_operation_type_to_cooling_records.sql

-- Exemples d'enregistrements pour différents types d'opérations
-- Note: Ces données sont à des fins de démonstration/test

-- Exemple 1: Préparation à froid (salade)
INSERT INTO cooling_records (
    product_name,
    product_type,
    operation_type,
    start_core_temperature,
    end_core_temperature,
    start_date,
    end_date,
    is_compliant,
    comments,
    organization_id
) VALUES (
    'Salade verte',
    'Frais',
    'cold_preparation',
    2.0,
    3.0,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour',
    true,
    'Préparation de salade en chambre froide. Température maintenue entre 0-4°C',
    '00000000-0000-0000-0000-000000000000' -- Remplacer par un organization_id valide
);

-- Exemple 2: Refroidissement (poulet rôti)
INSERT INTO cooling_records (
    product_name,
    product_type,
    operation_type,
    start_core_temperature,
    end_core_temperature,
    start_date,
    end_date,
    is_compliant,
    comments,
    organization_id
) VALUES (
    'Poulet rôti',
    'Frais',
    'cooling',
    75.0,
    8.0,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '30 minutes',
    true,
    'Refroidissement rapide après cuisson. Règle HACCP 65°C -> 10°C en 6h respectée',
    '00000000-0000-0000-0000-000000000000' -- Remplacer par un organization_id valide
);

-- Exemple 3: Préparation à chaud (soupe)
INSERT INTO cooling_records (
    product_name,
    product_type,
    operation_type,
    start_core_temperature,
    end_core_temperature,
    start_date,
    end_date,
    is_compliant,
    comments,
    organization_id
) VALUES (
    'Soupe de légumes',
    'Liquide',
    'hot_preparation',
    20.0,
    78.0,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '15 minutes',
    true,
    'Cuisson de la soupe. Température de sécurité atteinte (≥75°C)',
    '00000000-0000-0000-0000-000000000000' -- Remplacer par un organization_id valide
);

-- Exemple 4: Service chaud (plat principal)
INSERT INTO cooling_records (
    product_name,
    product_type,
    operation_type,
    start_core_temperature,
    end_core_temperature,
    start_date,
    end_date,
    is_compliant,
    comments,
    organization_id
) VALUES (
    'Bœuf bourguignon',
    'Frais',
    'hot_serving',
    70.0,
    68.0,
    NOW() - INTERVAL '3 hours',
    NOW(),
    true,
    'Maintien en température pour service. Température entre 63-85°C maintenue',
    '00000000-0000-0000-0000-000000000000' -- Remplacer par un organization_id valide
);

-- Exemple 5: Réchauffage (restes)
INSERT INTO cooling_records (
    product_name,
    product_type,
    operation_type,
    start_core_temperature,
    end_core_temperature,
    start_date,
    end_date,
    is_compliant,
    comments,
    organization_id
) VALUES (
    'Lasagnes réchauffées',
    'Surgelé',
    'reheating',
    4.0,
    76.0,
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '5 minutes',
    true,
    'Réchauffage de lasagnes surgelées. Température de sécurité atteinte',
    '00000000-0000-0000-0000-000000000000' -- Remplacer par un organization_id valide
);

-- Statistiques par type d'opération (requête de vérification)
/*
SELECT 
    operation_type,
    COUNT(*) as total_records,
    AVG(CASE WHEN is_compliant THEN 1.0 ELSE 0.0 END) * 100 as compliance_rate,
    AVG(start_core_temperature) as avg_start_temp,
    AVG(end_core_temperature) as avg_end_temp
FROM cooling_records 
GROUP BY operation_type
ORDER BY operation_type;
*/