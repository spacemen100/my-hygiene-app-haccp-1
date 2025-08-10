"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/src/types/database';
import { useAuth } from '@/components/AuthProvider';

type Employee = Tables<'employees'>;

interface EmployeeContextType {
  employee: Employee | null;
  employees: Employee[];
  loading: boolean;
  error: string | null;
  refreshEmployee: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  setCurrentEmployee: (employee: Employee | null) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  console.log('[EmployeeProvider] Component rendering');
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();
  
  console.log('[EmployeeProvider] Auth state:', { user: !!user, userId: user?.id, session: !!session });

  // Load current user's employee record
  const loadCurrentEmployee = async () => {
    console.log('[EmployeeProvider] loadCurrentEmployee called with user:', user?.id);
    
    if (!user) {
      console.log('[EmployeeProvider] No user, setting employee to null');
      setEmployee(null);
      return;
    }

    try {
      console.log('[EmployeeProvider] Loading employee for user:', user.id);
      setError(null);
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      console.log('[EmployeeProvider] Employee query result:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[EmployeeProvider] Error loading employee:', error);
        throw error;
      }

      console.log('[EmployeeProvider] Setting employee:', data || null);
      setEmployee(data || null);
    } catch (err) {
      console.error('[EmployeeProvider] Error loading current employee:', err);
      setError('Erreur lors du chargement du profil employé');
      setEmployee(null);
    }
  };

  // Load all employees for the organization
  const loadEmployees = async () => {
    if (!user) {
      setEmployees([]);
      return;
    }

    try {
      setError(null);

      // Get user's organization from the current employee record or user profile
      let organizationId: string | null = null;

      if (employee?.organization_id) {
        organizationId = employee.organization_id;
      } else {
        // Try to get organization from users table
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        organizationId = userData?.organization_id || null;
      }

      if (!organizationId) {
        setEmployees([]);
        return;
      }

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', organizationId)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (error) throw error;

      setEmployees(data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Erreur lors du chargement des employés');
      setEmployees([]);
    }
  };

  const refreshEmployee = async () => {
    setLoading(true);
    await loadCurrentEmployee();
    setLoading(false);
  };

  const refreshEmployees = async () => {
    await loadEmployees();
  };

  const setCurrentEmployee = (emp: Employee | null) => {
    setEmployee(emp);
  };

  // Load employee data when user changes
  useEffect(() => {
    console.log('[EmployeeProvider] useEffect triggered with session:', !!session, 'user:', !!user);
    
    const loadData = async () => {
      console.log('[EmployeeProvider] Starting to load data');
      setLoading(true);
      await loadCurrentEmployee();
      console.log('[EmployeeProvider] Data loaded, setting loading to false');
      setLoading(false);
    };

    if (session) {
      console.log('[EmployeeProvider] Session exists, loading data');
      loadData();
    } else {
      console.log('[EmployeeProvider] No session, clearing data');
      setEmployee(null);
      setEmployees([]);
      setLoading(false);
    }
  }, [user, session]);

  // Load employees when current employee is loaded
  useEffect(() => {
    if (employee) {
      loadEmployees();
    }
  }, [employee]);

  return (
    <EmployeeContext.Provider
      value={{
        employee,
        employees,
        loading,
        error,
        refreshEmployee,
        refreshEmployees,
        setCurrentEmployee,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
}

// Helper function to get full employee name
export function getEmployeeFullName(employee: Employee | null): string {
  if (!employee) return '';
  return `${employee.first_name} ${employee.last_name}`.trim();
}

// Helper function to get employee display name with role
export function getEmployeeDisplayName(employee: Employee | null): string {
  if (!employee) return '';
  const fullName = getEmployeeFullName(employee);
  return employee.role ? `${fullName} (${employee.role})` : fullName;
}