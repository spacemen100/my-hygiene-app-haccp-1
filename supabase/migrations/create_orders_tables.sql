-- Table pour les fournisseurs
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  contact_person VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  siret VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les bons de commande
CREATE TABLE purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  order_number VARCHAR NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_delivered', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2),
  notes TEXT,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, order_number)
);

-- Table pour les articles des bons de commande
CREATE TABLE purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_name VARCHAR NOT NULL,
  description TEXT,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  allergens TEXT[], -- Array des allergènes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les bons de livraison
CREATE TABLE delivery_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  delivery_number VARCHAR NOT NULL,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by VARCHAR, -- Nom de la personne qui a réceptionné
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'complete', 'rejected')),
  notes TEXT,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, delivery_number)
);

-- Table pour les articles des bons de livraison
CREATE TABLE delivery_note_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_note_id UUID REFERENCES delivery_notes(id) ON DELETE CASCADE,
  purchase_order_item_id UUID REFERENCES purchase_order_items(id) ON DELETE SET NULL,
  product_name VARCHAR NOT NULL,
  lot_number VARCHAR, -- Numéro de lot du produit livré
  dlc DATE, -- Date limite de consommation
  quantity_ordered DECIMAL(10,3),
  quantity_delivered DECIMAL(10,3) NOT NULL,
  unit VARCHAR NOT NULL,
  temperature_at_delivery DECIMAL(4,1), -- Température à la livraison
  quality_check BOOLEAN DEFAULT TRUE,
  quality_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout de la colonne is_active si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'is_active') THEN
        ALTER TABLE suppliers ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX idx_purchase_orders_organization ON purchase_orders(organization_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

CREATE INDEX idx_delivery_notes_organization ON delivery_notes(organization_id);
CREATE INDEX idx_delivery_notes_purchase_order ON delivery_notes(purchase_order_id);
CREATE INDEX idx_delivery_notes_date ON delivery_notes(delivery_date);
CREATE INDEX idx_delivery_notes_status ON delivery_notes(status);

CREATE INDEX idx_suppliers_organization ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- Triggers pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
        CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_notes_updated_at BEFORE UPDATE ON delivery_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_note_items_updated_at BEFORE UPDATE ON delivery_note_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour la sécurité des données
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_note_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les fournisseurs
CREATE POLICY "Users can view suppliers from their organization" ON suppliers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = suppliers.organization_id
  )
);

CREATE POLICY "Users can insert suppliers for their organization" ON suppliers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = suppliers.organization_id
  )
);

CREATE POLICY "Users can update suppliers from their organization" ON suppliers FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = suppliers.organization_id
  )
);

-- Politiques RLS pour les bons de commande
CREATE POLICY "Users can view purchase orders from their organization" ON purchase_orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = purchase_orders.organization_id
  )
);

CREATE POLICY "Users can insert purchase orders for their organization" ON purchase_orders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = purchase_orders.organization_id
  )
);

CREATE POLICY "Users can update purchase orders from their organization" ON purchase_orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = purchase_orders.organization_id
  )
);

-- Politiques similaires pour les autres tables
CREATE POLICY "Users can view purchase order items from their organization" ON purchase_order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM purchase_orders po
    JOIN employees e ON e.organization_id = po.organization_id
    WHERE e.user_id = auth.uid() 
    AND po.id = purchase_order_items.purchase_order_id
  )
);

CREATE POLICY "Users can insert purchase order items for their organization" ON purchase_order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM purchase_orders po
    JOIN employees e ON e.organization_id = po.organization_id
    WHERE e.user_id = auth.uid() 
    AND po.id = purchase_order_items.purchase_order_id
  )
);

CREATE POLICY "Users can update purchase order items from their organization" ON purchase_order_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM purchase_orders po
    JOIN employees e ON e.organization_id = po.organization_id
    WHERE e.user_id = auth.uid() 
    AND po.id = purchase_order_items.purchase_order_id
  )
);

-- Politiques RLS pour les bons de livraison
CREATE POLICY "Users can view delivery notes from their organization" ON delivery_notes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = delivery_notes.organization_id
  )
);

CREATE POLICY "Users can insert delivery notes for their organization" ON delivery_notes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = delivery_notes.organization_id
  )
);

CREATE POLICY "Users can update delivery notes from their organization" ON delivery_notes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = delivery_notes.organization_id
  )
);

-- Politiques pour les articles des bons de livraison
CREATE POLICY "Users can view delivery note items from their organization" ON delivery_note_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM delivery_notes dn
    JOIN employees e ON e.organization_id = dn.organization_id
    WHERE e.user_id = auth.uid() 
    AND dn.id = delivery_note_items.delivery_note_id
  )
);

CREATE POLICY "Users can insert delivery note items for their organization" ON delivery_note_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM delivery_notes dn
    JOIN employees e ON e.organization_id = dn.organization_id
    WHERE e.user_id = auth.uid() 
    AND dn.id = delivery_note_items.delivery_note_id
  )
);

CREATE POLICY "Users can update delivery note items from their organization" ON delivery_note_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM delivery_notes dn
    JOIN employees e ON e.organization_id = dn.organization_id
    WHERE e.user_id = auth.uid() 
    AND dn.id = delivery_note_items.delivery_note_id
  )
);