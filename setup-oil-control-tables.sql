-- =====================================================
-- TABLES SUPABASE POUR CONTRÔLE HACCP DES HUILES (VERSION CORRIGÉE)
-- =====================================================

-- Table des équipements (friteuses, etc.) - Version étendue
CREATE TABLE IF NOT EXISTS public.equipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL DEFAULT 'other' CHECK (equipment_type IN ('fryer', 'cooking', 'other')),
  equipment_state BOOLEAN DEFAULT TRUE,
  oil_capacity DECIMAL(5,2),
  oil_type TEXT,
  temperature_monitoring BOOLEAN DEFAULT TRUE,
  min_temperature DECIMAL(5,2) DEFAULT 0.0,
  max_temperature DECIMAL(5,2) DEFAULT 180.0,
  polarity_monitoring BOOLEAN DEFAULT TRUE,
  min_polarity DECIMAL(5,2) DEFAULT 0.0,
  max_polarity DECIMAL(5,2) DEFAULT 25.0,
  location TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des contrôles d'huile (sessions de contrôle)
CREATE TABLE IF NOT EXISTS public.oil_controls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reading_time TIME NOT NULL DEFAULT CURRENT_TIME,
  created_by UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des relevés par équipement (spécifique huiles)
CREATE TABLE IF NOT EXISTS public.oil_equipment_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oil_control_id UUID REFERENCES public.oil_controls(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipments(id),
  control_type TEXT NOT NULL CHECK (control_type IN ('change_cleaning', 'collection', 'filtration', 'strip', 'visual')),
  temperature DECIMAL(5,2),
  polarity DECIMAL(5,2),
  oil_level DECIMAL(5,2),
  corrective_actions UUID[] DEFAULT ARRAY[]::UUID[],
  photo_url TEXT,
  comments TEXT,
  is_compliant BOOLEAN,
  critical_control_point BOOLEAN DEFAULT FALSE,
  validated_by UUID REFERENCES public.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des actions correctives prédéfinies (version étendue)
CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('immediate', 'preventive', 'maintenance', 'training')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison pour les actions correctives (remplace le tableau de références)
CREATE TABLE IF NOT EXISTS public.oil_reading_corrective_actions (
  reading_id UUID REFERENCES public.oil_equipment_readings(id) ON DELETE CASCADE,
  action_id UUID REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
  PRIMARY KEY (reading_id, action_id)
);

-- Table de l'historique des contrôles (spécifique huiles)
CREATE TABLE IF NOT EXISTS public.oil_control_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oil_control_id UUID REFERENCES public.oil_controls(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'validate', 'delete')),
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES public.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

-- =====================================================
-- POLITIQUES RLS (Row Level Security) MISES À JOUR
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_equipment_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_reading_corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_control_history ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Enable read access for organization members" ON public.equipments;
DROP POLICY IF EXISTS "Enable insert for managers and admins" ON public.equipments;
DROP POLICY IF EXISTS "Enable update for managers and admins" ON public.equipments;

DROP POLICY IF EXISTS "Enable read access for organization members" ON public.oil_controls;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.oil_controls;
DROP POLICY IF EXISTS "Enable update for creators or admins" ON public.oil_controls;

DROP POLICY IF EXISTS "Enable read access for organization members" ON public.oil_equipment_readings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.oil_equipment_readings;

DROP POLICY IF EXISTS "Enable read access for organization members" ON public.corrective_actions;

-- Politiques pour les équipements
CREATE POLICY "Enable read access for organization members" ON public.equipments 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND organization_id = equipments.organization_id)
);

CREATE POLICY "Enable insert for managers and admins" ON public.equipments 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND organization_id = equipments.organization_id AND role IN ('admin', 'manager'))
);

CREATE POLICY "Enable update for managers and admins" ON public.equipments 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND organization_id = equipments.organization_id AND role IN ('admin', 'manager'))
);

-- Politiques pour les contrôles d'huile
CREATE POLICY "Enable read access for organization members" ON public.oil_controls 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND organization_id = oil_controls.organization_id)
);

