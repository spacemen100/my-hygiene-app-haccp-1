-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLES DE BASE (Organisations et Utilisateurs)
-- =====================================================

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    country TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 2. TRAÇABILITÉ
-- =====================================================

CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    contact_person TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    sub_category TEXT,
    unit_of_measure TEXT,
    storage_type TEXT NOT NULL DEFAULT 'ambiant',
    shelf_life_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 3. CONTRÔLE À RÉCEPTION
-- =====================================================

CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_number TEXT,
    photo_url TEXT,
    comments TEXT,
    is_compliant BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.truck_temperature_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    storage_type TEXT NOT NULL,
    truck_temperature NUMERIC NOT NULL,
    control_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_compliant BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.product_reception_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    storage_type TEXT NOT NULL DEFAULT 'ambiant',
    product_name TEXT NOT NULL,
    temperature NUMERIC,
    best_before_date DATE,
    use_by_date DATE,
    control_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_compliant BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.non_conformities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    product_reception_control_id UUID REFERENCES public.product_reception_controls(id) ON DELETE CASCADE,
    non_conformity_type TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC,
    quantity_type TEXT,
    photo_url TEXT,
    description TEXT,
    other_cause TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 4. ENREGISTREMENT DES ÉTIQUETTES
-- =====================================================

CREATE TABLE public.label_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    photo_url TEXT NOT NULL,
    record_date TIMESTAMP WITH TIME ZONE NOT NULL,
    product_name TEXT,
    batch_number TEXT,
    supplier_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 5. IMPRESSION DES DLC SECONDAIRES
-- =====================================================

CREATE TABLE public.product_label_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    shelf_life_days INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.label_printings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    product_label_type_id UUID REFERENCES public.product_label_types(id) ON DELETE CASCADE,
    label_count INTEGER NOT NULL,
    print_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 6. ENCEINTES FROIDES
-- =====================================================

