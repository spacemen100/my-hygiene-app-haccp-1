export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cleaning_equipment: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_methods: {
        Row: {
          created_at: string | null
          description: string
          id: string
          name: string
          organization_id: string | null
          steps: string[] | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          name: string
          organization_id?: string | null
          steps?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          organization_id?: string | null
          steps?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_products: {
        Row: {
          brand: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          safety_instructions: string | null
          type: string | null
          usage_instructions: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          safety_instructions?: string | null
          type?: string | null
          usage_instructions?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          safety_instructions?: string | null
          type?: string | null
          usage_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_records: {
        Row: {
          cleaning_task_id: string | null
          comments: string | null
          completion_date: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          is_compliant: boolean | null
          photo_url: string | null
          scheduled_date: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cleaning_task_id?: string | null
          comments?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_compliant?: boolean | null
          photo_url?: string | null
          scheduled_date: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cleaning_task_id?: string | null
          comments?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_compliant?: boolean | null
          photo_url?: string | null
          scheduled_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_records_cleaning_task_id_fkey"
            columns: ["cleaning_task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_sub_zones: {
        Row: {
          cleaning_zone_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          cleaning_zone_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          cleaning_zone_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_sub_zones_cleaning_zone_id_fkey"
            columns: ["cleaning_zone_id"]
            isOneToOne: false
            referencedRelation: "cleaning_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_tasks: {
        Row: {
          action_to_perform: string
          cleaning_equipment_id: string | null
          cleaning_method_id: string | null
          cleaning_product_id: string | null
          cleaning_sub_zone_id: string | null
          cleaning_zone_id: string | null
          created_at: string | null
          frequency: string
          frequency_days: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          responsible_role: string | null
          updated_at: string | null
        }
        Insert: {
          action_to_perform: string
          cleaning_equipment_id?: string | null
          cleaning_method_id?: string | null
          cleaning_product_id?: string | null
          cleaning_sub_zone_id?: string | null
          cleaning_zone_id?: string | null
          created_at?: string | null
          frequency: string
          frequency_days?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          responsible_role?: string | null
          updated_at?: string | null
        }
        Update: {
          action_to_perform?: string
          cleaning_equipment_id?: string | null
          cleaning_method_id?: string | null
          cleaning_product_id?: string | null
          cleaning_sub_zone_id?: string | null
          cleaning_zone_id?: string | null
          created_at?: string | null
          frequency?: string
          frequency_days?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          responsible_role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_tasks_cleaning_equipment_id_fkey"
            columns: ["cleaning_equipment_id"]
            isOneToOne: false
            referencedRelation: "cleaning_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaning_method_id_fkey"
            columns: ["cleaning_method_id"]
            isOneToOne: false
            referencedRelation: "cleaning_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaning_product_id_fkey"
            columns: ["cleaning_product_id"]
            isOneToOne: false
            referencedRelation: "cleaning_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaning_sub_zone_id_fkey"
            columns: ["cleaning_sub_zone_id"]
            isOneToOne: false
            referencedRelation: "cleaning_sub_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaning_zone_id_fkey"
            columns: ["cleaning_zone_id"]
            isOneToOne: false
            referencedRelation: "cleaning_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_zones: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_zones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cold_storage_temperature_readings: {
        Row: {
          cold_storage_unit_id: string | null
          comments: string | null
          created_at: string | null
          id: string
          is_compliant: boolean
          reading_date: string
          temperature: number
          user_id: string | null
        }
        Insert: {
          cold_storage_unit_id?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string
          is_compliant: boolean
          reading_date: string
          temperature: number
          user_id?: string | null
        }
        Update: {
          cold_storage_unit_id?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string
          is_compliant?: boolean
          reading_date?: string
          temperature?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cold_storage_temperature_readings_cold_storage_unit_id_fkey"
            columns: ["cold_storage_unit_id"]
            isOneToOne: false
            referencedRelation: "cold_storage_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cold_storage_temperature_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cold_storage_units: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          max_temperature: number
          min_temperature: number
          name: string
          organization_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_temperature: number
          min_temperature: number
          name: string
          organization_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_temperature?: number
          min_temperature?: number
          name?: string
          organization_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cold_storage_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cooling_records: {
        Row: {
          comments: string | null
          created_at: string | null
          end_core_temperature: number | null
          end_date: string | null
          id: string
          is_compliant: boolean | null
          organization_id: string | null
          product_name: string
          product_type: string
          start_core_temperature: number
          start_date: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          end_core_temperature?: number | null
          end_date?: string | null
          id?: string
          is_compliant?: boolean | null
          organization_id?: string | null
          product_name: string
          product_type: string
          start_core_temperature: number
          start_date: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          end_core_temperature?: number | null
          end_date?: string | null
          id?: string
          is_compliant?: boolean | null
          organization_id?: string | null
          product_name?: string
          product_type?: string
          start_core_temperature?: number
          start_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cooling_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooling_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          comments: string | null
          created_at: string | null
          delivery_date: string
          delivery_number: string | null
          id: string
          is_compliant: boolean | null
          organization_id: string | null
          photo_url: string | null
          supplier_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          delivery_date: string
          delivery_number?: string | null
          id?: string
          is_compliant?: boolean | null
          organization_id?: string | null
          photo_url?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          delivery_date?: string
          delivery_number?: string | null
          id?: string
          is_compliant?: boolean | null
          organization_id?: string | null
          photo_url?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      label_printings: {
        Row: {
          created_at: string | null
          expiry_date: string
          id: string
          label_count: number
          organization_id: string | null
          print_date: string | null
          product_label_type_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date: string
          id?: string
          label_count: number
          organization_id?: string | null
          print_date?: string | null
          product_label_type_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string
          id?: string
          label_count?: number
          organization_id?: string | null
          print_date?: string | null
          product_label_type_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "label_printings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_printings_product_label_type_id_fkey"
            columns: ["product_label_type_id"]
            isOneToOne: false
            referencedRelation: "product_label_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_printings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      label_records: {
        Row: {
          batch_number: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          photo_url: string
          product_name: string | null
          record_date: string
          supplier_name: string | null
          user_id: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          photo_url: string
          product_name?: string | null
          record_date: string
          supplier_name?: string | null
          user_id?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          photo_url?: string
          product_name?: string | null
          record_date?: string
          supplier_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "label_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      non_conformities: {
        Row: {
          created_at: string | null
          delivery_id: string | null
          description: string | null
          id: string
          non_conformity_type: string
          other_cause: string | null
          photo_url: string | null
          product_name: string
          product_reception_control_id: string | null
          quantity: number | null
          quantity_type: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          id?: string
          non_conformity_type: string
          other_cause?: string | null
          photo_url?: string | null
          product_name: string
          product_reception_control_id?: string | null
          quantity?: number | null
          quantity_type?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          id?: string
          non_conformity_type?: string
          other_cause?: string | null
          photo_url?: string | null
          product_name?: string
          product_reception_control_id?: string | null
          quantity?: number | null
          quantity_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "non_conformities_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_conformities_product_reception_control_id_fkey"
            columns: ["product_reception_control_id"]
            isOneToOne: false
            referencedRelation: "product_reception_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_quality_controls: {
        Row: {
          action_taken: string | null
          comments: string | null
          control_date: string
          control_type: string
          created_at: string | null
          equipment_name: string | null
          id: string
          next_control_date: string | null
          oil_type: string
          organization_id: string | null
          photo_url: string | null
          polar_compounds_percentage: number | null
          result: string
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          comments?: string | null
          control_date: string
          control_type: string
          created_at?: string | null
          equipment_name?: string | null
          id?: string
          next_control_date?: string | null
          oil_type: string
          organization_id?: string | null
          photo_url?: string | null
          polar_compounds_percentage?: number | null
          result: string
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          comments?: string | null
          control_date?: string
          control_type?: string
          created_at?: string | null
          equipment_name?: string | null
          id?: string
          next_control_date?: string | null
          oil_type?: string
          organization_id?: string | null
          photo_url?: string | null
          polar_compounds_percentage?: number | null
          result?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_quality_controls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oil_quality_controls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      product_label_types: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          shelf_life_days: number
          sub_category: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          shelf_life_days: number
          sub_category: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          shelf_life_days?: number
          sub_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_label_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reception_controls: {
        Row: {
          best_before_date: string | null
          control_date: string
          created_at: string | null
          delivery_id: string | null
          id: string
          is_compliant: boolean
          product_id: string | null
          product_name: string
          storage_type: string
          temperature: number | null
          use_by_date: string | null
        }
        Insert: {
          best_before_date?: string | null
          control_date: string
          created_at?: string | null
          delivery_id?: string | null
          id?: string
          is_compliant: boolean
          product_id?: string | null
          product_name: string
          storage_type?: string
          temperature?: number | null
          use_by_date?: string | null
        }
        Update: {
          best_before_date?: string | null
          control_date?: string
          created_at?: string | null
          delivery_id?: string | null
          id?: string
          is_compliant?: boolean
          product_id?: string | null
          product_name?: string
          storage_type?: string
          temperature?: number | null
          use_by_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reception_controls_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reception_controls_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          shelf_life_days: number | null
          storage_type: string
          sub_category: string | null
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          shelf_life_days?: number | null
          storage_type?: string
          sub_category?: string | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          shelf_life_days?: number | null
          storage_type?: string
          sub_category?: string | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_temperature_readings: {
        Row: {
          battery_level: number | null
          created_at: string | null
          humidity: number | null
          id: string
          is_alert: boolean | null
          reading_time: string
          sensor_id: string | null
          signal_strength: number | null
          temperature: number
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          humidity?: number | null
          id?: string
          is_alert?: boolean | null
          reading_time: string
          sensor_id?: string | null
          signal_strength?: number | null
          temperature: number
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          humidity?: number | null
          id?: string
          is_alert?: boolean | null
          reading_time?: string
          sensor_id?: string | null
          signal_strength?: number | null
          temperature?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_temperature_readings_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "temperature_sensors"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          organization_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      temperature_alerts: {
        Row: {
          actual_value: number | null
          alert_time: string
          alert_type: string
          created_at: string | null
          id: string
          is_resolved: boolean | null
          resolution_comment: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          sensor_id: string | null
          temperature_reading_id: string | null
          threshold_value: number | null
          updated_at: string | null
        }
        Insert: {
          actual_value?: number | null
          alert_time: string
          alert_type: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          resolution_comment?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          sensor_id?: string | null
          temperature_reading_id?: string | null
          threshold_value?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_value?: number | null
          alert_time?: string
          alert_type?: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          resolution_comment?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          sensor_id?: string | null
          temperature_reading_id?: string | null
          threshold_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temperature_alerts_resolved_by_user_id_fkey"
            columns: ["resolved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temperature_alerts_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "temperature_sensors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temperature_alerts_temperature_reading_id_fkey"
            columns: ["temperature_reading_id"]
            isOneToOne: false
            referencedRelation: "sensor_temperature_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      temperature_sensors: {
        Row: {
          alert_max_temperature: number | null
          alert_min_temperature: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_calibration_date: string | null
          location: string
          mac_address: string | null
          max_temperature: number
          min_temperature: number
          name: string
          next_calibration_date: string | null
          organization_id: string | null
          sensor_type: string
          updated_at: string | null
        }
        Insert: {
          alert_max_temperature?: number | null
          alert_min_temperature?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_calibration_date?: string | null
          location: string
          mac_address?: string | null
          max_temperature: number
          min_temperature: number
          name: string
          next_calibration_date?: string | null
          organization_id?: string | null
          sensor_type: string
          updated_at?: string | null
        }
        Update: {
          alert_max_temperature?: number | null
          alert_min_temperature?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_calibration_date?: string | null
          location?: string
          mac_address?: string | null
          max_temperature?: number
          min_temperature?: number
          name?: string
          next_calibration_date?: string | null
          organization_id?: string | null
          sensor_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temperature_sensors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_temperature_controls: {
        Row: {
          control_date: string
          created_at: string | null
          delivery_id: string | null
          id: string
          is_compliant: boolean
          storage_type: string
          truck_temperature: number
        }
        Insert: {
          control_date: string
          created_at?: string | null
          delivery_id?: string | null
          id?: string
          is_compliant: boolean
          storage_type: string
          truck_temperature: number
        }
        Update: {
          control_date?: string
          created_at?: string | null
          delivery_id?: string | null
          id?: string
          is_compliant?: boolean
          storage_type?: string
          truck_temperature?: number
        }
        Relationships: [
          {
            foreignKeyName: "truck_temperature_controls_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_name: string | null
          organization_id: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          organization_id?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          organization_id?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
