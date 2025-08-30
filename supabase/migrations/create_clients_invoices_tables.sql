-- Table pour les clients
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  contact_person VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  siret VARCHAR,
  vat_number VARCHAR,
  payment_terms INTEGER DEFAULT 30, -- Délai de paiement en jours
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les bons de commande/livraison clients
CREATE TABLE client_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  order_number VARCHAR NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  delivery_address TEXT,
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_preparation', 'ready', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2),
  notes TEXT,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, order_number)
);

-- Table pour les articles des bons de commande clients
CREATE TABLE client_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_order_id UUID REFERENCES client_orders(id) ON DELETE CASCADE,
  preparation_id UUID REFERENCES preparations(id) ON DELETE SET NULL, -- Si provient d'une préparation
  product_name VARCHAR NOT NULL,
  description TEXT,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  allergens TEXT[], -- Array des allergènes
  lot_number VARCHAR,
  dlc DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les factures
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR NOT NULL,
  client_order_id UUID REFERENCES client_orders(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00, -- Taux de TVA en pourcentage
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, invoice_number)
);

-- Table pour les lignes de facture
CREATE TABLE invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  client_order_item_id UUID REFERENCES client_order_items(id) ON DELETE SET NULL,
  product_name VARCHAR NOT NULL,
  description TEXT,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_clients_active ON clients(is_active);

CREATE INDEX idx_client_orders_organization ON client_orders(organization_id);
CREATE INDEX idx_client_orders_client ON client_orders(client_id);
CREATE INDEX idx_client_orders_date ON client_orders(order_date);
CREATE INDEX idx_client_orders_status ON client_orders(status);

CREATE INDEX idx_invoices_organization ON invoices(organization_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_client_order ON invoices(client_order_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_orders_updated_at BEFORE UPDATE ON client_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_order_items_updated_at BEFORE UPDATE ON client_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour la sécurité des données
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les clients
CREATE POLICY "Users can view clients from their organization" ON clients FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = clients.organization_id
  )
);

CREATE POLICY "Users can insert clients for their organization" ON clients FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = clients.organization_id
  )
);

CREATE POLICY "Users can update clients from their organization" ON clients FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = clients.organization_id
  )
);

-- Politiques RLS pour les bons de commande clients
CREATE POLICY "Users can view client orders from their organization" ON client_orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = client_orders.organization_id
  )
);

CREATE POLICY "Users can insert client orders for their organization" ON client_orders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = client_orders.organization_id
  )
);

CREATE POLICY "Users can update client orders from their organization" ON client_orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = client_orders.organization_id
  )
);

-- Politiques RLS pour les articles des bons de commande clients
CREATE POLICY "Users can view client order items from their organization" ON client_order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM client_orders co
    JOIN employees e ON e.organization_id = co.organization_id
    WHERE e.user_id = auth.uid() 
    AND co.id = client_order_items.client_order_id
  )
);

CREATE POLICY "Users can insert client order items for their organization" ON client_order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_orders co
    JOIN employees e ON e.organization_id = co.organization_id
    WHERE e.user_id = auth.uid() 
    AND co.id = client_order_items.client_order_id
  )
);

CREATE POLICY "Users can update client order items from their organization" ON client_order_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM client_orders co
    JOIN employees e ON e.organization_id = co.organization_id
    WHERE e.user_id = auth.uid() 
    AND co.id = client_order_items.client_order_id
  )
);

-- Politiques RLS pour les factures
CREATE POLICY "Users can view invoices from their organization" ON invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = invoices.organization_id
  )
);

CREATE POLICY "Users can insert invoices for their organization" ON invoices FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = invoices.organization_id
  )
);

CREATE POLICY "Users can update invoices from their organization" ON invoices FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.user_id = auth.uid() 
    AND employees.organization_id = invoices.organization_id
  )
);

-- Politiques RLS pour les lignes de facture
CREATE POLICY "Users can view invoice items from their organization" ON invoice_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM invoices inv
    JOIN employees e ON e.organization_id = inv.organization_id
    WHERE e.user_id = auth.uid() 
    AND inv.id = invoice_items.invoice_id
  )
);

CREATE POLICY "Users can insert invoice items for their organization" ON invoice_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices inv
    JOIN employees e ON e.organization_id = inv.organization_id
    WHERE e.user_id = auth.uid() 
    AND inv.id = invoice_items.invoice_id
  )
);

CREATE POLICY "Users can update invoice items from their organization" ON invoice_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM invoices inv
    JOIN employees e ON e.organization_id = inv.organization_id
    WHERE e.user_id = auth.uid() 
    AND inv.id = invoice_items.invoice_id
  )
);

-- Fonction pour calculer le total d'une facture
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les totaux de la facture
  UPDATE invoices 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0) 
      FROM invoice_items 
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    tax_amount = subtotal * (tax_rate / 100),
    total_amount = subtotal + (subtotal * (tax_rate / 100))
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers pour recalculer automatiquement les totaux des factures
CREATE TRIGGER calculate_invoice_totals_on_insert 
  AFTER INSERT ON invoice_items 
  FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();

CREATE TRIGGER calculate_invoice_totals_on_update 
  AFTER UPDATE ON invoice_items 
  FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();

CREATE TRIGGER calculate_invoice_totals_on_delete 
  AFTER DELETE ON invoice_items 
  FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();