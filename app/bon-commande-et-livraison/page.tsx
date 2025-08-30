"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Fab,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  ShoppingCart as ShoppingCartIcon,
  Business as ClientIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Restaurant as RestaurantIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { supabase } from '@/lib/supabase';
import { useEmployee } from '@/contexts/EmployeeContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSnackbar } from 'notistack';

interface Client {
  id: string;
  organization_id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  siret?: string;
  vat_number?: string;
  payment_terms: number;
  is_active: boolean;
}

interface Preparation {
  id: string;
  organization_id: string;
  designation: string;
  lot_number?: string;
  dlc?: string;
  allergens: string[];
  selling_price: number;
  price_unit: string;
  state: string;
  category: string;
  quantity: number;
  quantity_unit: string;
  save_to_preparations: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employee_id?: string;
  user_id?: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

interface ClientOrder {
  id: string;
  organization_id: string;
  order_number: string;
  client_id?: string;
  order_date: string;
  delivery_date?: string;
  delivery_address?: string;
  status: 'draft' | 'confirmed' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled';
  total_amount?: number;
  notes?: string;
  client?: Client;
  items?: ClientOrderItem[];
}

interface ClientOrderItem {
  id?: string;
  client_order_id?: string;
  preparation_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  allergens: string[];
  lot_number?: string;
  dlc?: string;
  preparation?: Preparation;
}

interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  client_order_id?: string;
  client_id?: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  notes?: string;
  client?: Client;
  client_order?: ClientOrder;
  items?: InvoiceItem[];
}

interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  client_order_item_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

const ORDER_STATUS_COLORS = {
  draft: { color: 'default', label: 'Brouillon' },
  confirmed: { color: 'info', label: 'Confirmé' },
  in_preparation: { color: 'warning', label: 'En préparation' },
  ready: { color: 'secondary', label: 'Prêt' },
  delivered: { color: 'success', label: 'Livré' },
  cancelled: { color: 'error', label: 'Annulé' },
} as const;

const INVOICE_STATUS_COLORS = {
  draft: { color: 'default', label: 'Brouillon' },
  sent: { color: 'info', label: 'Envoyé' },
  paid: { color: 'success', label: 'Payé' },
  overdue: { color: 'error', label: 'En retard' },
  cancelled: { color: 'error', label: 'Annulé' },
} as const;

const CATEGORIES = [
  { value: 'meat', label: 'Viande', icon: '🥩' },
  { value: 'poultry', label: 'Volaille', icon: '🐔' },
  { value: 'game', label: 'Gibier', icon: '🦌' },
  { value: 'fish', label: 'Poisson', icon: '🐟' },
  { value: 'seafood', label: 'Fruits de mer', icon: '🦐' },
  { value: 'charcuterie', label: 'Charcuterie', icon: '🥓' },
  { value: 'vegetable', label: 'Légume', icon: '🥕' },
  { value: 'fruit', label: 'Fruit', icon: '🍎' },
  { value: 'dairy', label: 'Produit laitier', icon: '🧀' },
  { value: 'pastry', label: 'Pâtisserie', icon: '🧁' },
  { value: 'sauce', label: 'Sauce', icon: '🍯' },
  { value: 'other', label: 'Autre', icon: '📦' },
];

const STATES = [
  { value: 'fresh', label: 'Frais', color: 'success' },
  { value: 'frozen', label: 'Surgelé', color: 'info' },
  { value: 'vacuum_packed', label: 'Sous vide', color: 'secondary' },
  { value: 'vacuum_frozen', label: 'Sous vide surgelé', color: 'primary' },
  { value: 'defrosted', label: 'Décongelé', color: 'warning' },
  { value: 'cooked', label: 'Cuit', color: 'default' },
  { value: 'precooked', label: 'Précuit', color: 'default' },
];

const UNITS = [
  { value: 'kg', label: 'Kg' },
  { value: 'g', label: 'g' },
  { value: 'litre', label: 'Litre' },
  { value: 'ml', label: 'ml' },
  { value: 'piece', label: 'Pièce' },
  { value: 'unit', label: 'Unité' },
  { value: 'lot', label: 'Lot' },
  { value: 'barquette', label: 'Barquette' },
];

