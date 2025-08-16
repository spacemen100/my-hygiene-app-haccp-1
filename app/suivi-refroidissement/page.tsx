"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert, Tables } from '@/src/types/database';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Autocomplete
} from '@mui/material';
import {
  AcUnit,
  TrendingDown,
  Timer,
  CheckCircle,
  Cancel,
  Save,
  Schedule,
  Thermostat,
  Speed,
  AccessTime,
  TrendingUp,
  Edit,
  Delete,
  History,
  Add,
  Restaurant,
  Category,
  Warning
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function CoolingTracking() {
  const { employee } = useEmployee();
  const { user } = useAuth();
  const [formData, setFormData] = useState<TablesInsert<'cooling_records'>>({
    start_date: new Date().toISOString(),
    end_date: null,
    product_name: '',
    product_type: '',
    start_core_temperature: 0,
    end_core_temperature: null,
    is_compliant: null,
    comments: null,
    organization_id: null,
    user_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<Tables<'cooling_records'>[]>([]);
  const [recordCategories, setRecordCategories] = useState<Record<string, string>>({});
  const [editingRecord, setEditingRecord] = useState<Tables<'cooling_records'> | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<TablesInsert<'cooling_records'>>({
    start_date: new Date().toISOString(),
    end_date: null,
    product_name: '',
    product_type: '',
    start_core_temperature: 0,
    end_core_temperature: null,
    is_compliant: null,
    comments: null,
    organization_id: null,
    user_id: null,
  });
  
  // États spécifiques pour les sélections dans le modal d'édition
  const [editSelectedFoodProduct, setEditSelectedFoodProduct] = useState<Tables<'food_products'> | null>(null);
  const [editSelectedProductType, setEditSelectedProductType] = useState<Tables<'product_types'> | null>(null);
  const [editSelectedNonConformity, setEditSelectedNonConformity] = useState<Tables<'non_conformities'> | null>(null);
  const [editSelectedCategory, setEditSelectedCategory] = useState<string>('');
  const [editSelectedProductCategory, setEditSelectedProductCategory] = useState<{id: string, name: string, description?: string, created_at: string, organization_id: string | null} | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Tables<'cooling_records'> | null>(null);
  
  // Nouveaux états pour les produits et non-conformités
  const [foodProducts, setFoodProducts] = useState<Tables<'food_products'>[]>([]);
  const [productTypes, setProductTypes] = useState<Tables<'product_types'>[]>([]);
  const [nonConformities, setNonConformities] = useState<Tables<'non_conformities'>[]>([]);
  const [productCategories, setProductCategories] = useState<{id: string, name: string, description?: string, created_at: string, organization_id: string | null}[]>([]);
  const [selectedFoodProduct, setSelectedFoodProduct] = useState<Tables<'food_products'> | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<Tables<'product_types'> | null>(null);
  const [selectedNonConformity, setSelectedNonConformity] = useState<Tables<'non_conformities'> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProductCategory, setSelectedProductCategory] = useState<{id: string, name: string, description?: string, created_at: string, organization_id: string | null} | null>(null);
  
  // États pour les modals d'ajout
  const [addFoodProductOpen, setAddFoodProductOpen] = useState(false);
  const [addProductTypeOpen, setAddProductTypeOpen] = useState(false);
  const [addNonConformityOpen, setAddNonConformityOpen] = useState(false);
  const [addProductCategoryOpen, setAddProductCategoryOpen] = useState(false);
  
  const { enqueueSnackbar } = useSnackbar();

  const formatDateTimeForInput = (isoString: string) => {
    return isoString.substring(0, 16);
  };

  const loadFoodProducts = async () => {
    try {
      const orgId = (user as any)?.organization_id || employee?.organization_id;
      if (!orgId) {
        console.log('No organization ID available for food products');
        return;
      }

      // Test simple pour vérifier si la table existe
      const { data, error } = await supabase
        .from('food_products')
        .select('id, name, category, food_type')
        .eq('organization_id', orgId)
        .limit(10);

      if (error) {
        console.error('Supabase error loading food products:', error);
        // Si la table n'existe pas, on continue sans erreur
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('Table food_products does not exist yet, using sample data...');
          // Données de démonstration
          const sampleFoodProducts = [
            {
              id: 'sample-1',
              name: 'Rôti de porc',
              category: 'Viande',
              food_type: 'Porc',
              description: 'Rôti de porc cuit',
              sub_category: 'Rôti',
              storage_condition: 'Réfrigéré',
              min_storage_temperature: 0,
              max_storage_temperature: 4,
              target_cooling_rate: 10,
              haccp_cooling_standard: '65°C à 10°C en 6h',
              shelf_life_days: 3,
              is_active: true,
              organization_id: orgId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              employee_id: null,
              user_id: null
            },
            {
              id: 'sample-2',
              name: 'Escalopes de volaille',
              category: 'Viande',
              food_type: 'Volaille',
              description: 'Escalopes de volaille cuites',
              sub_category: 'Escalope',
              storage_condition: 'Réfrigéré',
              min_storage_temperature: 0,
              max_storage_temperature: 4,
              target_cooling_rate: 12,
              haccp_cooling_standard: '65°C à 10°C en 6h',
              shelf_life_days: 2,
              is_active: true,
              organization_id: orgId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              employee_id: null,
              user_id: null
            }
          ] as Tables<'food_products'>[];
          setFoodProducts(sampleFoodProducts);
          return;
        }
        throw error;
      }
      
      setFoodProducts(data || []);
    } catch (error) {
      console.error('Error loading food products:', error);
      setFoodProducts([]);
    }
  };

  const loadProductTypes = async () => {
    try {
      const orgId = (user as any)?.organization_id || employee?.organization_id;
      
      if (!orgId) {
        console.log('No organization ID available for product types');
        return;
      }

      // Test simple pour vérifier si la table existe
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .limit(10);

      if (error) {
        console.error('Supabase error loading product types:', error);
        // Si la table n'existe pas, on continue sans erreur
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('Table product_types does not exist yet, using sample data...');
          // Données de démonstration
          const sampleProductTypes = [
            {
              id: 'type-1',
              name: 'Viande rouge',
              description: 'Bœuf, porc, agneau et autres viandes rouges',
              cooling_requirements: { temperature_max: 10, time_max_hours: 6 },
              haccp_guidelines: 'Refroidissement rapide de 65°C à 10°C en moins de 6 heures',
              organization_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'type-2',
              name: 'Volaille',
              description: 'Poulet, dinde, canard et autres volailles',
              cooling_requirements: { temperature_max: 8, time_max_hours: 4 },
              haccp_guidelines: 'Refroidissement très rapide de 65°C à 8°C en moins de 4 heures',
              organization_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'type-3',
              name: 'Plats cuisinés',
              description: 'Plats préparés, sauces et préparations culinaires',
              cooling_requirements: { temperature_max: 10, time_max_hours: 6 },
              haccp_guidelines: 'Refroidissement de 63°C à 10°C en moins de 6 heures',
              organization_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ] as Tables<'product_types'>[];
          setProductTypes(sampleProductTypes);
          return;
        }
        throw error;
      }
      
      setProductTypes(data || []);
    } catch (error) {
      console.error('Error loading product types:', error);
      setProductTypes([]);
    }
  };

  const loadNonConformities = async () => {
    try {
      const { data, error } = await supabase
        .from('non_conformities')
        .select('non_conformity_type')
        .order('non_conformity_type');

      if (error) {
        console.error('Supabase error loading non-conformities:', error);
        // Si la table n'existe pas ou est vide, on utilise les types par défaut
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('Table non_conformities does not exist yet, using default types...');
        }
        // Utiliser les types par défaut
        const defaultNonConformities = [
          'Reduced product life',
          'Prolonged operation', 
          'Discarded product'
        ];
        
        const formattedNonConformities = defaultNonConformities.map(type => ({
          id: type.toLowerCase().replace(/\s+/g, '-'),
          non_conformity_type: type,
          product_name: '',
          created_at: null,
          employee_id: null,
          user_id: null,
          delivery_id: null,
          product_reception_control_id: null,
          quantity: null,
          quantity_type: null,
          photo_url: null,
          description: null,
          other_cause: null
        }));
        
        setNonConformities(formattedNonConformities as Tables<'non_conformities'>[]);
        return;
      }
      
      // Si la requête réussit mais aucune donnée, ajouter les types par défaut
      const existingTypes = [...new Set(data?.map(item => item.non_conformity_type) || [])];
      
      if (existingTypes.length === 0) {
        const defaultNonConformities = [
          'Reduced product life',
          'Prolonged operation', 
          'Discarded product'
        ];
        
        const formattedNonConformities = defaultNonConformities.map(type => ({
          id: type.toLowerCase().replace(/\s+/g, '-'),
          non_conformity_type: type,
          product_name: '',
          created_at: null,
          employee_id: null,
          user_id: null,
          delivery_id: null,
          product_reception_control_id: null,
          quantity: null,
          quantity_type: null,
          photo_url: null,
          description: null,
          other_cause: null
        }));
        
        setNonConformities(formattedNonConformities as Tables<'non_conformities'>[]);
      } else {
        // Extraction des types uniques de non-conformités
        const formattedNonConformities = existingTypes.map(type => ({
          id: type,
          non_conformity_type: type,
          product_name: '',
          created_at: null,
          employee_id: null,
          user_id: null,
          delivery_id: null,
          product_reception_control_id: null,
          quantity: null,
          quantity_type: null,
          photo_url: null,
          description: null,
          other_cause: null
        }));
        
        setNonConformities(formattedNonConformities as Tables<'non_conformities'>[]);
      }
    } catch (error) {
      console.error('Error loading non-conformities:', error);
      // En cas d'erreur, utiliser les types par défaut
      const defaultNonConformities = [
        'Reduced product life',
        'Prolonged operation', 
        'Discarded product'
      ];
      
      const formattedNonConformities = defaultNonConformities.map(type => ({
        id: type.toLowerCase().replace(/\s+/g, '-'),
        non_conformity_type: type,
        product_name: '',
        created_at: null,
        employee_id: null,
        user_id: null,
        delivery_id: null,
        product_reception_control_id: null,
        quantity: null,
        quantity_type: null,
        photo_url: null,
        description: null,
        other_cause: null
      }));
      
      setNonConformities(formattedNonConformities as Tables<'non_conformities'>[]);
    }
  };

  const loadHistoryRecords = async () => {
    try {
      const orgId = (user as any)?.organization_id || employee?.organization_id;
      const userId = user?.id;
      const employeeId = employee?.id;
      
      if (!orgId && !userId && !employeeId) {
        console.log('No identification available, skipping history load');
        return;
      }

      let query = supabase.from('cooling_records').select('*');
      
      if (orgId) {
        // Priorité à l'organization_id si disponible
        query = query.or(`organization_id.eq.${orgId},organization_id.is.null`);
        if (userId) query = query.eq('user_id', userId);
        else if (employeeId) query = query.eq('employee_id', employeeId);
      } else if (userId) {
        // Sinon filtrer par user_id
        query = query.eq('user_id', userId);
      } else if (employeeId) {
        // Ou par employee_id
        query = query.eq('employee_id', employeeId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setHistoryRecords(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      enqueueSnackbar('Erreur lors du chargement de l\'historique', { variant: 'error' });
    }
  };

  const loadProductCategories = async () => {
    try {
      // Pour la démonstration, utiliser des catégories par défaut
      const defaultCategories = [
        'Viandes',
        'Poissons', 
        'Légumes',
        'Fruits',
        'Produits laitiers',
        'Céréales',
        'Légumineuses',
        'Huiles et graisses',
        'Condiments',
        'Boissons',
        'Produits surgelés',
        'Conserves',
        'Autres'
      ];

      const formattedCategories = defaultCategories.map((category, index) => ({
        id: `category-${index + 1}`,
        name: category,
        description: `Catégorie ${category}`,
        created_at: new Date().toISOString(),
        organization_id: (user as any)?.organization_id || null
      }));

      setProductCategories(formattedCategories);
    } catch (error) {
      console.error('Error loading product categories:', error);
      enqueueSnackbar('Erreur lors du chargement des catégories', { variant: 'error' });
    }
  };

  const handleEdit = (record: Tables<'cooling_records'>) => {
    setEditingRecord(record);
    setEditFormData({
      start_date: record.start_date,
      end_date: record.end_date,
      product_name: record.product_name,
      product_type: record.product_type,
      start_core_temperature: record.start_core_temperature,
      end_core_temperature: record.end_core_temperature,
      is_compliant: record.is_compliant,
      comments: record.comments,
      organization_id: record.organization_id,
      user_id: record.user_id,
    });
    
    // Initialiser les sélections basées sur les données de l'enregistrement
    const matchingFoodProduct = foodProducts.find(product => product.name === record.product_name);
    const matchingProductType = productTypes.find(type => type.name === record.product_type);
    const recordCategory = recordCategories[record.id] || '';
    
    setEditSelectedFoodProduct(matchingFoodProduct || null);
    setEditSelectedProductType(matchingProductType || null);
    setEditSelectedNonConformity(null); // Reset non-conformity selection
    setEditSelectedCategory(recordCategory);
    
    setEditModalOpen(true);
  };

  const calculateEditCoolingRate = () => {
    if (editFormData.end_core_temperature === null || editFormData.end_core_temperature === undefined || !editFormData.end_date) return null;
    
    const startTime = new Date(editFormData.start_date).getTime();
    const endTime = new Date(editFormData.end_date).getTime();
    const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
    
    if (timeDiffHours <= 0) return null;
    
    const tempDiff = editFormData.start_core_temperature - editFormData.end_core_temperature;
    return tempDiff / timeDiffHours;
  };

  const getEditCoolingStatus = () => {
    const rate = calculateEditCoolingRate();
    if (!rate || !editFormData.end_core_temperature) return 'pending';
    
    if (editFormData.start_core_temperature >= 65 && editFormData.end_core_temperature <= 10) {
      const startTime = new Date(editFormData.start_date).getTime();
      const endTime = editFormData.end_date ? new Date(editFormData.end_date).getTime() : Date.now();
      const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
      
      if (timeDiffHours <= 6) return 'compliant';
    }
    
    return editFormData.end_core_temperature <= 10 ? 'warning' : 'non-compliant';
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    setLoading(true);
    try {
      const status = getEditCoolingStatus();
      const updatedFormData = {
        ...editFormData,
        is_compliant: status === 'compliant' || status === 'warning'
      };

      const { error } = await supabase
        .from('cooling_records')
        .update({
          ...updatedFormData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      // Mettre à jour la catégorie pour ce record
      if (editSelectedCategory) {
        setRecordCategories(prev => ({
          ...prev,
          [editingRecord.id]: editSelectedCategory
        }));
      }

      enqueueSnackbar('Enregistrement modifié avec succès!', { variant: 'success' });
      setEditingRecord(null);
      setEditModalOpen(false);
      loadHistoryRecords();
      
      setEditFormData({
        start_date: new Date().toISOString(),
        end_date: null,
        product_name: '',
        product_type: '',
        start_core_temperature: 0,
        end_core_temperature: null,
        is_compliant: null,
        comments: null,
        organization_id: null,
        user_id: null,
      });
    } catch (error) {
      console.error('Error updating record:', error);
      enqueueSnackbar('Erreur lors de la modification', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
      const { error } = await supabase
        .from('cooling_records')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) throw error;

      enqueueSnackbar('Enregistrement supprimé avec succès!', { variant: 'success' });
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      loadHistoryRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingRecord(null);
    setEditFormData({
      start_date: new Date().toISOString(),
      end_date: null,
      product_name: '',
      product_type: '',
      start_core_temperature: 0,
      end_core_temperature: null,
      is_compliant: null,
      comments: null,
      organization_id: null,
      user_id: null,
    });
    
    // Reset des sélections du modal d'édition
    setEditSelectedFoodProduct(null);
    setEditSelectedProductType(null);
    setEditSelectedNonConformity(null);
    setEditSelectedCategory('');
  };

  const handleCreateFoodProduct = async (productData: TablesInsert<'food_products'>) => {
    try {
      const { data, error } = await supabase
        .from('food_products')
        .insert([{
          ...productData,
          organization_id: (user as any)?.organization_id || employee?.organization_id || '',
          employee_id: employee?.id || null,
          user_id: user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setFoodProducts(prev => [...prev, data]);
      setSelectedFoodProduct(data);
      setAddFoodProductOpen(false);
      enqueueSnackbar('Produit alimentaire créé avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error creating food product:', error);
      enqueueSnackbar('Erreur lors de la création du produit', { variant: 'error' });
    }
  };

  const handleCreateProductType = async (typeData: TablesInsert<'product_types'>) => {
    try {
      const { data, error } = await supabase
        .from('product_types')
        .insert([{
          ...typeData,
          organization_id: (user as any)?.organization_id || employee?.organization_id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setProductTypes(prev => [...prev, data]);
      setSelectedProductType(data);
      setAddProductTypeOpen(false);
      enqueueSnackbar('Type de produit créé avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error creating product type:', error);
      enqueueSnackbar('Erreur lors de la création du type de produit', { variant: 'error' });
    }
  };

  const handleCreateNonConformity = async (nonConformityType: string) => {
    try {
      const newNonConformity = {
        id: nonConformityType,
        non_conformity_type: nonConformityType,
        product_name: '',
        created_at: null,
        employee_id: null,
        user_id: null,
        delivery_id: null,
        product_reception_control_id: null,
        quantity: null,
        quantity_type: null,
        photo_url: null,
        description: null,
        other_cause: null
      } as Tables<'non_conformities'>;

      setNonConformities(prev => [...prev, newNonConformity]);
      setSelectedNonConformity(newNonConformity);
      setAddNonConformityOpen(false);
      enqueueSnackbar('Type de non-conformité ajouté avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error creating non-conformity:', error);
      enqueueSnackbar('Erreur lors de la création de la non-conformité', { variant: 'error' });
    }
  };

  const handleCreateProductCategory = async (categoryData: {name: string, description?: string}) => {
    try {
      const newCategory = {
        id: `category-${Date.now()}`,
        name: categoryData.name,
        description: categoryData.description || '',
        created_at: new Date().toISOString(),
        organization_id: (user as any)?.organization_id || null
      };

      setProductCategories(prev => [...prev, newCategory]);
      setSelectedProductCategory(newCategory);
      setSelectedCategory(newCategory.name);
      setAddProductCategoryOpen(false);
      enqueueSnackbar('Catégorie de produit créée avec succès!', { variant: 'success' });
    } catch (error) {
      console.error('Error creating product category:', error);
      enqueueSnackbar('Erreur lors de la création de la catégorie', { variant: 'error' });
    }
  };

  useEffect(() => {
    const orgId = (user as any)?.organization_id || employee?.organization_id;
    const userId = user?.id;
    const employeeId = employee?.id;
    
    if (orgId || userId || employeeId) {
      loadHistoryRecords();
      loadFoodProducts();
      loadProductTypes();
      loadNonConformities();
      loadProductCategories();
    }
  }, [(user as any)?.organization_id, employee?.organization_id, user?.id, employee?.id]);

  const calculateCoolingRate = () => {
    if (formData.end_core_temperature === null || formData.end_core_temperature === undefined || !formData.end_date) return null;
    
    const startTime = new Date(formData.start_date).getTime();
    const endTime = new Date(formData.end_date).getTime();
    const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
    
    if (timeDiffHours <= 0) return null;
    
    const tempDiff = formData.start_core_temperature - formData.end_core_temperature;
    return tempDiff / timeDiffHours; // °C/h
  };

  const getCoolingStatus = () => {
    const rate = calculateCoolingRate();
    if (!rate || !formData.end_core_temperature) return 'pending';
    
    // Règle générale : refroidissement de 65°C à 10°C en 6h max (HACCP)
    if (formData.start_core_temperature >= 65 && formData.end_core_temperature <= 10) {
      const startTime = new Date(formData.start_date).getTime();
      const endTime = formData.end_date ? new Date(formData.end_date).getTime() : Date.now();
      const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60);
      
      if (timeDiffHours <= 6) return 'compliant';
    }
    
    return formData.end_core_temperature <= 10 ? 'warning' : 'non-compliant';
  };

  const handleFoodProductSelect = (product: Tables<'food_products'> | null) => {
    setSelectedFoodProduct(product);
    if (product) {
      // Trouver la catégorie correspondante
      const matchingCategory = productCategories.find(cat => cat.name === product.category);
      setSelectedProductCategory(matchingCategory || null);
      setSelectedCategory(product.category);
      
      setFormData(prev => ({
        ...prev,
        product_name: product.name,
        product_type: product.food_type
      }));
      // Aussi mettre à jour le type de produit sélectionné basé sur le food_type
      const matchingType = productTypes.find(type => type.name === product.food_type);
      setSelectedProductType(matchingType || null);
    } else {
      setSelectedProductCategory(null);
      setSelectedCategory('');
    }
  };

  const handleProductTypeSelect = (productType: Tables<'product_types'> | null) => {
    setSelectedProductType(productType);
    if (productType) {
      setFormData(prev => ({
        ...prev,
        product_type: productType.name
      }));
    }
  };

  const handleProductCategorySelect = (category: {id: string, name: string, description?: string, created_at: string, organization_id: string | null} | null) => {
    setSelectedProductCategory(category);
    if (category) {
      setSelectedCategory(category.name);
    } else {
      setSelectedCategory('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const status = getCoolingStatus();
      const updatedFormData = {
        ...formData,
        is_compliant: status === 'compliant' || status === 'warning'
      };
      
      const newRecord = {
        ...updatedFormData,
        organization_id: (user as any)?.organization_id || employee?.organization_id || null,
        employee_id: employee?.id || null,
        user_id: user?.id || null,
      };

      const { data, error } = await supabase
        .from('cooling_records')
        .insert([newRecord])
        .select()
        .single();
      
      if (error) throw error;
      
      // Stocker la catégorie pour ce record
      if (data && selectedCategory) {
        setRecordCategories(prev => ({
          ...prev,
          [data.id]: selectedCategory
        }));
      }
      
      enqueueSnackbar('Enregistrement de refroidissement réussi!', { variant: 'success' });
      loadHistoryRecords();
      
      // Reset form and selections
      setFormData({
        start_date: new Date().toISOString(),
        end_date: null,
        product_name: '',
        product_type: '',
        start_core_temperature: 0,
        end_core_temperature: null,
        is_compliant: null,
        comments: null,
        organization_id: null,
        user_id: null,
      });
      setSelectedFoodProduct(null);
      setSelectedProductType(null);
      setSelectedNonConformity(null);
      setSelectedCategory('');
    } catch (error) {
      console.error('Error saving cooling record:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const coolingRate = calculateCoolingRate();
  const coolingStatus = getCoolingStatus();

  // Calculer les statistiques
  const stats = {
    tempStart: formData.start_core_temperature || 0,
    tempEnd: formData.end_core_temperature || null,
    coolingRate: coolingRate,
    timeRemaining: formData.end_date && formData.start_date ? 
      Math.max(0, (new Date(formData.start_date).getTime() + 6 * 60 * 60 * 1000) - Date.now()) / (1000 * 60 * 60) : null
  };

  const getProgressValue = () => {
    if (!formData.end_core_temperature || formData.start_core_temperature <= 10) return 0;
    return Math.min(100, ((formData.start_core_temperature - formData.end_core_temperature) / 
           Math.max(1, formData.start_core_temperature - 10)) * 100);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header avec gradient moderne */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              width: 80,
              height: 80,
            }}
          >
            <TrendingDown fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Suivi de Refroidissement HACCP
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              Contrôle de la chaîne du froid et conformité réglementaire
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Objectif HACCP : 65°C → 10°C en moins de 6 heures
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl">
        
        {/* Statistiques rapides */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Temp. de départ
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.tempStart}°C
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#f4433620', color: '#f44336' }}>
                    <TrendingUp />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Temp. actuelle
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.tempEnd !== null ? `${stats.tempEnd}°C` : '-'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196f320', color: '#2196f3' }}>
                    <Thermostat />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Vitesse refroid.
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stats.coolingRate ? `${stats.coolingRate.toFixed(1)}°C/h` : '-'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9c27b020', color: '#9c27b0' }}>
                    <Speed />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box>
            <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Conformité
                    </Typography>
                    <Chip
                      label={
                        coolingStatus === 'compliant' ? 'Conforme' :
                        coolingStatus === 'warning' ? 'Acceptable' :
                        coolingStatus === 'non-compliant' ? 'Non conforme' : 'En cours'
                      }
                      color={
                        coolingStatus === 'compliant' ? 'success' :
                        coolingStatus === 'warning' ? 'warning' :
                        coolingStatus === 'non-compliant' ? 'error' : 'default'
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: coolingStatus === 'compliant' ? '#4caf5020' : 
                            coolingStatus === 'warning' ? '#ff980020' : 
                            coolingStatus === 'non-compliant' ? '#f4433620' : '#grey20',
                    color: coolingStatus === 'compliant' ? '#4caf50' : 
                           coolingStatus === 'warning' ? '#ff9800' : 
                           coolingStatus === 'non-compliant' ? '#f44336' : '#grey'
                  }}>
                    <AccessTime />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Formulaire principal */}
        <Card sx={{ transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: '#2196f320', color: '#2196f3' }}>
                <AcUnit />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Enregistrement de Refroidissement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Traçabilité du processus de refroidissement HACCP
                </Typography>
              </Box>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                {/* Sélection du produit alimentaire */}
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <Autocomplete
                      options={foodProducts}
                      getOptionLabel={(option) => option.name}
                      value={selectedFoodProduct}
                      onChange={(_, newValue) => handleFoodProductSelect(newValue)}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Nom du produit *"
                          placeholder="Sélectionner un produit..."
                          required={!formData.product_name}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Restaurant fontSize="small" color="primary" />
                              <Box>
                                <Typography variant="body2">{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.category} - {option.food_type}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                    <Tooltip title="Ajouter un nouveau produit">
                      <IconButton 
                        onClick={() => setAddFoodProductOpen(true)}
                        color="primary"
                        sx={{ mb: 0.5 }}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {!selectedFoodProduct && (
                    <TextField
                      label="Ou saisir manuellement"
                      value={formData.product_name}
                      onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                      fullWidth
                      size="small"
                      sx={{ mt: 1 }}
                      placeholder="Ex: Rôti de porc, Escalopes de volaille..."
                    />
                  )}
                  
                  {/* Affichage de la catégorie sélectionnée */}
                  {selectedCategory && (
                    <TextField
                      label="Catégorie du produit"
                      value={selectedCategory}
                      fullWidth
                      size="small"
                      sx={{ mt: 1 }}
                      slotProps={{
                        input: {
                          readOnly: true,
                          sx: { 
                            bgcolor: 'success.light', 
                            color: 'success.contrastText',
                            '& .MuiInputBase-input': { color: 'success.main', fontWeight: 500 }
                          }
                        }
                      }}
                    />
                  )}
                </Box>
                
                {/* Sélection du type de produit */}
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <Autocomplete
                      options={productTypes}
                      getOptionLabel={(option) => option.name}
                      value={selectedProductType}
                      onChange={(_, newValue) => handleProductTypeSelect(newValue)}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Type de produit *"
                          placeholder="Sélectionner un type..."
                          required={!formData.product_type}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Category fontSize="small" color="secondary" />
                              <Box>
                                <Typography variant="body2">{option.name}</Typography>
                                {option.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {option.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                    <Tooltip title="Ajouter un nouveau type de produit">
                      <IconButton 
                        onClick={() => setAddProductTypeOpen(true)}
                        color="secondary"
                        sx={{ mb: 0.5 }}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {!selectedProductType && (
                    <TextField
                      label="Ou saisir manuellement"
                      value={formData.product_type}
                      onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                      fullWidth
                      size="small"
                      sx={{ mt: 1 }}
                      placeholder="Ex: Volaille, Porc, Bœuf..."
                    />
                  )}
                </Box>
                
                <Box>
                  <TextField
                    label="Température initiale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={formData.start_core_temperature}
                    onChange={(e) => setFormData({...formData, start_core_temperature: Number(e.target.value)})}
                    required
                    fullWidth
                    helperText="Température à cœur au début du refroidissement"
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Température finale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={formData.end_core_temperature || ''}
                    onChange={(e) => setFormData({...formData, end_core_temperature: e.target.value ? Number(e.target.value) : null})}
                    fullWidth
                    helperText="Température à cœur à la fin (optionnel si en cours)"
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Date et heure de début"
                    type="datetime-local"
                    value={formatDateTimeForInput(formData.start_date)}
                    onChange={(e) => setFormData({...formData, start_date: new Date(e.target.value).toISOString()})}
                    required
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Date et heure de fin"
                    type="datetime-local"
                    value={formData.end_date ? formatDateTimeForInput(formData.end_date) : ''}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                    helperText="Laisser vide si le refroidissement est en cours"
                  />
                </Box>

                {/* Sélection de non-conformité */}
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <Autocomplete
                      options={nonConformities}
                      getOptionLabel={(option) => option.non_conformity_type}
                      value={selectedNonConformity}
                      onChange={(_, newValue) => setSelectedNonConformity(newValue)}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Non-conformité détectée (optionnel)"
                          placeholder="Sélectionner une non-conformité..."
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Warning fontSize="small" color="warning" />
                              <Typography variant="body2">{option.non_conformity_type}</Typography>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                    <Tooltip title="Ajouter un nouveau type de non-conformité">
                      <IconButton 
                        onClick={() => setAddNonConformityOpen(true)}
                        color="warning"
                        sx={{ mb: 0.5 }}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {selectedNonConformity && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Non-conformité sélectionnée :</strong> {selectedNonConformity.non_conformity_type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cette information sera enregistrée avec le suivi de refroidissement pour traçabilité.
                      </Typography>
                    </Alert>
                  )}
                </Box>

                {/* Section d analyse du refroidissement */}
                {formData.end_core_temperature !== null && formData.end_core_temperature !== undefined && formData.end_date && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Card variant="outlined" sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <AcUnit />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Analyse du Refroidissement
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Validation automatique HACCP
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                        {coolingRate && (
                          <Box>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                              <Timer color="primary" sx={{ mb: 1 }} />
                              <Typography variant="caption" color="text.secondary" display="block">
                                Vitesse de refroidissement
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {coolingRate.toFixed(1)} °C/h
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <TrendingDown color="info" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Écart de température
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {(formData.start_core_temperature - formData.end_core_temperature).toFixed(1)}°C
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <AccessTime color="warning" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Durée processus
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            {coolingStatus === 'compliant' ? <CheckCircle color="success" sx={{ mb: 1 }} /> : <Cancel color="error" sx={{ mb: 1 }} />}
                            <Typography variant="caption" color="text.secondary" display="block">
                              Conformité HACCP
                            </Typography>
                            <Chip
                              label={
                                coolingStatus === 'compliant' ? 'Conforme' :
                                coolingStatus === 'warning' ? 'Acceptable' :
                                coolingStatus === 'non-compliant' ? 'Non conforme' : 'En cours'
                              }
                              color={
                                coolingStatus === 'compliant' ? 'success' :
                                coolingStatus === 'warning' ? 'warning' :
                                coolingStatus === 'non-compliant' ? 'error' : 'default'
                              }
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* Barre de progression */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Progression du refroidissement
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={getProgressValue()}
                          color={coolingStatus === 'compliant' ? 'success' : coolingStatus === 'warning' ? 'warning' : 'error'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {getProgressValue().toFixed(0)}% de refroidissement accompli
                        </Typography>
                      </Box>

                      <Alert 
                        severity={
                          coolingStatus === 'compliant' ? 'success' :
                          coolingStatus === 'warning' ? 'warning' :
                          coolingStatus === 'non-compliant' ? 'error' : 'info'
                        }
                      >
                        {coolingStatus === 'compliant' && 
                          'Refroidissement conforme aux règles HACCP (65°C → 10°C en moins de 6h)'}
                        {coolingStatus === 'warning' && 
                          'Température finale atteinte mais délai HACCP dépassé'}
                        {coolingStatus === 'non-compliant' && 
                          'Refroidissement non conforme - température finale trop élevée'}
                        {coolingStatus === 'pending' && 
                          'Refroidissement en cours - données incomplètes'}
                      </Alert>
                    </Card>
                  </Box>
                )}

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    label="Commentaires et observations"
                    multiline
                    rows={3}
                    value={formData.comments || ''}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    fullWidth
                    placeholder="Actions correctives, conditions particulières, observations..."
                  />
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={loading ? <Schedule /> : <Save />}
                      disabled={loading}
                      fullWidth
                      sx={{ 
                        py: 2,
                        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        }
                      }}
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer le suivi de refroidissement'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Guide HACCP */}
        <Card sx={{ mt: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
            p: 3, 
            borderBottom: '1px solid', 
            borderColor: 'divider' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <AcUnit />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Guide du Refroidissement HACCP
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Règles et bonnes pratiques pour la sécurité alimentaire
                </Typography>
              </Box>
            </Box>
          </Box>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  🎯 Objectifs HACCP
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• <strong>Température cible :</strong> Passer de 65°C à 10°C</Typography>
                  <Typography variant="body2">• <strong>Délai maximum :</strong> 6 heures maximum</Typography>
                  <Typography variant="body2">• <strong>Zone critique :</strong> Entre 65°C et 10°C (multiplication bactérienne)</Typography>
                  <Typography variant="body2">• <strong>Mesure obligatoire :</strong> Contrôle de température à cœur</Typography>
                </Stack>
              </Box>
              
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
                  ⚠️ Actions Correctives
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• <strong>Non-conformité détectée :</strong> Analyser les causes immédiates</Typography>
                  <Typography variant="body2">• <strong>Équipement défaillant :</strong> Vérifier le fonctionnement des équipements</Typography>
                  <Typography variant="body2">• <strong>Produit compromis :</strong> Évaluer la sécurité sanitaire</Typography>
                  <Typography variant="body2">• <strong>Documentation :</strong> Enregistrer toutes les mesures prises</Typography>
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Section Historique */}
        <Card sx={{ mt: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', 
            p: 3, 
            borderBottom: '1px solid', 
            borderColor: 'divider' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <History />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Historique des Refroidissements
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Derniers enregistrements de suivi de refroidissement HACCP
                </Typography>
              </Box>
            </Box>
          </Box>
          <CardContent sx={{ p: 0 }}>
            {historyRecords.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Produit</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Catégorie</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Temp. Début</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Temp. Fin</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date début</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date fin</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Conformité</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyRecords.map((record) => {
                      const recordCoolingStatus = record.end_core_temperature ? 
                        (record.start_core_temperature >= 65 && record.end_core_temperature <= 10 && 
                         record.end_date && 
                         ((new Date(record.end_date).getTime() - new Date(record.start_date).getTime()) / (1000 * 60 * 60)) <= 6) ? 'compliant' :
                        (record.end_core_temperature <= 10 ? 'warning' : 'non-compliant') : 'pending';

                      return (
                        <TableRow key={record.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {record.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {recordCategories[record.id] || 'Non spécifiée'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {record.product_type}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {record.start_core_temperature}°C
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {record.end_core_temperature ? `${record.end_core_temperature}°C` : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(record.start_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {record.end_date ? 
                                new Date(record.end_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'En cours'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                recordCoolingStatus === 'compliant' ? 'Conforme' :
                                recordCoolingStatus === 'warning' ? 'Acceptable' :
                                recordCoolingStatus === 'non-compliant' ? 'Non conforme' : 'En cours'
                              }
                              color={
                                recordCoolingStatus === 'compliant' ? 'success' :
                                recordCoolingStatus === 'warning' ? 'warning' :
                                recordCoolingStatus === 'non-compliant' ? 'error' : 'default'
                              }
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Modifier l'enregistrement">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEdit(record)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer l'enregistrement">
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    setRecordToDelete(record);
                                    setDeleteDialogOpen(true);
                                  }}
                                  sx={{ color: 'error.main' }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <History sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucun enregistrement trouvé
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Les enregistrements de refroidissement apparaîtront ici après avoir été créés.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog de confirmation de suppression */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setRecordToDelete(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'error.main' }}>
              <Delete />
            </Avatar>
            Confirmer la suppression
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Êtes-vous sûr de vouloir supprimer cet enregistrement de refroidissement ?
            </Typography>
            {recordToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Produit :</strong> {recordToDelete.product_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Catégorie :</strong> {recordCategories[recordToDelete.id] || 'Non spécifiée'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Type :</strong> {recordToDelete.product_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Date :</strong> {new Date(recordToDelete.start_date).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cette action est irréversible. L'enregistrement sera définitivement supprimé de votre historique HACCP.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => {
                setDeleteDialogOpen(false);
                setRecordToDelete(null);
              }}
              variant="outlined"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDelete}
              variant="contained"
              color="error"
              startIcon={<Delete />}
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal d'édition */}
        <Dialog
          open={editModalOpen}
          onClose={closeEditModal}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: { minHeight: '80vh' }
            }
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <Edit />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Modification de l'Enregistrement
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Traçabilité du processus de refroidissement HACCP
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleUpdate} sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                {/* Sélection du produit alimentaire */}
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <Autocomplete
                      options={foodProducts}
                      getOptionLabel={(option) => option.name}
                      value={editSelectedFoodProduct}
                      onChange={(_, newValue) => {
                        setEditSelectedFoodProduct(newValue);
                        if (newValue) {
                          setEditSelectedCategory(newValue.category);
                          setEditFormData(prev => ({
                            ...prev,
                            product_name: newValue.name,
                            product_type: newValue.food_type
                          }));
                          // Aussi mettre à jour le type de produit sélectionné basé sur le food_type
                          const matchingType = productTypes.find(type => type.name === newValue.food_type);
                          setEditSelectedProductType(matchingType || null);
                        } else {
                          setEditSelectedCategory('');
                        }
                      }}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Nom du produit *"
                          placeholder="Sélectionner un produit..."
                          required={!editFormData.product_name}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Restaurant fontSize="small" color="primary" />
                              <Box>
                                <Typography variant="body2">{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.category} - {option.food_type}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                    <Tooltip title="Ajouter un nouveau produit">
                      <IconButton 
                        onClick={() => setAddFoodProductOpen(true)}
                        color="primary"
                        sx={{ mb: 0.5 }}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {!editSelectedFoodProduct && (
                    <TextField
                      label="Ou saisir manuellement"
                      value={editFormData.product_name}
                      onChange={(e) => setEditFormData({...editFormData, product_name: e.target.value})}
                      fullWidth
                      size="small"
                      sx={{ mt: 1 }}
                      placeholder="Ex: Rôti de porc, Escalopes de volaille..."
                    />
                  )}
                  
                  {/* Affichage de la catégorie sélectionnée */}
                  {editSelectedCategory && (
                    <TextField
                      label="Catégorie du produit"
                      value={editSelectedCategory}
                      fullWidth
                      size="small"
                      sx={{ mt: 1 }}
                      slotProps={{
                        input: {
                          readOnly: true,
                          sx: { 
                            bgcolor: 'success.light', 
                            color: 'success.contrastText',
                            '& .MuiInputBase-input': { color: 'success.main', fontWeight: 500 }
                          }
                        }
                      }}
                    />
                  )}
                </Box>
                
                {/* Sélection du type de produit */}
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <Autocomplete
                      options={productTypes}
                      getOptionLabel={(option) => option.name}
                      value={editSelectedProductType}
                      onChange={(_, newValue) => {
                        setEditSelectedProductType(newValue);
                        if (newValue) {
                          setEditFormData(prev => ({
                            ...prev,
                            product_type: newValue.name
                          }));
                        }
                      }}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Type de produit *"
                          placeholder="Sélectionner un type..."
                          required={!editFormData.product_type}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Category fontSize="small" color="secondary" />
                              <Box>
                                <Typography variant="body2">{option.name}</Typography>
                                {option.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {option.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                    <Tooltip title="Ajouter un nouveau type de produit">
                      <IconButton 
                        onClick={() => setAddProductTypeOpen(true)}
                        color="secondary"
                        sx={{ mb: 0.5 }}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {!editSelectedProductType && (
                    <TextField
                      label="Ou saisir manuellement"
                      value={editFormData.product_type}
                      onChange={(e) => setEditFormData({...editFormData, product_type: e.target.value})}
                      fullWidth
                      size="small"
                      sx={{ mt: 1 }}
                      placeholder="Ex: Volaille, Porc, Bœuf..."
                    />
                  )}
                </Box>
                
                <Box>
                  <TextField
                    label="Température initiale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={editFormData.start_core_temperature}
                    onChange={(e) => setEditFormData({...editFormData, start_core_temperature: Number(e.target.value)})}
                    required
                    fullWidth
                    helperText="Température à cœur au début du refroidissement"
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Température finale (°C)"
                    type="number"
                    slotProps={{
                      htmlInput: { step: "0.1" }
                    }}
                    value={editFormData.end_core_temperature || ''}
                    onChange={(e) => setEditFormData({...editFormData, end_core_temperature: e.target.value ? Number(e.target.value) : null})}
                    fullWidth
                    helperText="Température à cœur à la fin (optionnel si en cours)"
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Date et heure de début"
                    type="datetime-local"
                    value={formatDateTimeForInput(editFormData.start_date)}
                    onChange={(e) => setEditFormData({...editFormData, start_date: new Date(e.target.value).toISOString()})}
                    required
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                  />
                </Box>
                
                <Box>
                  <TextField
                    label="Date et heure de fin"
                    type="datetime-local"
                    value={editFormData.end_date ? formatDateTimeForInput(editFormData.end_date) : ''}
                    onChange={(e) => setEditFormData({...editFormData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                    helperText="Laisser vide si le refroidissement est en cours"
                  />
                </Box>

                {/* Sélection de non-conformité */}
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <Autocomplete
                      options={nonConformities}
                      getOptionLabel={(option) => option.non_conformity_type}
                      value={editSelectedNonConformity}
                      onChange={(_, newValue) => setEditSelectedNonConformity(newValue)}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Non-conformité détectée (optionnel)"
                          placeholder="Sélectionner une non-conformité..."
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Warning fontSize="small" color="warning" />
                              <Typography variant="body2">{option.non_conformity_type}</Typography>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                    <Tooltip title="Ajouter un nouveau type de non-conformité">
                      <IconButton 
                        onClick={() => setAddNonConformityOpen(true)}
                        color="warning"
                        sx={{ mb: 0.5 }}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {editSelectedNonConformity && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Non-conformité sélectionnée :</strong> {editSelectedNonConformity.non_conformity_type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cette information sera enregistrée avec le suivi de refroidissement pour traçabilité.
                      </Typography>
                    </Alert>
                  )}
                </Box>

                {/* Analyse du refroidissement pour le modal */}
                {editFormData.end_core_temperature !== null && editFormData.end_core_temperature !== undefined && editFormData.end_date && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Card variant="outlined" sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <AcUnit />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Analyse du Refroidissement
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Validation automatique HACCP
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                        {calculateEditCoolingRate() && (
                          <Box>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                              <Timer color="primary" sx={{ mb: 1 }} />
                              <Typography variant="caption" color="text.secondary" display="block">
                                Vitesse de refroidissement
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {calculateEditCoolingRate()?.toFixed(1)} °C/h
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <TrendingDown color="info" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Écart de température
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {(editFormData.start_core_temperature - editFormData.end_core_temperature).toFixed(1)}°C
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <AccessTime color="warning" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                              Durée processus
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {((new Date(editFormData.end_date).getTime() - new Date(editFormData.start_date).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Alert 
                        severity={
                          getEditCoolingStatus() === 'compliant' ? 'success' :
                          getEditCoolingStatus() === 'warning' ? 'warning' :
                          getEditCoolingStatus() === 'non-compliant' ? 'error' : 'info'
                        }
                      >
                        {getEditCoolingStatus() === 'compliant' && 
                          'Refroidissement conforme aux règles HACCP (65°C → 10°C en moins de 6h)'}
                        {getEditCoolingStatus() === 'warning' && 
                          'Température finale atteinte mais délai HACCP dépassé'}
                        {getEditCoolingStatus() === 'non-compliant' && 
                          'Refroidissement non conforme - température finale trop élevée'}
                        {getEditCoolingStatus() === 'pending' && 
                          'Refroidissement en cours - données incomplètes'}
                      </Alert>
                    </Card>
                  </Box>
                )}

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    label="Commentaires et observations"
                    multiline
                    rows={3}
                    value={editFormData.comments || ''}
                    onChange={(e) => setEditFormData({...editFormData, comments: e.target.value})}
                    fullWidth
                    placeholder="Actions correctives, conditions particulières, observations..."
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={closeEditModal}
              variant="outlined"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleUpdate}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <Schedule /> : <Save />}
              sx={{
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                }
              }}
            >
              {loading ? 'Modification...' : 'Modifier l\'enregistrement'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal d'ajout de produit alimentaire */}
        <AddFoodProductModal 
          open={addFoodProductOpen}
          onClose={() => setAddFoodProductOpen(false)}
          onCreate={handleCreateFoodProduct}
        />

        {/* Modal d'ajout de type de produit */}
        <AddProductTypeModal 
          open={addProductTypeOpen}
          onClose={() => setAddProductTypeOpen(false)}
          onCreate={handleCreateProductType}
        />

        {/* Modal d'ajout de non-conformité */}
        <AddNonConformityModal 
          open={addNonConformityOpen}
          onClose={() => setAddNonConformityOpen(false)}
          onCreate={handleCreateNonConformity}
        />
      </Container>
    </Box>
  );
}

// Composant Modal pour ajouter un produit alimentaire
interface AddFoodProductModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: TablesInsert<'food_products'>) => void;
}

function AddFoodProductModal({ open, onClose, onCreate }: AddFoodProductModalProps) {
  const [formData, setFormData] = useState<Partial<TablesInsert<'food_products'>>>({
    name: '',
    description: '',
    category: '',
    sub_category: '',
    food_type: '',
    storage_condition: '',
    min_storage_temperature: null,
    max_storage_temperature: null,
    target_cooling_rate: null,
    haccp_cooling_standard: '',
    shelf_life_days: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.category && formData.food_type && formData.storage_condition) {
      onCreate(formData as TablesInsert<'food_products'>);
      setFormData({
        name: '',
        description: '',
        category: '',
        sub_category: '',
        food_type: '',
        storage_condition: '',
        min_storage_temperature: null,
        max_storage_temperature: null,
        target_cooling_rate: null,
        haccp_cooling_standard: '',
        shelf_life_days: null,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <Restaurant />
        </Avatar>
        Ajouter un nouveau produit alimentaire
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <TextField
              label="Nom du produit *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              fullWidth
            />
            <TextField
              label="Catégorie *"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
              fullWidth
            />
            <TextField
              label="Sous-catégorie"
              value={formData.sub_category}
              onChange={(e) => setFormData({...formData, sub_category: e.target.value})}
              fullWidth
            />
            <TextField
              label="Type d'aliment *"
              value={formData.food_type}
              onChange={(e) => setFormData({...formData, food_type: e.target.value})}
              required
              fullWidth
            />
            <TextField
              label="Condition de stockage *"
              value={formData.storage_condition}
              onChange={(e) => setFormData({...formData, storage_condition: e.target.value})}
              required
              fullWidth
            />
            <TextField
              label="Température min (°C)"
              type="number"
              value={formData.min_storage_temperature || ''}
              onChange={(e) => setFormData({...formData, min_storage_temperature: e.target.value ? Number(e.target.value) : null})}
              fullWidth
            />
            <TextField
              label="Température max (°C)"
              type="number"
              value={formData.max_storage_temperature || ''}
              onChange={(e) => setFormData({...formData, max_storage_temperature: e.target.value ? Number(e.target.value) : null})}
              fullWidth
            />
            <TextField
              label="Vitesse de refroidissement cible (°C/h)"
              type="number"
              value={formData.target_cooling_rate || ''}
              onChange={(e) => setFormData({...formData, target_cooling_rate: e.target.value ? Number(e.target.value) : null})}
              fullWidth
            />
            <TextField
              label="Standard HACCP"
              value={formData.haccp_cooling_standard}
              onChange={(e) => setFormData({...formData, haccp_cooling_standard: e.target.value})}
              fullWidth
            />
            <TextField
              label="Durée de vie (jours)"
              type="number"
              value={formData.shelf_life_days || ''}
              onChange={(e) => setFormData({...formData, shelf_life_days: e.target.value ? Number(e.target.value) : null})}
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              fullWidth
              multiline
              rows={2}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" startIcon={<Save />}>
          Créer le produit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Composant Modal pour ajouter un type de produit
interface AddProductTypeModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: TablesInsert<'product_types'>) => void;
}

function AddProductTypeModal({ open, onClose, onCreate }: AddProductTypeModalProps) {
  const [formData, setFormData] = useState<Partial<TablesInsert<'product_types'>>>({
    name: '',
    description: '',
    haccp_guidelines: '',
    cooling_requirements: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      onCreate(formData as TablesInsert<'product_types'>);
      setFormData({
        name: '',
        description: '',
        haccp_guidelines: '',
        cooling_requirements: null,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'secondary.main' }}>
          <Category />
        </Avatar>
        Ajouter un nouveau type de produit
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Nom du type *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Directives HACCP"
              value={formData.haccp_guidelines}
              onChange={(e) => setFormData({...formData, haccp_guidelines: e.target.value})}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" startIcon={<Save />}>
          Créer le type
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Composant Modal pour ajouter une non-conformité
interface AddNonConformityModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (type: string) => void;
}

function AddNonConformityModal({ open, onClose, onCreate }: AddNonConformityModalProps) {
  const [nonConformityType, setNonConformityType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nonConformityType.trim()) {
      onCreate(nonConformityType.trim());
      setNonConformityType('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'warning.main' }}>
          <Warning />
        </Avatar>
        Ajouter un nouveau type de non-conformité
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Types de non-conformités conseillés :</strong>
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>Reduced product life</strong> (Durée de vie du produit réduite)<br/>
            • <strong>Prolonged operation</strong> (Fonctionnement prolongé)<br/>
            • <strong>Discarded product</strong> (Produit jeté)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Vous pouvez bien entendu en créer d'autres selon vos besoins.
          </Typography>
        </Alert>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="Type de non-conformité *"
            value={nonConformityType}
            onChange={(e) => setNonConformityType(e.target.value)}
            required
            fullWidth
            placeholder="Ex: Reduced product life, Prolonged operation..."
            helperText="Décrivez le type de non-conformité qui peut être détectée"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" startIcon={<Save />}>
          Ajouter
        </Button>
      </DialogActions>
    </Dialog>
  );
}