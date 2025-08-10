-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cleaning_equipment (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  type text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cleaning_equipment_pkey PRIMARY KEY (id),
  CONSTRAINT cleaning_equipment_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.cleaning_methods (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  description text NOT NULL,
  steps ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cleaning_methods_pkey PRIMARY KEY (id),
  CONSTRAINT cleaning_methods_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.cleaning_products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  brand text,
  type text,
  usage_instructions text,
  safety_instructions text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cleaning_products_pkey PRIMARY KEY (id),
  CONSTRAINT cleaning_products_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.cleaning_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cleaning_task_id uuid,
  user_id uuid,
  scheduled_date date NOT NULL,
  completion_date timestamp with time zone,
  is_completed boolean DEFAULT false,
  is_compliant boolean,
  comments text,
  photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cleaning_records_pkey PRIMARY KEY (id),
  CONSTRAINT cleaning_records_cleaning_task_id_fkey FOREIGN KEY (cleaning_task_id) REFERENCES public.cleaning_tasks(id),
  CONSTRAINT cleaning_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.cleaning_sub_zones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cleaning_zone_id uuid,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cleaning_sub_zones_pkey PRIMARY KEY (id),
  CONSTRAINT cleaning_sub_zones_cleaning_zone_id_fkey FOREIGN KEY (cleaning_zone_id) REFERENCES public.cleaning_zones(id)
);
CREATE TABLE public.cleaning_tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  cleaning_zone_id uuid,
  cleaning_sub_zone_id uuid,
  name text NOT NULL,
  frequency text NOT NULL,
  frequency_days integer,
  action_to_perform text NOT NULL,
  cleaning_product_id uuid,
  cleaning_equipment_id uuid,
  cleaning_method_id uuid,
  responsible_role text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cleaning_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT cleaning_tasks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT cleaning_tasks_cleaning_zone_id_fkey FOREIGN KEY (cleaning_zone_id) REFERENCES public.cleaning_zones(id),
  CONSTRAINT cleaning_tasks_cleaning_sub_zone_id_fkey FOREIGN KEY (cleaning_sub_zone_id) REFERENCES public.cleaning_sub_zones(id),
  CONSTRAINT cleaning_tasks_cleaning_product_id_fkey FOREIGN KEY (cleaning_product_id) REFERENCES public.cleaning_products(id),
  CONSTRAINT cleaning_tasks_cleaning_equipment_id_fkey FOREIGN KEY (cleaning_equipment_id) REFERENCES public.cleaning_equipment(id),
  CONSTRAINT cleaning_tasks_cleaning_method_id_fkey FOREIGN KEY (cleaning_method_id) REFERENCES public.cleaning_methods(id)
);
CREATE TABLE public.cleaning_zones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cleaning_zones_pkey PRIMARY KEY (id),
  CONSTRAINT cleaning_zones_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.cold_storage_temperature_readings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cold_storage_unit_id uuid,
  user_id uuid,
  reading_date timestamp with time zone NOT NULL,
  temperature numeric NOT NULL,
  is_compliant boolean NOT NULL,
  comments text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cold_storage_temperature_readings_pkey PRIMARY KEY (id),
  CONSTRAINT cold_storage_temperature_readings_cold_storage_unit_id_fkey FOREIGN KEY (cold_storage_unit_id) REFERENCES public.cold_storage_units(id),
  CONSTRAINT cold_storage_temperature_readings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.cold_storage_units (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  location text,
  min_temperature numeric NOT NULL,
  max_temperature numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cold_storage_units_pkey PRIMARY KEY (id),
  CONSTRAINT cold_storage_units_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.cooling_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  user_id uuid,
  start_date timestamp with time zone NOT NULL,
  product_type text NOT NULL,
  product_name text NOT NULL,
  start_core_temperature numeric NOT NULL,
  end_date timestamp with time zone,
  end_core_temperature numeric,
  is_compliant boolean,
  comments text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cooling_records_pkey PRIMARY KEY (id),
  CONSTRAINT cooling_records_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT cooling_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.deliveries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  supplier_id uuid,
  user_id uuid,
  delivery_date timestamp with time zone NOT NULL,
  delivery_number text,
  photo_url text,
  comments text,
  is_compliant boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT deliveries_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT deliveries_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT deliveries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.label_printings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  user_id uuid,
  product_label_type_id uuid,
  label_count integer NOT NULL,
  print_date timestamp with time zone DEFAULT now(),
  expiry_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT label_printings_pkey PRIMARY KEY (id),
  CONSTRAINT label_printings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT label_printings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT label_printings_product_label_type_id_fkey FOREIGN KEY (product_label_type_id) REFERENCES public.product_label_types(id)
);
CREATE TABLE public.label_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  user_id uuid,
  photo_url text NOT NULL,
  record_date timestamp with time zone NOT NULL,
  product_name text,
  batch_number text,
  supplier_name text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT label_records_pkey PRIMARY KEY (id),
  CONSTRAINT label_records_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT label_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.non_conformities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  delivery_id uuid,
  product_reception_control_id uuid,
  non_conformity_type text NOT NULL,
  product_name text NOT NULL,
  quantity numeric,
  quantity_type text,
  photo_url text,
  description text,
  other_cause text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT non_conformities_pkey PRIMARY KEY (id),
  CONSTRAINT non_conformities_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id),
  CONSTRAINT non_conformities_product_reception_control_id_fkey FOREIGN KEY (product_reception_control_id) REFERENCES public.product_reception_controls(id)
);
CREATE TABLE public.oil_quality_controls (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  user_id uuid,
  control_date timestamp with time zone NOT NULL,
  oil_type text NOT NULL,
  equipment_name text,
  control_type text NOT NULL,
  polar_compounds_percentage numeric,
  result text NOT NULL,
  action_taken text,
  next_control_date date,
  comments text,
  photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT oil_quality_controls_pkey PRIMARY KEY (id),
  CONSTRAINT oil_quality_controls_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT oil_quality_controls_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  city text,
  zip_code text,
  country text,
  phone text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_label_types (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  category text NOT NULL,
  sub_category text NOT NULL,
  shelf_life_days integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_label_types_pkey PRIMARY KEY (id),
  CONSTRAINT product_label_types_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.product_reception_controls (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  delivery_id uuid,
  product_id uuid,
  storage_type text NOT NULL DEFAULT 'ambiant'::text,
  product_name text NOT NULL,
  temperature numeric,
  best_before_date date,
  use_by_date date,
  control_date timestamp with time zone NOT NULL,
  is_compliant boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_reception_controls_pkey PRIMARY KEY (id),
  CONSTRAINT product_reception_controls_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id),
  CONSTRAINT product_reception_controls_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  sub_category text,
  unit_of_measure text,
  storage_type text NOT NULL DEFAULT 'ambiant'::text,
  shelf_life_days integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.sensor_temperature_readings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sensor_id uuid,
  reading_time timestamp with time zone NOT NULL,
  temperature numeric NOT NULL,
  humidity numeric,
  battery_level integer,
  signal_strength integer,
  is_alert boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sensor_temperature_readings_pkey PRIMARY KEY (id),
  CONSTRAINT sensor_temperature_readings_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.temperature_sensors(id)
);
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  contact_person text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT suppliers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.temperature_alerts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sensor_id uuid,
  temperature_reading_id uuid,
  alert_type text NOT NULL,
  alert_time timestamp with time zone NOT NULL,
  threshold_value numeric,
  actual_value numeric,
  is_resolved boolean DEFAULT false,
  resolved_by_user_id uuid,
  resolved_at timestamp with time zone,
  resolution_comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT temperature_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT temperature_alerts_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.temperature_sensors(id),
  CONSTRAINT temperature_alerts_temperature_reading_id_fkey FOREIGN KEY (temperature_reading_id) REFERENCES public.sensor_temperature_readings(id),
  CONSTRAINT temperature_alerts_resolved_by_user_id_fkey FOREIGN KEY (resolved_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.temperature_sensors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  location text NOT NULL,
  sensor_type text NOT NULL,
  min_temperature numeric NOT NULL,
  max_temperature numeric NOT NULL,
  alert_min_temperature numeric,
  alert_max_temperature numeric,
  last_calibration_date date,
  next_calibration_date date,
  is_active boolean DEFAULT true,
  mac_address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT temperature_sensors_pkey PRIMARY KEY (id),
  CONSTRAINT temperature_sensors_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.truck_temperature_controls (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  delivery_id uuid,
  storage_type text NOT NULL,
  truck_temperature numeric NOT NULL,
  control_date timestamp with time zone NOT NULL,
  is_compliant boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT truck_temperature_controls_pkey PRIMARY KEY (id),
  CONSTRAINT truck_temperature_controls_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  organization_id uuid,
  role text NOT NULL DEFAULT 'employee'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  last_login_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);