export default function ClientOrdersAndDeliveries() {
  const { employee } = useEmployee();
  const { enqueueSnackbar } = useSnackbar();

  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // States for Client Orders
  const [clientOrders, setClientOrders] = useState<ClientOrder[]>([]);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ClientOrder | null>(null);
  
  // States for Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceDialogOpen] = useState(false);
  
  // States for Clients
  const [clients, setClients] = useState<Client[]>([]);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // States for Preparations (for product selection)
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [preparationSelectionOpen, setPreparationSelectionOpen] = useState(false);

  // Form states
  const [orderFormData, setOrderFormData] = useState({
    order_number: '',
    client_id: '',
    order_date: new Date(),
    delivery_date: null as Date | null,
    delivery_address: '',
    status: 'draft' as const,
    notes: '',
    items: [] as ClientOrderItem[],
  });

  const [clientFormData, setClientFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    siret: '',
    vat_number: '',
    payment_terms: 30,
  });

  const [newItemFormData, setNewItemFormData] = useState({
    product_name: '',
    description: '',
    quantity: 1,
    unit: 'piece',
    unit_price: 0,
    allergens: [] as string[],
    lot_number: '',
    dlc: null as Date | null,
  });

  // Fetch functions
  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        if (error.message.includes('relation "clients" does not exist')) {
          console.warn('Tables clients non créées - migration requise');
          setClients([]);
          return;
        }
        throw error;
      }
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      enqueueSnackbar('Erreur lors du chargement des clients - Migration de BDD requise', { variant: 'warning' });
      setClients([]);
    }
  }, [enqueueSnackbar]);

  const fetchPreparations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('preparations')
        .select('*')
        .eq('is_active', true)
        .order('designation');

      if (error) throw error;
      setPreparations(data || []);
    } catch (error) {
      console.error('Error fetching preparations:', error);
      enqueueSnackbar('Erreur lors du chargement des préparations', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchClientOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('client_orders')
        .select(`
          *,
          client:clients(*),
          items:client_order_items(
            *,
            preparation:preparations(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "client_orders" does not exist')) {
          console.warn('Tables client_orders non créées - migration requise');
          setClientOrders([]);
          return;
        }
        throw error;
      }
      setClientOrders(data || []);
    } catch (error) {
      console.error('Error fetching client orders:', error);
      enqueueSnackbar('Erreur lors du chargement des commandes - Migration de BDD requise', { variant: 'warning' });
      setClientOrders([]);
    }
  }, [enqueueSnackbar]);

  const fetchInvoices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*),
          client_order:client_orders(*),
          items:invoice_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "invoices" does not exist')) {
          console.warn('Tables invoices non créées - migration requise');
          setInvoices([]);
          return;
        }
        throw error;
      }
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      enqueueSnackbar('Erreur lors du chargement des factures - Migration de BDD requise', { variant: 'warning' });
      setInvoices([]);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchClients(),
        fetchPreparations(),
        fetchClientOrders(),
        fetchInvoices(),
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchClients, fetchPreparations, fetchClientOrders, fetchInvoices]);

  // Generate order number
  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = clientOrders.length + 1;
    return `CMD-${year}${month}-${String(count).padStart(3, '0')}`;
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = invoices.length + 1;
    return `FACT-${year}${month}-${String(count).padStart(3, '0')}`;
  };

  // Calculate order total
  const calculateOrderTotal = (items: ClientOrderItem[]) => {
    return items.reduce((total, item) => total + (item.total_price || 0), 0);
  };

  // Get category configuration
  const getCategoryConfig = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  // Get state configuration
  const getStateConfig = (state: string) => {
    return STATES.find(s => s.value === state) || STATES[0];
  };


  // Handle client operations  
  const handleOpenClientDialog = (client?: Client) => {
    setEditingClient(client || null);
    setClientFormData(client ? {
      name: client.name,
      contact_person: client.contact_person || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      siret: client.siret || '',
      vat_number: client.vat_number || '',
      payment_terms: client.payment_terms,
    } : {
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      siret: '',
      vat_number: '',
      payment_terms: 30,
    });
    setClientDialogOpen(true);
  };

  const handleCloseClientDialog = () => {
    setClientDialogOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = async () => {
    // Validation du nom du client
    if (!clientFormData.name.trim()) {
      enqueueSnackbar('⚠️ Le nom du client est obligatoire', { variant: 'error' });
      return;
    }

    // Validation de l'email si fourni
    if (clientFormData.email && !clientFormData.email.includes('@')) {
      enqueueSnackbar('⚠️ Format d\'email invalide', { variant: 'error' });
      return;
    }

    // Validation des délais de paiement
    if (clientFormData.payment_terms <= 0) {
      enqueueSnackbar('⚠️ Le délai de paiement doit être supérieur à 0 jours', { variant: 'error' });
      return;
    }

    // Validation de l'organisation
    if (!employee?.organization_id) {
      enqueueSnackbar('❌ Erreur de connexion - Organisation non identifiée', { variant: 'error' });
      return;
    }

    try {
      enqueueSnackbar('🔄 Sauvegarde du client...', { variant: 'info' });

      const clientData = {
        name: clientFormData.name.trim(),
        contact_person: clientFormData.contact_person.trim() || null,
        email: clientFormData.email.trim() || null,
        phone: clientFormData.phone.trim() || null,
        address: clientFormData.address.trim() || null,
        siret: clientFormData.siret.trim() || null,
        vat_number: clientFormData.vat_number.trim() || null,
        payment_terms: clientFormData.payment_terms,
        organization_id: employee.organization_id,
      };

      if (editingClient) {
        const { data, error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id)
          .select()
          .single();

        if (error) throw error;
        enqueueSnackbar('✅ Client modifié avec succès', { variant: 'success' });
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert([clientData])
          .select()
          .single();

        if (error) throw error;
        enqueueSnackbar('✅ Client créé avec succès', { variant: 'success' });
      }

      handleCloseClientDialog();
      await fetchClients();
      
      enqueueSnackbar(`🎉 ${editingClient ? 'Modification' : 'Création'} du client "${clientData.name}" terminée !`, { variant: 'success' });

    } catch (error) {
      console.error('Error saving client:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      if (error?.message?.includes('violates row-level security')) {
        errorMessage = '🔒 Erreur de permissions - Contactez votre administrateur';
      } else if (error?.message?.includes('duplicate key')) {
        errorMessage = '⚠️ Un client avec ce nom existe déjà';
      } else if (error?.message?.includes('unique constraint')) {
        errorMessage = '⚠️ Ces informations sont déjà utilisées par un autre client';
      } else if (error?.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId);

      if (error) throw error;

      enqueueSnackbar('Client supprimé avec succès', { variant: 'success' });
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      enqueueSnackbar('Erreur lors de la suppression - Migration de BDD requise', { variant: 'warning' });
    }
  };

  // Handle order operations
  const handleOpenOrderDialog = (order?: ClientOrder) => {
    setEditingOrder(order || null);
    setOrderFormData(order ? {
      order_number: order.order_number,
      client_id: order.client_id || '',
      order_date: new Date(order.order_date),
      delivery_date: order.delivery_date ? new Date(order.delivery_date) : null,
      delivery_address: order.delivery_address || '',
      status: order.status,
      notes: order.notes || '',
      items: order.items || [],
    } : {
      order_number: generateOrderNumber(),
      client_id: '',
      order_date: new Date(),
      delivery_date: null,
      delivery_address: '',
      status: 'draft' as const,
      notes: '',
      items: [],
    });
    setOrderDialogOpen(true);
  };

  const handleCloseOrderDialog = () => {
    setOrderDialogOpen(false);
    setEditingOrder(null);
    setNewItemFormData({
      product_name: '',
      description: '',
      quantity: 1,
      unit: 'piece',
      unit_price: 0,
      allergens: [],
      lot_number: '',
      dlc: null,
    });
  };

  const handleSaveOrder = async () => {
    // Validation du client
    if (!orderFormData.client_id) {
      enqueueSnackbar('⚠️ Veuillez sélectionner un client pour créer la commande', { variant: 'error' });
      return;
    }

    // Validation des produits
    if (orderFormData.items.length === 0) {
      enqueueSnackbar('⚠️ Veuillez ajouter au moins un produit à la commande', { variant: 'error' });
      return;
    }

    // Validation des quantités
    const invalidItems = orderFormData.items.filter(item => item.quantity <= 0 || item.unit_price <= 0);
    if (invalidItems.length > 0) {
      enqueueSnackbar('⚠️ Tous les produits doivent avoir une quantité et un prix supérieurs à 0', { variant: 'error' });
      return;
    }

    // Validation de l'employé
    if (!employee?.organization_id) {
      enqueueSnackbar('❌ Erreur de connexion - Employé non identifié', { variant: 'error' });
      return;
    }

    try {
      enqueueSnackbar('🔄 Sauvegarde en cours...', { variant: 'info' });

      const totalAmount = calculateOrderTotal(orderFormData.items);
      const orderData = {
        order_number: orderFormData.order_number,
        client_id: orderFormData.client_id,
        order_date: orderFormData.order_date.toISOString().split('T')[0],
        delivery_date: orderFormData.delivery_date ? orderFormData.delivery_date.toISOString().split('T')[0] : null,
        delivery_address: orderFormData.delivery_address || null,
        status: orderFormData.status,
        total_amount: totalAmount,
        notes: orderFormData.notes || null,
        organization_id: employee.organization_id,
        employee_id: employee.id,
      };

      let orderId: string;
      if (editingOrder) {
        const { data, error } = await supabase
          .from('client_orders')
          .update(orderData)
          .eq('id', editingOrder.id)
          .select()
          .single();

        if (error) throw error;
        orderId = editingOrder.id;
        enqueueSnackbar('✅ Commande modifiée avec succès', { variant: 'success' });
      } else {
        const { data, error } = await supabase
          .from('client_orders')
          .insert([orderData])
          .select()
          .single();

        if (error) throw error;
        orderId = data.id;
        enqueueSnackbar('✅ Commande créée avec succès', { variant: 'success' });
      }

      // Suppression des anciens items si modification
      if (editingOrder && orderFormData.items.length > 0) {
        const { error: deleteError } = await supabase
          .from('client_order_items')
          .delete()
          .eq('client_order_id', orderId);
        
        if (deleteError) throw deleteError;
      }

      // Insertion des nouveaux items
      if (orderFormData.items.length > 0) {
        const itemsToInsert = orderFormData.items.map(item => ({
          client_order_id: orderId,
          preparation_id: item.preparation_id || null,
          product_name: item.product_name,
          description: item.description || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
          allergens: item.allergens || [],
          lot_number: item.lot_number || null,
          dlc: item.dlc || null,
        }));

        const { error: itemsError } = await supabase
          .from('client_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Fermeture du dialog et rechargement des données
      handleCloseOrderDialog();
      await fetchClientOrders();
      
      enqueueSnackbar(`🎉 ${editingOrder ? 'Modification' : 'Création'} terminée ! Total: ${totalAmount.toFixed(2)}€`, { variant: 'success' });

    } catch (error) {
      console.error('Error saving order:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      if (error?.message?.includes('violates row-level security')) {
        errorMessage = '🔒 Erreur de permissions - Contactez votre administrateur';
      } else if (error?.message?.includes('duplicate key')) {
        errorMessage = '⚠️ Ce numéro de commande existe déjà';
      } else if (error?.message?.includes('foreign key')) {
        errorMessage = '⚠️ Client ou produit invalide';
      } else if (error?.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  // Add preparation to order
  const handleAddPreparationToOrder = (preparation: Preparation, selectedQuantity: number) => {
    const newItem: ClientOrderItem = {
      preparation_id: preparation.id,
      product_name: preparation.designation,
      description: `${getCategoryConfig(preparation.category).label} - ${getStateConfig(preparation.state).label}`,
      quantity: selectedQuantity,
      unit: preparation.price_unit,
      unit_price: preparation.selling_price,
      total_price: preparation.selling_price * selectedQuantity,
      allergens: preparation.allergens,
      lot_number: preparation.lot_number,
      dlc: preparation.dlc,
    };

    setOrderFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Add new custom item to order
  const handleAddNewItemToOrder = () => {
    if (!newItemFormData.product_name.trim()) {
      enqueueSnackbar('Le nom du produit est obligatoire', { variant: 'error' });
      return;
    }

    if (newItemFormData.quantity <= 0) {
      enqueueSnackbar('La quantité doit être supérieure à 0', { variant: 'error' });
      return;
    }

    if (newItemFormData.unit_price <= 0) {
      enqueueSnackbar('Le prix doit être supérieur à 0', { variant: 'error' });
      return;
    }

    const newItem: ClientOrderItem = {
      product_name: newItemFormData.product_name.trim(),
      description: newItemFormData.description.trim(),
      quantity: newItemFormData.quantity,
      unit: newItemFormData.unit,
      unit_price: newItemFormData.unit_price,
      total_price: newItemFormData.unit_price * newItemFormData.quantity,
      allergens: newItemFormData.allergens,
      lot_number: newItemFormData.lot_number.trim() || undefined,
      dlc: newItemFormData.dlc ? newItemFormData.dlc.toISOString().split('T')[0] : undefined,
    };

    setOrderFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset form
    setNewItemFormData({
      product_name: '',
      description: '',
      quantity: 1,
      unit: 'piece',
      unit_price: 0,
      allergens: [],
      lot_number: '',
      dlc: null,
    });
  };

  // Remove item from order
  const handleRemoveOrderItem = (index: number) => {
    setOrderFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Update order item quantity
  const handleUpdateOrderItemQuantity = (index: number, quantity: number) => {
    setOrderFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { 
          ...item, 
          quantity, 
          total_price: item.unit_price * quantity 
        } : item
      )
    }));
  };

  // Print functions
  const handlePrintOrder = (order: ClientOrder) => {
    try {
      enqueueSnackbar('🖨️ Préparation de l\'impression...', { variant: 'info' });

      const client = clients.find(c => c.id === order.client_id);
      if (!client) {
        enqueueSnackbar('❌ Client introuvable pour cette commande', { variant: 'error' });
        return;
      }

      // Créer le contenu HTML pour l'impression
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Commande ${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .client-info { flex: 1; margin-right: 20px; }
            .order-details { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; font-size: 18px; }
            .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BON DE COMMANDE</h1>
            <p>N° ${order.order_number}</p>
          </div>

          <div class="order-info">
            <div class="client-info">
              <h3>CLIENT</h3>
              <p><strong>${client.name}</strong></p>
              ${client.contact_person ? `<p>Contact: ${client.contact_person}</p>` : ''}
              ${client.address ? `<p>${client.address}</p>` : ''}
              ${client.phone ? `<p>Tél: ${client.phone}</p>` : ''}
              ${client.email ? `<p>Email: ${client.email}</p>` : ''}
            </div>
            <div class="order-details">
              <h3>COMMANDE</h3>
              <p><strong>Date:</strong> ${format(new Date(order.order_date), 'dd/MM/yyyy', { locale: fr })}</p>
              ${order.delivery_date ? `<p><strong>Livraison:</strong> ${format(new Date(order.delivery_date), 'dd/MM/yyyy', { locale: fr })}</p>` : ''}
              ${order.delivery_address ? `<p><strong>Adresse livraison:</strong> ${order.delivery_address}</p>` : ''}
              <p><strong>Statut:</strong> ${ORDER_STATUS_COLORS[order.status]?.label || order.status}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.description || '-'}</td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>${item.unit_price.toFixed(2)}€</td>
                  <td>${item.total_price.toFixed(2)}€</td>
                </tr>
              `).join('') || '<tr><td colspan="5">Aucun produit</td></tr>'}
            </tbody>
          </table>

          <div class="total">
            <p>TOTAL: ${order.total_amount?.toFixed(2) || '0.00'}€</p>
          </div>

          ${order.notes ? `<div class="footer"><h3>NOTES</h3><p>${order.notes}</p></div>` : ''}

          <div class="footer">
            <p><em>Imprimé le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</em></p>
          </div>
        </body>
        </html>
      `;

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        enqueueSnackbar('✅ Commande envoyée à l\'imprimante', { variant: 'success' });
      } else {
        enqueueSnackbar('❌ Impossible d\'ouvrir la fenêtre d\'impression', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error printing order:', error);
      enqueueSnackbar('❌ Erreur lors de l\'impression', { variant: 'error' });
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    try {
      enqueueSnackbar('🖨️ Préparation de l\'impression...', { variant: 'info' });

      const client = clients.find(c => c.id === invoice.client_id);
      if (!client) {
        enqueueSnackbar('❌ Client introuvable pour cette facture', { variant: 'error' });
        return;
      }

      // Créer le contenu HTML pour l'impression
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Facture ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .client-info { flex: 1; margin-right: 20px; }
            .invoice-details { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { margin-left: 50%; }
            .totals tr td:first-child { font-weight: bold; }
            .total-final { background-color: #f0f0f0; font-weight: bold; font-size: 18px; }
            .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FACTURE</h1>
            <p>N° ${invoice.invoice_number}</p>
          </div>

          <div class="invoice-info">
            <div class="client-info">
              <h3>FACTURÉ À</h3>
              <p><strong>${client.name}</strong></p>
              ${client.contact_person ? `<p>Contact: ${client.contact_person}</p>` : ''}
              ${client.address ? `<p>${client.address}</p>` : ''}
              ${client.phone ? `<p>Tél: ${client.phone}</p>` : ''}
              ${client.email ? `<p>Email: ${client.email}</p>` : ''}
              ${client.siret ? `<p>SIRET: ${client.siret}</p>` : ''}
              ${client.vat_number ? `<p>N° TVA: ${client.vat_number}</p>` : ''}
            </div>
            <div class="invoice-details">
              <h3>FACTURE</h3>
              <p><strong>Date facture:</strong> ${format(new Date(invoice.invoice_date), 'dd/MM/yyyy', { locale: fr })}</p>
              <p><strong>Date échéance:</strong> ${format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: fr })}</p>
              <p><strong>Délai paiement:</strong> ${client.payment_terms} jours</p>
              <p><strong>Statut:</strong> ${INVOICE_STATUS_COLORS[invoice.status]?.label || invoice.status}</p>
              ${invoice.client_order?.order_number ? `<p><strong>Commande:</strong> ${invoice.client_order.order_number}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.description || '-'}</td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>${item.unit_price.toFixed(2)}€</td>
                  <td>${item.total_price.toFixed(2)}€</td>
                </tr>
              `).join('') || '<tr><td colspan="5">Aucun article</td></tr>'}
            </tbody>
          </table>

          <table class="totals">
            <tr>
              <td>Sous-total HT:</td>
              <td>${invoice.subtotal.toFixed(2)}€</td>
            </tr>
            <tr>
              <td>TVA (${invoice.tax_rate}%):</td>
              <td>${invoice.tax_amount.toFixed(2)}€</td>
            </tr>
            <tr class="total-final">
              <td>TOTAL TTC:</td>
              <td>${invoice.total_amount.toFixed(2)}€</td>
            </tr>
          </table>

          ${invoice.notes ? `<div class="footer"><h3>NOTES</h3><p>${invoice.notes}</p></div>` : ''}

          <div class="footer">
            <p><em>Facture générée le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</em></p>
            ${invoice.payment_date ? `<p><strong>Payée le:</strong> ${format(new Date(invoice.payment_date), 'dd/MM/yyyy', { locale: fr })}</p>` : ''}
          </div>
        </body>
        </html>
      `;

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        enqueueSnackbar('✅ Facture envoyée à l\'imprimante', { variant: 'success' });
      } else {
        enqueueSnackbar('❌ Impossible d\'ouvrir la fenêtre d\'impression', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      enqueueSnackbar('❌ Erreur lors de l\'impression', { variant: 'error' });
    }
  };

  // Generate invoice from order
  const handleGenerateInvoice = async (order: ClientOrder) => {
    if (!order.items || order.items.length === 0) {
      enqueueSnackbar('Impossible de créer une facture pour une commande vide', { variant: 'error' });
      return;
    }

    try {
      const client = clients.find(c => c.id === order.client_id);
      if (!client) {
        enqueueSnackbar('Client introuvable', { variant: 'error' });
        return;
      }

      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + client.payment_terms);

      const subtotal = order.total_amount || 0;
      const taxRate = 20; // 20% TVA par défaut
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      const invoiceData = {
        invoice_number: generateInvoiceNumber(),
        client_order_id: order.id,
        client_id: order.client_id,
        invoice_date: invoiceDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft' as const,
        organization_id: employee?.organization_id,
        employee_id: employee?.id,
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items from order items
      const invoiceItems = order.items.map(item => ({
        invoice_id: invoice.id,
        client_order_item_id: item.id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      enqueueSnackbar('Facture générée avec succès', { variant: 'success' });
      fetchInvoices();
    } catch (error) {
      console.error('Error generating invoice:', error);
      enqueueSnackbar('Erreur lors de la génération de la facture', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, width: '100%', maxWidth: '1400px', mx: 'auto', px: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
          color: 'white',
          p: { xs: 2, md: 4 },
          mb: { xs: 2, md: 4 },
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                width: { xs: 56, md: 80 },
                height: { xs: 56, md: 80 },
              }}
            >
              <ShoppingCartIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                Commandes Clients & Livraisons
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Gestion des commandes clients et facturation
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>


      {/* Missing Elements Alert */}
      {clients.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Créez d&apos;abord vos clients</strong> - Aucun client n&apos;est configuré. 
            Commencez par ajouter vos clients pour pouvoir créer des commandes.
          </Typography>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {clients.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clients
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {clientOrders.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Commandes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                {invoices.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Factures
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {clientOrders.filter(o => o.status === 'in_preparation').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En préparation
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content with Tabs */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab 
            icon={<ClientIcon />} 
            label="Clients" 
            iconPosition="start"
          />
          <Tab 
            icon={<ShoppingCartIcon />} 
            label="Commandes" 
            iconPosition="start"
          />
          <Tab 
            icon={<ReceiptIcon />} 
            label="Factures" 
            iconPosition="start"
          />
        </Tabs>

        {/* Clients Tab */}
        {currentTab === 0 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Liste des Clients ({clients.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenClientDialog()}
                color="success"
              >
                Nouveau Client
              </Button>
            </Box>

            {clients.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ClientIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucun client enregistré
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Commencez par ajouter vos clients
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenClientDialog()}>
                  Ajouter un Client
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Téléphone</TableCell>
                      <TableCell>Délai paiement</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {client.name}
                          </Typography>
                          {client.siret && (
                            <Typography variant="caption" color="text.secondary">
                              SIRET: {client.siret}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{client.contact_person || '-'}</TableCell>
                        <TableCell>{client.email || '-'}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell>{client.payment_terms} jours</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenClientDialog(client)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClient(client.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Client Orders Tab */}
        {currentTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Commandes Clients ({clientOrders.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenOrderDialog()}
                disabled={clients.length === 0}
                color="primary"
              >
                Nouvelle Commande
              </Button>
            </Box>

            {clientOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucune commande
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {clients.length === 0 
                    ? "Ajoutez d'abord des clients pour créer des commandes"
                    : "Créez votre première commande"
                  }
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={() => clients.length > 0 ? handleOpenOrderDialog() : handleOpenClientDialog()}
                >
                  {clients.length === 0 ? "Ajouter un Client" : "Créer une Commande"}
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Commande</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Livraison</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientOrders.map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {order.order_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {order.client?.name || 'Client supprimé'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.order_date), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {order.delivery_date ? format(new Date(order.delivery_date), 'dd/MM/yyyy', { locale: fr }) : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ORDER_STATUS_COLORS[order.status]?.label || order.status}
                            size="small"
                            color={ORDER_STATUS_COLORS[order.status]?.color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default' || 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {order.total_amount ? `${order.total_amount.toFixed(2)}€` : '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenOrderDialog(order)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleGenerateInvoice(order)}
                              disabled={!order.items || order.items.length === 0}
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="default"
                              onClick={() => handlePrintOrder(order)}
                              disabled={!order.items || order.items.length === 0}
                              title="Imprimer la commande"
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Invoices Tab */}
        {currentTab === 2 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Factures ({invoices.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setInvoiceDialogOpen(true)}
                color="info"
              >
                Nouvelle Facture
              </Button>
            </Box>

            {invoices.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucune facture
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Les factures générées apparaîtront ici
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Facture</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Commande</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Echéance</TableCell>
                      <TableCell>Montant TTC</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const isOverdue = invoice.status !== 'paid' && new Date(invoice.due_date) < new Date();
                      return (
                        <TableRow key={invoice.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {invoice.invoice_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {invoice.client?.name || 'Client supprimé'}
                          </TableCell>
                          <TableCell>
                            {invoice.client_order?.order_number || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.invoice_date), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={isOverdue ? 'error.main' : 'text.primary'}
                              sx={{ fontWeight: isOverdue ? 600 : 400 }}
                            >
                              {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: fr })}
                              {isOverdue && ' (En retard)'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {invoice.total_amount.toFixed(2)}€
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={INVOICE_STATUS_COLORS[invoice.status]?.label || invoice.status}
                              size="small"
                              color={isOverdue ? 'error' : (INVOICE_STATUS_COLORS[invoice.status]?.color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default' || 'default')}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton size="small" color="primary">
                                <ViewIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="default"
                                onClick={() => handlePrintInvoice(invoice)}
                                disabled={!invoice.items || invoice.items.length === 0}
                                title="Imprimer la facture"
                              >
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* Client Dialog */}
      <Dialog 
        open={clientDialogOpen} 
        onClose={handleCloseClientDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ClientIcon />
            {editingClient ? 'Modifier le client' : 'Nouveau client'}
          </Box>
          <IconButton
            onClick={handleCloseClientDialog}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Nom du client"
                value={clientFormData.name}
                onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Personne de contact"
                value={clientFormData.contact_person}
                onChange={(e) => setClientFormData({ ...clientFormData, contact_person: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={clientFormData.email}
                onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={clientFormData.phone}
                onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Adresse"
                value={clientFormData.address}
                onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="SIRET"
                value={clientFormData.siret}
                onChange={(e) => setClientFormData({ ...clientFormData, siret: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="N° TVA"
                value={clientFormData.vat_number}
                onChange={(e) => setClientFormData({ ...clientFormData, vat_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Délai de paiement (jours)"
                value={clientFormData.payment_terms}
                onChange={(e) => setClientFormData({ ...clientFormData, payment_terms: parseInt(e.target.value) || 30 })}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={handleCloseClientDialog} variant="outlined">
            Annuler
          </Button>
          <Button onClick={handleSaveClient} variant="contained" startIcon={<SaveIcon />}>
            {editingClient ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Dialog */}
      <Dialog 
        open={orderDialogOpen} 
        onClose={handleCloseOrderDialog} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            height: '90vh',
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShoppingCartIcon />
            {editingOrder ? `Modifier la commande ${orderFormData.order_number}` : 'Nouvelle commande'}
          </Box>
          <IconButton
            onClick={handleCloseOrderDialog}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflowY: 'auto' }}>
          {/* Basic Order Info */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Informations de commande</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="N° Commande"
                  value={orderFormData.order_number}
                  disabled
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={orderFormData.client_id}
                    label="Client"
                    onChange={(e) => setOrderFormData({ ...orderFormData, client_id: e.target.value })}
                  >
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        <Box>
                          <Typography variant="subtitle2">{client.name}</Typography>
                          {client.contact_person && (
                            <Typography variant="caption" color="text.secondary">
                              {client.contact_person}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={orderFormData.status}
                    label="Statut"
                    onChange={(e) => setOrderFormData({ ...orderFormData, status: e.target.value as 'draft' | 'confirmed' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled' })}
                  >
                    {Object.entries(ORDER_STATUS_COLORS).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        <Chip
                          label={config.label}
                          size="small"
                          color={config.color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default'}
                          variant="outlined"
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date de livraison"
                  value={orderFormData.delivery_date}
                  onChange={(date) => setOrderFormData({ ...orderFormData, delivery_date: date })}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Adresse de livraison"
                  value={orderFormData.delivery_address}
                  onChange={(e) => setOrderFormData({ ...orderFormData, delivery_address: e.target.value })}
                  placeholder="Optionnel - laissez vide pour utiliser l'adresse du client"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={orderFormData.notes}
                  onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Product Selection */}
          <Paper sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Produits (Total: {calculateOrderTotal(orderFormData.items).toFixed(2)}€)</Typography>
              <Button
                variant="contained"
                startIcon={<RestaurantIcon />}
                onClick={() => setPreparationSelectionOpen(true)}
              >
                Ajouter depuis préparations
              </Button>
            </Box>
            
            {/* Add Custom Product Form */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }} variant="outlined">
              <Typography variant="subtitle1" gutterBottom>Ajouter un produit personnalisé</Typography>
              <Grid container spacing={2} alignItems="end">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Nom du produit"
                    value={newItemFormData.product_name}
                    onChange={(e) => setNewItemFormData({ ...newItemFormData, product_name: e.target.value })}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantité"
                    value={newItemFormData.quantity}
                    onChange={(e) => setNewItemFormData({ ...newItemFormData, quantity: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, step: 0.1 }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Unité</InputLabel>
                    <Select
                      value={newItemFormData.unit}
                      label="Unité"
                      onChange={(e) => setNewItemFormData({ ...newItemFormData, unit: e.target.value })}
                    >
                      {UNITS.map((unit) => (
                        <MenuItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Prix unitaire (€)"
                    value={newItemFormData.unit_price}
                    onChange={(e) => setNewItemFormData({ ...newItemFormData, unit_price: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, step: 0.01 }}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={handleAddNewItemToOrder}
                    startIcon={<AddIcon />}
                    fullWidth
                  >
                    Ajouter
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Order Items List */}
            {orderFormData.items.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <RestaurantIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography>Aucun produit ajouté</Typography>
              </Box>
            ) : (
              <TableContainer sx={{ flex: 1 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Produit</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Prix unitaire</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Allergènes</TableCell>
                      <TableCell width="100">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderFormData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {item.product_name}
                            </Typography>
                            {item.description && (
                              <Typography variant="caption" color="text.secondary">
                                {item.description}
                              </Typography>
                            )}
                            {item.preparation_id && (
                              <Chip label="Préparation" size="small" variant="outlined" color="primary" sx={{ mt: 0.5 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateOrderItemQuantity(index, parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.1 }}
                            size="small"
                            sx={{ width: 80 }}
                          />
                          <Typography variant="caption" display="block">{item.unit}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.unit_price.toFixed(2)}€/{item.unit}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.total_price.toFixed(2)}€
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {item.allergens.length > 0 ? (
                              item.allergens.slice(0, 2).map((allergen) => (
                                <Chip
                                  key={allergen}
                                  label={allergen}
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">Aucun</Typography>
                            )}
                            {item.allergens.length > 2 && (
                              <Chip
                                label={`+${item.allergens.length - 2}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveOrderItem(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseOrderDialog} variant="outlined">
            Annuler
          </Button>
          <Button onClick={handleSaveOrder} variant="contained" startIcon={<SaveIcon />}>
            {editingOrder ? 'Modifier' : 'Créer'} la commande
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preparation Selection Dialog */}
      <Dialog
        open={preparationSelectionOpen}
        onClose={() => setPreparationSelectionOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <RestaurantIcon />
            Sélectionner des préparations
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {preparations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <RestaurantIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucune préparation disponible
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Créez d&apos;abord des préparations dans la section &quot;Préparations&quot;
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {preparations.map((preparation) => {
                const categoryConfig = getCategoryConfig(preparation.category);
                const stateConfig = getStateConfig(preparation.state);
                const isDlcExpired = preparation.dlc && new Date(preparation.dlc) < new Date();
                
                return (
                  <Grid item xs={12} md={6} key={preparation.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        opacity: isDlcExpired ? 0.6 : 1,
                        border: isDlcExpired ? '1px solid' : 'none',
                        borderColor: 'error.main'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {preparation.designation}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <span>{categoryConfig.icon}</span>
                              <Typography variant="body2" color="text.secondary">
                                {categoryConfig.label}
                              </Typography>
                              <Chip
                                label={stateConfig.label}
                                size="small"
                                color={stateConfig.color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default'}
                                variant="outlined"
                              />
                            </Box>
                            {isDlcExpired && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <WarningIcon color="error" fontSize="small" />
                                <Typography variant="caption" color="error">
                                  DLC dépassée
                                </Typography>
                              </Box>
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {preparation.selling_price}€/{preparation.price_unit}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Stock: {preparation.quantity} {preparation.quantity_unit}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <TextField
                              type="number"
                              label="Quantité"
                              defaultValue={1}
                              inputProps={{ min: 1, max: preparation.quantity, step: 0.1 }}
                              size="small"
                              sx={{ width: 80, mb: 1 }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const quantity = parseFloat((e.target as HTMLInputElement).value) || 1;
                                  handleAddPreparationToOrder(preparation, quantity);
                                  setPreparationSelectionOpen(false);
                                }
                              }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AddIcon />}
                              disabled={isDlcExpired || preparation.quantity <= 0}
                              onClick={(e) => {
                                const quantityInput = e.currentTarget.parentElement?.querySelector('input');
                                const quantity = parseFloat(quantityInput?.value || '1') || 1;
                                handleAddPreparationToOrder(preparation, quantity);
                                setPreparationSelectionOpen(false);
                              }}
                              sx={{ display: 'block', width: '100%' }}
                            >
                              Ajouter
                            </Button>
                          </Box>
                        </Box>
                        {preparation.allergens.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {preparation.allergens.slice(0, 3).map((allergen) => (
                              <Chip
                                key={allergen}
                                label={allergen}
                                size="small"
                                variant="outlined"
                                color="warning"
                              />
                            ))}
                            {preparation.allergens.length > 3 && (
                              <Chip
                                label={`+${preparation.allergens.length - 3}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreparationSelectionOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for quick actions */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => {
          if (currentTab === 0) handleOpenClientDialog();
          else if (currentTab === 1) handleOpenOrderDialog();
          else if (currentTab === 2) setInvoiceDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}