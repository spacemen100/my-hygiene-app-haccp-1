export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
          employee_id: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_equipment_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_equipment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_methods: {
        Row: {
          created_at: string | null
          description: string
          employee_id: string | null
          id: string
          name: string
          organization_id: string | null
          steps: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          employee_id?: string | null
          id?: string
          name: string
          organization_id?: string | null
          steps?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          employee_id?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          steps?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_methods_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_products: {
        Row: {
          brand: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          safety_instructions: string | null
          type: string | null
          usage_instructions: string | null
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          safety_instructions?: string | null
          type?: string | null
          usage_instructions?: string | null
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          safety_instructions?: string | null
          type?: string | null
          usage_instructions?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_products_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          employee_id: string | null
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
          employee_id?: string | null
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
          employee_id?: string | null
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
            foreignKeyName: "cleaning_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
          employee_id: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          cleaning_zone_id?: string | null
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          cleaning_zone_id?: string | null
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_sub_zones_cleaning_zone_id_fkey"
            columns: ["cleaning_zone_id"]
            isOneToOne: false
            referencedRelation: "cleaning_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_sub_zones_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_sub_zones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          employee_id: string | null
          frequency: string
          frequency_days: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          responsible_role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_to_perform: string
          cleaning_equipment_id?: string | null
          cleaning_method_id?: string | null
          cleaning_product_id?: string | null
          cleaning_sub_zone_id?: string | null
          cleaning_zone_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          frequency: string
          frequency_days?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          responsible_role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_to_perform?: string
          cleaning_equipment_id?: string | null
          cleaning_method_id?: string | null
          cleaning_product_id?: string | null
          cleaning_sub_zone_id?: string | null
          cleaning_zone_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          frequency?: string
          frequency_days?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          responsible_role?: string | null
          updated_at?: string | null
          user_id?: string | null
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
            foreignKeyName: "cleaning_tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_zones: {
        Row: {
          created_at: string | null
          description: string | null
          employee_id: string | null
          id: string
          name: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          name: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_zones_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_zones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_zones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cold_storage_temperature_readings: {
        Row: {
          cold_storage_unit_id: string | null
          comments: string | null
          created_at: string | null
          employee_id: string | null
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
          employee_id?: string | null
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
          employee_id?: string | null
          id?: string
          is_compliant?: boolean
          reading_date?: string
          temperature?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cold_storage_readings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
          employee_id: string | null
          id: string
          is_active: boolean | null
          location: string
          max_temperature: number
          min_temperature: number
          name: string
          organization_id: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          max_temperature: number
          min_temperature: number
          name: string
          organization_id?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          max_temperature?: number
          min_temperature?: number
          name?: string
          organization_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cold_storage_units_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cold_storage_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cold_storage_units_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cooling_records: {
        Row: {
          comments: string | null
          created_at: string | null
          employee_id: string | null
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
          employee_id?: string | null
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
          employee_id?: string | null
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
            foreignKeyName: "cooling_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
          employee_id: string | null
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
          employee_id?: string | null
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
          employee_id?: string | null
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
            foreignKeyName: "deliveries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
      employees: {
        Row: {
          created_at: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          organization_id: string
          password: string
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          organization_id: string
          password?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          organization_id?: string
          password?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
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
          employee_id: string | null
          expiry_date: string
          id: string
          label_count: number
          organization_id: string | null
          print_date: string | null
          printer_id: string | null
          product_label_type_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          expiry_date: string
          id?: string
          label_count: number
          organization_id?: string | null
          print_date?: string | null
          printer_id?: string | null
          product_label_type_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          expiry_date?: string
          id?: string
          label_count?: number
          organization_id?: string | null
          print_date?: string | null
          printer_id?: string | null
          product_label_type_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "label_printings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_printings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_printings_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
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
          employee_id: string | null
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
          employee_id?: string | null
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
          employee_id?: string | null
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
            foreignKeyName: "label_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
          employee_id: string | null
          id: string
          non_conformity_type: string
          other_cause: string | null
          photo_url: string | null
          product_name: string
          product_reception_control_id: string | null
          quantity: number | null
          quantity_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          non_conformity_type: string
          other_cause?: string | null
          photo_url?: string | null
          product_name: string
          product_reception_control_id?: string | null
          quantity?: number | null
          quantity_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          non_conformity_type?: string
          other_cause?: string | null
          photo_url?: string | null
          product_name?: string
          product_reception_control_id?: string | null
          quantity?: number | null
          quantity_type?: string | null
          user_id?: string | null
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
            foreignKeyName: "non_conformities_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_conformities_product_reception_control_id_fkey"
            columns: ["product_reception_control_id"]
            isOneToOne: false
            referencedRelation: "product_reception_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_conformities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          employee_id: string | null
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
          employee_id?: string | null
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
          employee_id?: string | null
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
            foreignKeyName: "oil_quality_controls_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          address: string | null
          connection_type: string
          created_at: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          label_size: string | null
          model: string
          name: string
          organization_id: string | null
          print_format: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          connection_type: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          label_size?: string | null
          model: string
          name: string
          organization_id?: string | null
          print_format?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          connection_type?: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          label_size?: string | null
          model?: string
          name?: string
          organization_id?: string | null
          print_format?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_label_types: {
        Row: {
          category: string
          created_at: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          shelf_life_days: number
          sub_category: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          shelf_life_days: number
          sub_category: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          shelf_life_days?: number
          sub_category?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_label_types_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_label_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_label_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          employee_id: string | null
          id: string
          is_compliant: boolean
          product_id: string | null
          product_name: string
          storage_type: string
          temperature: number | null
          use_by_date: string | null
          user_id: string | null
        }
        Insert: {
          best_before_date?: string | null
          control_date: string
          created_at?: string | null
          delivery_id?: string | null
          employee_id?: string | null
          id?: string
          is_compliant: boolean
          product_id?: string | null
          product_name: string
          storage_type?: string
          temperature?: number | null
          use_by_date?: string | null
          user_id?: string | null
        }
        Update: {
          best_before_date?: string | null
          control_date?: string
          created_at?: string | null
          delivery_id?: string | null
          employee_id?: string | null
          id?: string
          is_compliant?: boolean
          product_id?: string | null
          product_name?: string
          storage_type?: string
          temperature?: number | null
          use_by_date?: string | null
          user_id?: string | null
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
            foreignKeyName: "product_reception_controls_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reception_controls_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reception_controls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          employee_id: string | null
          id: string
          name: string
          organization_id: string | null
          shelf_life_days: number | null
          storage_type: string
          sub_category: string | null
          unit_of_measure: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          name: string
          organization_id?: string | null
          shelf_life_days?: number | null
          storage_type?: string
          sub_category?: string | null
          unit_of_measure?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          shelf_life_days?: number | null
          storage_type?: string
          sub_category?: string | null
          unit_of_measure?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_temperature_readings: {
        Row: {
          battery_level: number | null
          created_at: string | null
          employee_id: string | null
          humidity: number | null
          id: string
          is_alert: boolean | null
          reading_time: string
          sensor_id: string | null
          signal_strength: number | null
          temperature: number
          user_id: string | null
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          employee_id?: string | null
          humidity?: number | null
          id?: string
          is_alert?: boolean | null
          reading_time: string
          sensor_id?: string | null
          signal_strength?: number | null
          temperature: number
          user_id?: string | null
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          employee_id?: string | null
          humidity?: number | null
          id?: string
          is_alert?: boolean | null
          reading_time?: string
          sensor_id?: string | null
          signal_strength?: number | null
          temperature?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          employee_id: string | null
          id: string
          name: string
          organization_id: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          employee_id?: string | null
          id?: string
          name: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          employee_id?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          employee_id: string | null
          id: string
          is_resolved: boolean | null
          resolution_comment: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          sensor_id: string | null
          temperature_reading_id: string | null
          threshold_value: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_value?: number | null
          alert_time: string
          alert_type: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_resolved?: boolean | null
          resolution_comment?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          sensor_id?: string | null
          temperature_reading_id?: string | null
          threshold_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_value?: number | null
          alert_time?: string
          alert_type?: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_resolved?: boolean | null
          resolution_comment?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          sensor_id?: string | null
          temperature_reading_id?: string | null
          threshold_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temperature_alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "temperature_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      temperature_sensors: {
        Row: {
          alert_max_temperature: number | null
          alert_min_temperature: number | null
          created_at: string | null
          employee_id: string | null
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
          user_id: string | null
        }
        Insert: {
          alert_max_temperature?: number | null
          alert_min_temperature?: number | null
          created_at?: string | null
          employee_id?: string | null
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
          user_id?: string | null
        }
        Update: {
          alert_max_temperature?: number | null
          alert_min_temperature?: number | null
          created_at?: string | null
          employee_id?: string | null
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
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temperature_sensors_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temperature_sensors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temperature_sensors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_temperature_controls: {
        Row: {
          control_date: string
          created_at: string | null
          delivery_id: string | null
          employee_id: string | null
          id: string
          is_compliant: boolean
          storage_type: string
          truck_temperature: number
          user_id: string | null
        }
        Insert: {
          control_date: string
          created_at?: string | null
          delivery_id?: string | null
          employee_id?: string | null
          id?: string
          is_compliant: boolean
          storage_type: string
          truck_temperature: number
          user_id?: string | null
        }
        Update: {
          control_date?: string
          created_at?: string | null
          delivery_id?: string | null
          employee_id?: string | null
          id?: string
          is_compliant?: boolean
          storage_type?: string
          truck_temperature?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "truck_temp_controls_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "truck_temp_controls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
