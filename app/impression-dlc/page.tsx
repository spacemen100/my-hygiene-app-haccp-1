"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';

export default function LabelPrinting() {
  const [formData, setFormData] = useState<TablesInsert<'label_printings'>>({
    print_date: new Date().toISOString(),
    expiry_date: '',
    label_count: 1,
    product_label_type_id: null,
    organization_id: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('label_printings')
        .insert([formData]);
      
      if (error) throw error;
      alert('Impression enregistrée avec succès!');
    } catch (error) {
      console.error('Error saving printing:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Impression des DLC Secondaires</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Date d'expiration</label>
          <input
            type="date"
            value={formData.expiry_date.split('T')[0]}
            onChange={(e) => setFormData({...formData, expiry_date: new Date(e.target.value).toISOString()})}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block">Nombre d'étiquettes</label>
          <input
            type="number"
            value={formData.label_count}
            onChange={(e) => setFormData({...formData, label_count: Number(e.target.value)})}
            min="1"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block">Type d'étiquette</label>
          <input
            type="text"
            value={formData.product_label_type_id || ''}
            onChange={(e) => setFormData({...formData, product_label_type_id: e.target.value})}
            placeholder="ID du type d'étiquette"
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