import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables, TablesInsert } from '../types/database';

export default function ColdStorage() {
  const [units, setUnits] = useState<Tables<'cold_storage_units'>[]>([]);
  const [readings, setReadings] = useState<Tables<'cold_storage_temperature_readings'>[]>([]);
  const [formData, setFormData] = useState<TablesInsert<'cold_storage_temperature_readings'>>({
    reading_date: new Date().toISOString(),
    temperature: 0,
    is_compliant: true,
    cold_storage_unit_id: null,
    comments: null,
    user_id: null,
  });

  useEffect(() => {
    fetchUnits();
    fetchReadings();
  }, []);

  const fetchUnits = async () => {
    const { data, error } = await supabase.from('cold_storage_units').select('*');
    if (!error && data) setUnits(data);
  };

  const fetchReadings = async () => {
    const { data, error } = await supabase
      .from('cold_storage_temperature_readings')
      .select('*')
      .order('reading_date', { ascending: false })
      .limit(10);
    if (!error && data) setReadings(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('cold_storage_temperature_readings')
        .insert([formData]);
      
      if (error) throw error;
      alert('Lecture enregistrée avec succès!');
      fetchReadings();
    } catch (error) {
      console.error('Error saving reading:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enceintes Froides</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Nouvelle Lecture</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block">Unité de stockage</label>
              <select
                value={formData.cold_storage_unit_id || ''}
                onChange={(e) => setFormData({...formData, cold_storage_unit_id: e.target.value})}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Sélectionner une unité</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.location})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block">Température (°C)</label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({...formData, temperature: Number(e.target.value)})}
                required
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
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Dernières Lectures</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">Date</th>
                  <th className="py-2 px-4 border">Unité</th>
                  <th className="py-2 px-4 border">Température</th>
                  <th className="py-2 px-4 border">Statut</th>
                </tr>
              </thead>
              <tbody>
                {readings.map(reading => {
                  const unit = units.find(u => u.id === reading.cold_storage_unit_id);
                  return (
                    <tr key={reading.id}>
                      <td className="py-2 px-4 border">
                        {new Date(reading.reading_date).toLocaleString()}
                      </td>
                      <td className="py-2 px-4 border">
                        {unit ? unit.name : 'N/A'}
                      </td>
                      <td className="py-2 px-4 border">
                        {reading.temperature}°C
                      </td>
                      <td className="py-2 px-4 border">
                        {reading.is_compliant ? (
                          <span className="text-green-500">Conforme</span>
                        ) : (
                          <span className="text-red-500">Non conforme</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}