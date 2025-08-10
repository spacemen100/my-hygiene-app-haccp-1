"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';

export default function ReceptionControl() {
  const [formData, setFormData] = useState<TablesInsert<'product_reception_controls'>>({
    control_date: new Date().toISOString(),
    product_name: '',
    storage_type: '',
    temperature: null,
    is_compliant: true,
    delivery_id: null,
    product_id: null,
    best_before_date: null,
    use_by_date: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('product_reception_controls')
        .insert([formData]);
      
      if (error) throw error;
      alert('Contrôle enregistré avec succès!');
    } catch (error) {
      console.error('Error saving control:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Contrôle à Réception</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Nom du produit</label>
          <input
            type="text"
            value={formData.product_name}
            onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block">Type de stockage</label>
          <select
            value={formData.storage_type}
            onChange={(e) => setFormData({...formData, storage_type: e.target.value})}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Sélectionner</option>
            <option value="fridge">Réfrigéré</option>
            <option value="freezer">Congélateur</option>
            <option value="dry">Sec</option>
          </select>
        </div>
        
        <div>
          <label className="block">Température (°C)</label>
          <input
            type="number"
            value={formData.temperature || ''}
            onChange={(e) => setFormData({...formData, temperature: Number(e.target.value)})}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_compliant}
              onChange={(e) => setFormData({...formData, is_compliant: e.target.checked})}
              className="mr-2"
            />
            Conforme
          </label>
        </div>
        
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Enregistrer
        </button>
      </form>
    </div>
  );
}