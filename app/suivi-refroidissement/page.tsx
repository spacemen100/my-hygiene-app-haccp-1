"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';

export default function CoolingTracking() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('cooling_records')
        .insert([formData]);
      
      if (error) throw error;
      alert('Enregistrement de refroidissement réussi!');
    } catch (error) {
      console.error('Error saving cooling record:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Suivi de Refroidissement</h1>
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
          <label className="block">Type de produit</label>
          <input
            type="text"
            value={formData.product_type}
            onChange={(e) => setFormData({...formData, product_type: e.target.value})}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">Température initiale (°C)</label>
            <input
              type="number"
              step="0.1"
              value={formData.start_core_temperature}
              onChange={(e) => setFormData({...formData, start_core_temperature: Number(e.target.value)})}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block">Température finale (°C)</label>
            <input
              type="number"
              step="0.1"
              value={formData.end_core_temperature || ''}
              onChange={(e) => setFormData({...formData, end_core_temperature: Number(e.target.value)})}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">Date de début</label>
            <input
              type="datetime-local"
              value={formData.start_date ? formData.start_date.substring(0, 16) : ''}
              onChange={(e) => setFormData({...formData, start_date: new Date(e.target.value).toISOString()})}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block">Date de fin</label>
            <input
              type="datetime-local"
              value={formData.end_date ? formData.end_date.substring(0, 16) : ''}
              onChange={(e) => setFormData({...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div>
          <label className="block">Conformité</label>
          <select
            value={formData.is_compliant === null ? '' : String(formData.is_compliant)}
            onChange={(e) => setFormData({...formData, is_compliant: e.target.value === '' ? null : e.target.value === 'true'})}
            className="w-full p-2 border rounded"
          >
            <option value="">Non évalué</option>
            <option value="true">Conforme</option>
            <option value="false">Non conforme</option>
          </select>
        </div>
        
        <div>
          <label className="block">Commentaires</label>
          <textarea
            value={formData.comments || ''}
            onChange={(e) => setFormData({...formData, comments: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Enregistrer
        </button>
      </form>
    </div>
  );
}