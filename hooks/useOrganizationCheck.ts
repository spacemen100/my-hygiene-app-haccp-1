"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export function useOrganizationCheck() {
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Pages qui ne nécessitent pas de vérification d'organisation
  const excludedPages = [
    '/login', 
    '/register', 
    '/admin-questionnaire-prise-en-main'
  ];

  useEffect(() => {
    const checkOrganization = async () => {
      // Si on est sur une page exclue, pas besoin de vérifier
      if (excludedPages.includes(pathname)) {
        setHasOrganization(true); // Permettre l'accès
        setLoading(false);
        return;
      }

      if (!user?.id || !session) {
        setLoading(false);
        return;
      }

      try {
        console.log('[useOrganizationCheck] Vérification de l\'organisation pour l\'utilisateur:', user.id);

        // Vérifier si l'utilisateur a une organisation associée
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (employeeError && employeeError.code !== 'PGRST116') {
          console.error('[useOrganizationCheck] Erreur lors de la vérification de l\'employé:', employeeError);
          setHasOrganization(false);
          setLoading(false);
          return;
        }

        if (!employee?.organization_id) {
          // Aucune organisation trouvée, rediriger vers le questionnaire
          console.log('[useOrganizationCheck] Aucune organisation trouvée pour l\'utilisateur - redirection vers questionnaire');
          setHasOrganization(false);
          setLoading(false);
          router.push('/admin-questionnaire-prise-en-main');
          return;
        }

        console.log('[useOrganizationCheck] Employé trouvé avec organisation:', employee.organization_id);

        // Vérifier que l'organisation existe dans la base de données
        const { data: organization, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', employee.organization_id)
          .single();

        if (orgError || !organization) {
          // L'organisation n'existe pas, rediriger vers le questionnaire
          console.log('[useOrganizationCheck] Organisation non trouvée dans la base - redirection vers questionnaire');
          setHasOrganization(false);
          setLoading(false);
          router.push('/admin-questionnaire-prise-en-main');
          return;
        }

        console.log('[useOrganizationCheck] Organisation valide trouvée:', organization.name);
        // Tout est ok, l'utilisateur a une organisation valide
        setHasOrganization(true);
        setLoading(false);

      } catch (error) {
        console.error('[useOrganizationCheck] Erreur lors de la vérification de l\'organisation:', error);
        setHasOrganization(false);
        setLoading(false);
      }
    };

    checkOrganization();
  }, [user?.id, session, router, pathname]);

  return { hasOrganization, loading };
}