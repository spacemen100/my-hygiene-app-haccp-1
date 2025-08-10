import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TablesInsert } from '../types/database';

export default function LabelRecording() {
  const [formData, setFormData] = useState<TablesInsert<'label_records'>>({
    record_date: new Date().toISOString(),
    photo_url: '',
    product_name: '',
    supplier_name: '',
    batch_number: '',
    organization_id: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('label_records')
        .insert([formData]);
      
      if (error) throw error;
      alert('Enregistrement d\'étiquette réussi!');
    } catch (error) {
      console.error('Error saving label:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enregistrement des Étiquettes</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Nom du produit</label>
          <input
            type="text"
            value={formData.product_name || ''}
            onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block">Nom du fournisseur</label>
          <input
            type="text"
            value={formData.supplier_name || ''}
            onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block">Numéro de lot</label>
          <input
            type="text"
            value={formData.batch_number || ''}
            onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block">Photo de l'étiquette</label>
          <input
            type="text"
            value={formData.photo_url}
            onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
            placeholder="URL de la photo"
            required
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