"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';
import { Camera, CheckCircle, XCircle, AlertTriangle, FileText, Thermometer, Calendar, Package } from 'lucide-react';

export default function DeliveryControlSystem() {
  const [activeTab, setActiveTab] = useState('ambient');

  const tabs = [
    { id: 'ambient', label: 'Produit Ambiant', icon: Package },
    { id: 'fresh', label: 'Produit Frais', icon: Thermometer },
    { id: 'frozen', label: 'Produit Surgelé', icon: Thermometer },
    { id: 'non-conformities', label: 'Non-conformités', icon: AlertTriangle },
    { id: 'doc-info', label: 'Doc/Info', icon: FileText }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Contrôle des Livraisons</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Navigation tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 min-w-fit whitespace-nowrap font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenu des tabs */}
        <div className="p-6">
          {activeTab === 'ambient' && <AmbientProductControl />}
          {activeTab === 'fresh' && <FreshProductControl />}
          {activeTab === 'frozen' && <FrozenProductControl />}
          {activeTab === 'non-conformities' && <NonConformitiesControl />}
          {activeTab === 'doc-info' && <DocInfoControl />}
        </div>
      </div>
    </div>
  );
};

// Composant pour contrôler un produit ambiant
const AmbientProductControl = () => {
  const [formData, setFormData] = useState<Partial<TablesInsert<'product_reception_controls'>>>({
    product_name: '',
    storage_type: 'ambiant',
    best_before_date: undefined,
    use_by_date: undefined,
    is_compliant: null,
    control_date: new Date().toISOString()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('product_reception_controls')
        .insert([{
          ...formData,
          control_date: new Date().toISOString(),
          is_compliant: formData.is_compliant || false
        }]);
      
      if (error) throw error;
      console.log('Contrôle produit ambiant enregistré');
      // Reset form or show success message
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <Package className="w-6 h-6 mr-2 text-amber-600" />
        Contrôle Produit Ambiant
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.product_name}
            onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date limite de consommation
            </label>
            <input
              type="date"
              value={formData.best_before_date}
              onChange={(e) => setFormData({...formData, best_before_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de péremption
            </label>
            <input
              type="date"
              value={formData.use_by_date}
              onChange={(e) => setFormData({...formData, use_by_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Conformité du produit *
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, is_compliant: true})}
              className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
                formData.is_compliant === true
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Conforme
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, is_compliant: false})}
              className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
                formData.is_compliant === false
                  ? 'bg-red-100 border-red-500 text-red-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Non conforme
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo du produit
          </label>
          <button
            type="button"
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-4 h-4 mr-2" />
            Prendre une photo
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commentaires
          </label>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData({...formData, comments: e.target.value})}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observations supplémentaires..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Enregistrer le contrôle
        </button>
      </form>
    </div>
  );
};

