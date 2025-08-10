"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';

export default function TemperatureControl() {
  const [activeTab, setActiveTab] = useState<'truck' | 'ambient' | 'fresh' | 'frozen'>('truck');
  const [nonConformity, setNonConformity] = useState('');
  
  // État pour le contrôle du camion
  const [truckControl, setTruckControl] = useState<TablesInsert<'truck_temperature_controls'>>({
    delivery_id: null,
    storage_type: '',
    truck_temperature: 0,
    control_date: new Date().toISOString(),
    is_compliant: true,
  });

  // État pour les contrôles produits
  const [productControl, setProductControl] = useState<TablesInsert<'product_reception_controls'>>({
    delivery_id: null,
    product_id: null,
    storage_type: 'ambiant',
    product_name: '',
    temperature: null,
    best_before_date: null,
    use_by_date: null,
    control_date: new Date().toISOString(),
    is_compliant: true,
  });

  const handleTruckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('truck_temperature_controls')
        .insert([truckControl]);
      
      if (error) throw error;
      alert('Contrôle du camion enregistré avec succès!');
    } catch (error) {
      console.error('Error saving truck control:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('product_reception_controls')
        .insert([productControl]);
      
      if (error) throw error;
      alert('Contrôle produit enregistré avec succès!');
    } catch (error) {
      console.error('Error saving product control:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleNonConformitySubmit = async () => {
    if (!nonConformity.trim()) return;
    
    try {
      const { error } = await supabase
        .from('non_conformities')
        .insert([{
          non_conformity_type: 'temperature',
          product_name: productControl.product_name || 'N/A',
          description: nonConformity,
          delivery_id: productControl.delivery_id || truckControl.delivery_id,
          product_reception_control_id: productControl.id || null
        }]);
      
      if (error) throw error;
      alert('Non-conformité enregistrée!');
      setNonConformity('');
    } catch (error) {
      console.error('Error saving non-conformity:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Contrôle T°</h1>
      
      {/* Section Non-conformités */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Non-conformités</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={nonConformity}
            onChange={(e) => setNonConformity(e.target.value)}
            placeholder="Doc/info"
            className="flex-1 p-2 border rounded"
          />
          <button 
            onClick={handleNonConformitySubmit}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Ajouter
          </button>
        </div>
      </div>

      <div className="border-b mb-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('truck')}
            className={`py-2 px-4 ${activeTab === 'truck' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Camion
          </button>
          <button
            onClick={() => setActiveTab('ambient')}
            className={`py-2 px-4 ${activeTab === 'ambient' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Produit ambiant
          </button>
          <button
            onClick={() => setActiveTab('fresh')}
            className={`py-2 px-4 ${activeTab === 'fresh' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Produit frais
          </button>
          <button
            onClick={() => setActiveTab('frozen')}
            className={`py-2 px-4 ${activeTab === 'frozen' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Produit surgelé
          </button>
        </nav>
      </div>

      {/* Formulaire pour le contrôle du camion */}
      {activeTab === 'truck' && (
        <form onSubmit={handleTruckSubmit} className="space-y-4">
          <div>
            <label className="block">ID de la livraison</label>
            <input
              type="text"
              value={truckControl.delivery_id || ''}
              onChange={(e) => setTruckControl({...truckControl, delivery_id: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="ID de la livraison"
            />
          </div>
          
          <div>
            <label className="block">Type de stockage</label>
            <select
              value={truckControl.storage_type}
              onChange={(e) => setTruckControl({...truckControl, storage_type: e.target.value})}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Sélectionner</option>
              <option value="ambiant">Ambiant</option>
              <option value="fresh">Frais</option>
              <option value="frozen">Surgelé</option>
            </select>
          </div>
          
          <div>
            <label className="block">Température du camion (°C)</label>
            <input
              type="number"
              value={truckControl.truck_temperature}
              onChange={(e) => setTruckControl({...truckControl, truck_temperature: Number(e.target.value) || 0})}
              required
              className="w-full p-2 border rounded"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={truckControl.is_compliant}
                onChange={(e) => setTruckControl({...truckControl, is_compliant: e.target.checked})}
                className="mr-2"
              />
              Conforme
            </label>
          </div>
          
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Enregistrer
          </button>
        </form>
      )}

      {/* Formulaire pour les produits (ambiant, frais, surgelé) */}
      {(activeTab === 'ambient' || activeTab === 'fresh' || activeTab === 'frozen') && (
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div>
            <label className="block">ID de la livraison</label>
            <input
              type="text"
              value={productControl.delivery_id || ''}
              onChange={(e) => setProductControl({...productControl, delivery_id: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="ID de la livraison"
            />
          </div>
          
          <div>
            <label className="block">Nom du produit</label>
            <input
              type="text"
              value={productControl.product_name}
              onChange={(e) => setProductControl({...productControl, product_name: e.target.value})}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block">Type de stockage</label>
            <select
              value={activeTab === 'ambient' ? 'ambiant' : activeTab === 'fresh' ? 'fresh' : 'frozen'}
              onChange={(e) => setProductControl({...productControl, storage_type: e.target.value})}
              required
              className="w-full p-2 border rounded"
              disabled
            >
              <option value="ambiant">Ambiant</option>
              <option value="fresh">Frais</option>
              <option value="frozen">Surgelé</option>
            </select>
          </div>
          
          <div>
            <label className="block">Température (°C)</label>
            <input
              type="number"
              value={productControl.temperature || ''}
              onChange={(e) => setProductControl({...productControl, temperature: Number(e.target.value)})}
              required
              className="w-full p-2 border rounded"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block">Date de péremption</label>
            <input
              type="date"
              value={productControl.best_before_date || ''}
              onChange={(e) => setProductControl({...productControl, best_before_date: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block">Date limite de consommation</label>
            <input
              type="date"
              value={productControl.use_by_date || ''}
              onChange={(e) => setProductControl({...productControl, use_by_date: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={productControl.is_compliant}
                onChange={(e) => setProductControl({...productControl, is_compliant: e.target.checked})}
                className="mr-2"
              />
              Conforme
            </label>
          </div>
          
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Enregistrer
          </button>
        </form>
      )}
    </div>
  );
}