CREATE POLICY "Enable insert for authenticated users" ON public.oil_controls 
FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND organization_id = oil_controls.organization_id)
);

CREATE POLICY "Enable update for creators or admins" ON public.oil_controls 
FOR UPDATE USING (
  (auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND organization_id = oil_controls.organization_id AND role = 'admin'))
);

-- Politiques pour les relevés d'équipement
CREATE POLICY "Enable read access for organization members" ON public.oil_equipment_readings 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.oil_controls oc
    JOIN public.users u ON u.organization_id = oc.organization_id
    WHERE oc.id = oil_equipment_readings.oil_control_id AND u.id = auth.uid()
  )
);

CREATE POLICY "Enable insert for authenticated users" ON public.oil_equipment_readings 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND organization_id = (
    SELECT organization_id FROM public.oil_controls WHERE id = oil_equipment_readings.oil_control_id
  ))
);

-- Politiques pour les actions correctives
CREATE POLICY "Enable read access for organization members" ON public.corrective_actions 
FOR SELECT USING (
  organization_id IS NULL OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND organization_id = corrective_actions.organization_id)
);

-- =====================================================
-- TRIGGERS ET FONCTIONS MIS À JOUR
-- =====================================================

-- Fonction générique pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_equipments_updated_at ON public.equipments;
CREATE TRIGGER update_equipments_updated_at
BEFORE UPDATE ON public.equipments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oil_controls_updated_at ON public.oil_controls;
CREATE TRIGGER update_oil_controls_updated_at
BEFORE UPDATE ON public.oil_controls
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oil_equipment_readings_updated_at ON public.oil_equipment_readings;
CREATE TRIGGER update_oil_equipment_readings_updated_at
BEFORE UPDATE ON public.oil_equipment_readings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_corrective_actions_updated_at ON public.corrective_actions;
CREATE TRIGGER update_corrective_actions_updated_at
BEFORE UPDATE ON public.corrective_actions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONNÉES INITIALES SPÉCIFIQUES HUILES
-- =====================================================

-- Actions correctives spécifiques aux huiles
INSERT INTO public.corrective_actions (id, organization_id, name, description, category) 
VALUES
(gen_random_uuid(), NULL, 'Changement d''huile immédiat', 'Remplacer complètement l''huile de friture', 'immediate'),
(gen_random_uuid(), NULL, 'Filtration d''huile', 'Filtrer l''huile pour éliminer les particules', 'preventive'),
(gen_random_uuid(), NULL, 'Ajustement température', 'Ajuster la température de friture', 'immediate'),
(gen_random_uuid(), NULL, 'Nettoyage friteuse', 'Nettoyer complètement la friteuse', 'maintenance'),
(gen_random_uuid(), NULL, 'Contrôle polarité', 'Augmenter la fréquence des contrôles de polarité', 'preventive')
ON CONFLICT DO NOTHING;

-- =====================================================
-- INDEX POUR PERFORMANCE
-- =====================================================

-- Index pour les équipements
CREATE INDEX IF NOT EXISTS idx_equipments_organization ON public.equipments(organization_id);
CREATE INDEX IF NOT EXISTS idx_equipments_type ON public.equipments(equipment_type);

-- Index pour les contrôles d'huile
CREATE INDEX IF NOT EXISTS idx_oil_controls_org_date ON public.oil_controls(organization_id, reading_date);
CREATE INDEX IF NOT EXISTS idx_oil_controls_status ON public.oil_controls(status);

-- Index pour les relevés d'huile
CREATE INDEX IF NOT EXISTS idx_oil_readings_control ON public.oil_equipment_readings(oil_control_id);
CREATE INDEX IF NOT EXISTS idx_oil_readings_equipment ON public.oil_equipment_readings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_oil_readings_compliance ON public.oil_equipment_readings(is_compliant);

-- Index pour l'historique
CREATE INDEX IF NOT EXISTS idx_oil_history_control ON public.oil_control_history(oil_control_id);
CREATE INDEX IF NOT EXISTS idx_oil_history_action ON public.oil_control_history(action_type);