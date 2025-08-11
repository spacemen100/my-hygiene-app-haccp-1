"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  // Timeout de sécurité pour forcer l'arrêt du loading après 10 secondes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('[EmployeeProvider] TIMEOUT: Forcing loading to false after 10 seconds');
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Load current user's employee record
  const loadCurrentEmployee = async () => {
    console.log('[EmployeeProvider] loadCurrentEmployee called with user:', user?.id);
    
    if (!user?.id) {
      console.log('[EmployeeProvider] No user ID, setting employee to null');
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
        .maybeSingle(); // Utilise maybeSingle au lieu de single pour éviter l'erreur PGRST116

      console.log('[EmployeeProvider] Employee query result:', { data, error });

      if (error) {
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
  const loadEmployees = useCallback(async () => {
    console.log('[EmployeeProvider] loadEmployees called');
    
    if (!user?.id) {
      console.log('[EmployeeProvider] No user ID, clearing employees');
      setEmployees([]);
      return;
    }

    try {
      setError(null);
      console.log('[EmployeeProvider] Loading all employees...');

      // First, try to get organization ID from current employee
      let organizationId: string | null = null;

      if (employee?.organization_id) {
        organizationId = employee.organization_id;
        console.log('[EmployeeProvider] Using org ID from current employee:', organizationId);
      } else {
        // If no current employee, get all organizations and use the first one (default behavior)
        console.log('[EmployeeProvider] No current employee, loading default organization');
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .order('created_at')
          .limit(1)
          .single();
        
        if (orgError && orgError.code !== 'PGRST116') {
          console.error('[EmployeeProvider] Error loading organization:', orgError);
          throw orgError;
        }
        
        organizationId = orgData?.id || null;
        console.log('[EmployeeProvider] Using default org ID:', organizationId);
      }

      if (!organizationId) {
        console.log('[EmployeeProvider] No organization ID found, clearing employees');
        setEmployees([]);
        return;
      }

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', organizationId)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      console.log('[EmployeeProvider] Employees query result:', { data, error, count: data?.length });

      if (error) throw error;

      setEmployees(data || []);
      console.log('[EmployeeProvider] Employees loaded successfully:', data?.length || 0);
    } catch (err) {
      console.error('[EmployeeProvider] Error loading employees:', err);
      setError('Erreur lors du chargement des employés');
      setEmployees([]);
    }
  }, [user?.id, employee?.organization_id]);

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
    console.log('[EmployeeProvider] useEffect triggered with:', {
      session: !!session,
      user: !!user,
      userId: user?.id,
      accessToken: !!session?.access_token,
      loading
    });
    
    const loadData = async () => {
      console.log('[EmployeeProvider] Starting to load data');
      setLoading(true);
      try {
        await loadCurrentEmployee();
      } catch (err) {
        console.error('[EmployeeProvider] Error in loadData:', err);
      } finally {
        console.log('[EmployeeProvider] Data loaded, setting loading to false');
        setLoading(false);
      }
    };

    if (session && user?.id) {
      console.log('[EmployeeProvider] Session and user ID exist, loading data');
      loadData();
    } else {
      console.log('[EmployeeProvider] No session or user ID, clearing data and stopping loading');
      setEmployee(null);
      setEmployees([]);
      setLoading(false);
    }
  }, [user?.id, session?.access_token]);

  // Load employees when user is loaded (independent of current employee)
  useEffect(() => {
    if (user?.id && !loading) {
      console.log('[EmployeeProvider] Loading employees for user:', user.id);
      loadEmployees();
    }
  }, [user?.id, loading, loadEmployees]);

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