CREATE TABLE public.cold_storage_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT,
    min_temperature NUMERIC NOT NULL,
    max_temperature NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.cold_storage_temperature_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cold_storage_unit_id UUID REFERENCES public.cold_storage_units(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reading_date TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature NUMERIC NOT NULL,
    is_compliant BOOLEAN NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 7. SUIVI DES REFROIDISSEMENTS
-- =====================================================

CREATE TABLE public.cooling_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    product_type TEXT NOT NULL,
    product_name TEXT NOT NULL,
    start_core_temperature NUMERIC NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    end_core_temperature NUMERIC,
    is_compliant BOOLEAN,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 8. PLAN DE NETTOYAGE
-- =====================================================

CREATE TABLE public.cleaning_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.cleaning_sub_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cleaning_zone_id UUID REFERENCES public.cleaning_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.cleaning_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    type TEXT,
    usage_instructions TEXT,
    safety_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.cleaning_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.cleaning_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    steps TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.cleaning_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    cleaning_zone_id UUID REFERENCES public.cleaning_zones(id) ON DELETE CASCADE,
    cleaning_sub_zone_id UUID REFERENCES public.cleaning_sub_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    frequency TEXT NOT NULL,
    frequency_days INTEGER,
    action_to_perform TEXT NOT NULL,
    cleaning_product_id UUID REFERENCES public.cleaning_products(id) ON DELETE SET NULL,
    cleaning_equipment_id UUID REFERENCES public.cleaning_equipment(id) ON DELETE SET NULL,
    cleaning_method_id UUID REFERENCES public.cleaning_methods(id) ON DELETE SET NULL,
    responsible_role TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.cleaning_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cleaning_task_id UUID REFERENCES public.cleaning_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    is_compliant BOOLEAN,
    comments TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 9. CONTRÔLE DES HUILES
-- =====================================================

CREATE TABLE public.oil_quality_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    control_date TIMESTAMP WITH TIME ZONE NOT NULL,
    oil_type TEXT NOT NULL,
    equipment_name TEXT,
    control_type TEXT NOT NULL,
    polar_compounds_percentage NUMERIC,
    result TEXT NOT NULL,
    action_taken TEXT,
    next_control_date DATE,
    comments TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 10. CAPTEURS DE TEMPÉRATURE (24h/24)
-- =====================================================

CREATE TABLE public.temperature_sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    min_temperature NUMERIC NOT NULL,
    max_temperature NUMERIC NOT NULL,
    alert_min_temperature NUMERIC,
    alert_max_temperature NUMERIC,
    last_calibration_date DATE,
    next_calibration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    mac_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.sensor_temperature_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES public.temperature_sensors(id) ON DELETE CASCADE,
    reading_time TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature NUMERIC NOT NULL,
    humidity NUMERIC,
    battery_level INTEGER,
    signal_strength INTEGER,
    is_alert BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.temperature_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES public.temperature_sensors(id) ON DELETE CASCADE,
    temperature_reading_id UUID REFERENCES public.sensor_temperature_readings(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    alert_time TIMESTAMP WITH TIME ZONE NOT NULL,
    threshold_value NUMERIC,
    actual_value NUMERIC,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- DONNÉES DE BASE POUR LES TYPES DE PRODUITS
-- =====================================================

INSERT INTO public.product_label_types (category, sub_category, shelf_life_days) VALUES
('bof', 'beurre', 30),
('bof', 'oeufs_frais', 28),
('bof', 'fromage_frais', 7),
('bof', 'fromage_a_pate_dure', 60),
('bof', 'yaourt', 14),
('bof', 'creme_fraiche', 21),
('bof', 'lait', 5),
('fruits_legumes', 'fruits_frais', 5),
('fruits_legumes', 'legumes_frais', 7),
('fruits_legumes', 'salade_verte', 3),
('fruits_legumes', 'champignons', 3),
('fruits_legumes', 'fruits_secs', 180),
('viandes_poissons', 'viande_rouge', 3),
('viandes_poissons', 'viande_blanche', 2),
('viandes_poissons', 'poisson_frais', 1),
('viandes_poissons', 'charcuterie', 7),
('viandes_poissons', 'volaille', 2),
('sauces_condiments', 'mayonnaise', 14),
('sauces_condiments', 'sauce_tomate', 30),
('sauces_condiments', 'vinaigrette', 21),
('sauces_condiments', 'condiments', 90),
('sauces_condiments', 'epices', 365);

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

CREATE INDEX idx_users_organization ON public.users(organization_id);
CREATE INDEX idx_deliveries_date ON public.deliveries(delivery_date);
CREATE INDEX idx_temperature_readings_time ON public.sensor_temperature_readings(reading_time);
CREATE INDEX idx_cleaning_records_scheduled_date ON public.cleaning_records(scheduled_date);
CREATE INDEX idx_temperature_alerts_unresolved ON public.temperature_alerts(is_resolved, alert_time);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activation RLS pour toutes les tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_temperature_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reception_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_conformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_label_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_printings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cold_storage_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cold_storage_temperature_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooling_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_sub_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_quality_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_temperature_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view own user data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own user data" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Organization access" ON public.organizations FOR SELECT USING (
    id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.suppliers FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.products FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.deliveries FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Delivery related access" ON public.truck_temperature_controls FOR ALL USING (
    delivery_id IN (
        SELECT id FROM public.deliveries 
        WHERE organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Delivery related access" ON public.product_reception_controls FOR ALL USING (
    delivery_id IN (
        SELECT id FROM public.deliveries 
        WHERE organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Organization members access" ON public.non_conformities FOR ALL USING (
    delivery_id IN (
        SELECT id FROM public.deliveries 
        WHERE organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Organization members access" ON public.label_records FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.product_label_types FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.label_printings FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.cold_storage_units FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.cold_storage_temperature_readings FOR ALL USING (
    cold_storage_unit_id IN (
        SELECT id FROM public.cold_storage_units 
        WHERE organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Organization members access" ON public.cooling_records FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.cleaning_zones FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.cleaning_sub_zones FOR ALL USING (
    cleaning_zone_id IN (
        SELECT id FROM public.cleaning_zones 
        WHERE organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Organization members access" ON public.cleaning_products FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.cleaning_equipment FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.cleaning_methods FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.cleaning_tasks FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.cleaning_records FOR ALL USING (
    cleaning_task_id IN (
        SELECT id FROM public.cleaning_tasks 
        WHERE organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Organization members access" ON public.oil_quality_controls FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.temperature_sensors FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Organization members access" ON public.sensor_temperature_readings FOR ALL USING (
    sensor_id IN (
        SELECT id FROM public.temperature_sensors 
        WHERE organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Organization members access" ON public.temperature_alerts FOR ALL USING (
    sensor_id IN (
        SELECT id FROM public.temperature_sensors 
        WHERE organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    )
);

-- =====================================================
-- FONCTIONS UTILES
-- =====================================================

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour les tables avec updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cold_storage_units_updated_at
BEFORE UPDATE ON public.cold_storage_units
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cooling_records_updated_at
BEFORE UPDATE ON public.cooling_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_tasks_updated_at
BEFORE UPDATE ON public.cleaning_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_records_updated_at
BEFORE UPDATE ON public.cleaning_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_temperature_sensors_updated_at
BEFORE UPDATE ON public.temperature_sensors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_temperature_alerts_updated_at
BEFORE UPDATE ON public.temperature_alerts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();