// Composant pour contrôler un produit frais
const FreshProductControl = () => {
  const [formData, setFormData] = useState<Partial<TablesInsert<'product_reception_controls'>>>({
    product_name: '',
    storage_type: 'frais',
    temperature: undefined,
    best_before_date: undefined,
    use_by_date: undefined,
    is_compliant: null,
    control_date: new Date().toISOString()
  });

  const isTemperatureCompliant = (temp: number) => {
    return temp >= 0 && temp <= 4;
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const temp = parseFloat(e.target.value);
    setFormData({
      ...formData, 
      temperature: !isNaN(temp) ? temp : undefined,
      is_compliant: !isNaN(temp) ? isTemperatureCompliant(temp) : null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('product_reception_controls')
        .insert([{
          ...formData,
          control_date: new Date().toISOString(),
          is_compliant: formData.is_compliant || false
        }]);
      
      if (error) throw error;
      console.log('Contrôle produit frais enregistré');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <Thermometer className="w-6 h-6 mr-2 text-blue-600" />
        Contrôle Produit Frais
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.product_name}
            onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Température (°C) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={formData.temperature || ''}
              onChange={handleTemperatureChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                formData.temperature !== undefined
                  ? isTemperatureCompliant(formData.temperature)
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Entre 0°C et 4°C"
              required
            />
            {formData.temperature !== undefined && (
              <div className="absolute right-3 top-2">
                {isTemperatureCompliant(formData.temperature) ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Température réglementaire : 0°C à 4°C
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date limite de consommation
            </label>
            <input
              type="date"
              value={formData.best_before_date}
              onChange={(e) => setFormData({...formData, best_before_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de péremption
            </label>
            <input
              type="date"
              value={formData.use_by_date}
              onChange={(e) => setFormData({...formData, use_by_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo du produit
          </label>
          <button
            type="button"
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-4 h-4 mr-2" />
            Prendre une photo
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commentaires
          </label>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData({...formData, comments: e.target.value})}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observations supplémentaires..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Enregistrer le contrôle
        </button>
      </form>
    </div>
  );
};

// Composant pour contrôler un produit surgelé
const FrozenProductControl = () => {
  const [formData, setFormData] = useState<Partial<TablesInsert<'product_reception_controls'>>>({
    product_name: '',
    storage_type: 'surgelé',
    temperature: undefined,
    best_before_date: undefined,
    use_by_date: undefined,
    is_compliant: null,
    control_date: new Date().toISOString()
  });

  const isTemperatureCompliant = (temp: number) => {
    return temp <= -18;
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const temp = parseFloat(e.target.value);
    setFormData({
      ...formData, 
      temperature: !isNaN(temp) ? temp : undefined,
      is_compliant: !isNaN(temp) ? isTemperatureCompliant(temp) : null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('product_reception_controls')
        .insert([{
          ...formData,
          control_date: new Date().toISOString(),
          is_compliant: formData.is_compliant || false
        }]);
      
      if (error) throw error;
      console.log('Contrôle produit surgelé enregistré');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <Thermometer className="w-6 h-6 mr-2 text-cyan-600" />
        Contrôle Produit Surgelé
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.product_name}
            onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Température (°C) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={formData.temperature || ''}
              onChange={handleTemperatureChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                formData.temperature !== undefined
                  ? isTemperatureCompliant(formData.temperature)
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="-18°C ou moins"
              required
            />
            {formData.temperature !== undefined && (
              <div className="absolute right-3 top-2">
                {isTemperatureCompliant(formData.temperature) ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Température réglementaire : -18°C ou moins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date limite de consommation
            </label>
            <input
              type="date"
              value={formData.best_before_date}
              onChange={(e) => setFormData({...formData, best_before_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de péremption
            </label>
            <input
              type="date"
              value={formData.use_by_date}
              onChange={(e) => setFormData({...formData, use_by_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo du produit
          </label>
          <button
            type="button"
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-4 h-4 mr-2" />
            Prendre une photo
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commentaires
          </label>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData({...formData, comments: e.target.value})}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observations supplémentaires..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Enregistrer le contrôle
        </button>
      </form>
    </div>
  );
};

// Composant pour gérer les non-conformités
const NonConformitiesControl = () => {
  const [nonConformities, setNonConformities] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNonConformity, setNewNonConformity] = useState<Partial<TablesInsert<'non_conformities'>>>({
    non_conformity_type: '',
    product_name: '',
    quantity: undefined,
    quantity_type: 'kg',
    description: '',
    other_cause: ''
  });

  const nonConformityTypes = [
    'Température non conforme',
    'Date de péremption dépassée',
    'Emballage défectueux',
    'Produit endommagé',
    'Quantité incorrecte',
    'Étiquetage manquant',
    'Autre'
  ];

  const quantityTypes = ['kg', 'g', 'L', 'mL', 'pièce(s)', 'lot(s)'];

  const handleAddNonConformity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('non_conformities')
        .insert([newNonConformity])
        .select()
        .single();
      
      if (error) throw error;
      
      setNonConformities([...nonConformities, data]);
      setNewNonConformity({
        non_conformity_type: '',
        product_name: '',
        quantity: undefined,
        quantity_type: 'kg',
        description: '',
        other_cause: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDeleteNonConformity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('non_conformities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setNonConformities(nonConformities.filter(nc => nc.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
          Non-conformités
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Signaler une non-conformité
        </button>
      </div>

      {/* Liste des non-conformités */}
      <div className="space-y-4 mb-6">
        {nonConformities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune non-conformité signalée</p>
          </div>
        ) : (
          nonConformities.map((nc) => (
            <div key={nc.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-red-800">{nc.non_conformity_type}</h3>
                  <p className="text-sm text-gray-600">Produit: {nc.product_name}</p>
                </div>
                <button
                  onClick={() => handleDeleteNonConformity(nc.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              {nc.quantity && (
                <p className="text-sm text-gray-600 mb-2">
                  Quantité: {nc.quantity} {nc.quantity_type}
                </p>
              )}
              
              {nc.description && (
                <p className="text-sm text-gray-700 mb-2">{nc.description}</p>
              )}
              
              {nc.other_cause && (
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Autre cause:</strong> {nc.other_cause}
                </p>
              )}
              
              <p className="text-xs text-gray-500">
                Signalé le {new Date(nc.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Signaler une non-conformité</h3>
            
            <form onSubmit={handleAddNonConformity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de non-conformité *
                </label>
                <select
                  value={newNonConformity.non_conformity_type}
                  onChange={(e) => setNewNonConformity({...newNonConformity, non_conformity_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  {nonConformityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={newNonConformity.product_name}
                  onChange={(e) => setNewNonConformity({...newNonConformity, product_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newNonConformity.quantity || ''}
                    onChange={(e) => setNewNonConformity({...newNonConformity, quantity: parseFloat(e.target.value) || undefined})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unité
                  </label>
                  <select
                    value={newNonConformity.quantity_type}
                    onChange={(e) => setNewNonConformity({...newNonConformity, quantity_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {quantityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newNonConformity.description}
                  onChange={(e) => setNewNonConformity({...newNonConformity, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Décrivez la non-conformité..."
                />
              </div>

              {newNonConformity.non_conformity_type === 'Autre' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Précisez la cause
                  </label>
                  <input
                    type="text"
                    value={newNonConformity.other_cause}
                    onChange={(e) => setNewNonConformity({...newNonConformity, other_cause: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Précisez..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo
                </label>
                <button
                  type="button"
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Prendre une photo
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Signaler
                </button>
// Composant pour la documentation et les informations
const DocInfoControl = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-blue-600" />
        Documentation & Informations
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Températures Réglementaires</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Produits frais:</strong> 0°C à 4°C</p>
            <p><strong>Produits surgelés:</strong> -18°C ou moins</p>
            <p><strong>Produits ambiants:</strong> Température ambiante</p>
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Procédure de Contrôle</h3>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Vérifier la température du camion</li>
            <li>Contrôler chaque produit individuellement</li>
            <li>Vérifier les dates de péremption</li>
            <li>Documenter toute non-conformité</li>
            <li>Prendre des photos si nécessaire</li>
          </ol>
        </div>
        
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Types de Non-conformités</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Température non conforme</li>
            <li>Date de péremption dépassée</li>
            <li>Emballage défectueux</li>
            <li>Produit endommagé</li>
            <li>Quantité incorrecte</li>
            <li>Étiquetage manquant</li>
          </ul>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Actions en cas de Non-conformité</h3>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Signaler immédiatement</li>
            <li>Isoler le produit concerné</li>
            <li>Documenter avec photos</li>
            <li>Contacter le fournisseur</li>
            <li>Suivre la procédure de retour</li>
          </ol>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Contacts Utiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Responsable Qualité:</strong></p>
            <p>Tel: 01 23 45 67 89</p>
            <p>Email: qualite@entreprise.com</p>
          </div>
          <div>
            <p><strong>Service Livraisons:</strong></p>
            <p>Tel: 01 23 45 67 90</p>
            <p>Email: livraisons@entreprise.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryControlSystem;