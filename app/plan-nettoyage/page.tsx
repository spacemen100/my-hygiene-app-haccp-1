"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/src/types/database';

export default function CleaningPlan() {
  const [tasks, setTasks] = useState<Tables<'cleaning_tasks'>[]>([]);
  const [records, setRecords] = useState<Tables<'cleaning_records'>[]>([]);
  const [formData, setFormData] = useState<TablesInsert<'cleaning_records'>>({
    scheduled_date: new Date().toISOString(),
    cleaning_task_id: null,
    is_completed: false,
    is_compliant: false,
    comments: null,
    completion_date: null,
    photo_url: null,
    user_id: null,
  });

  useEffect(() => {
    fetchTasks();
    fetchRecords();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('cleaning_tasks').select('*');
    if (!error && data) setTasks(data);
  };

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('cleaning_records')
      .select('*')
      .order('scheduled_date', { ascending: false })
      .limit(10);
    if (!error && data) setRecords(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('cleaning_records')
        .insert([formData]);
      
      if (error) throw error;
      alert('Enregistrement de nettoyage réussi!');
      fetchRecords();
    } catch (error) {
      console.error('Error saving cleaning record:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Plan de Nettoyage</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Nouvelle Exécution</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block">Tâche de nettoyage</label>
              <select
                value={formData.cleaning_task_id || ''}
                onChange={(e) => setFormData({...formData, cleaning_task_id: e.target.value})}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Sélectionner une tâche</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.name} ({task.frequency})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block">Date prévue</label>
              <input
                type="datetime-local"
                value={formData.scheduled_date ? formData.scheduled_date.substring(0, 16) : ''}
                onChange={(e) => setFormData({...formData, scheduled_date: new Date(e.target.value).toISOString()})}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_completed || false}
                    onChange={(e) => setFormData({...formData, is_completed: e.target.checked})}
                    className="mr-2"
                  />
                  Complété
                </label>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_compliant || false}
                    onChange={(e) => setFormData({...formData, is_compliant: e.target.checked})}
                    className="mr-2"
                  />
                  Conforme
                </label>
              </div>
            </div>
            
            {formData.is_completed && (
              <>
                <div>
                  <label className="block">Date de complétion</label>
                  <input
                    type="datetime-local"
                    value={formData.completion_date ? formData.completion_date.substring(0, 16) : ''}
                    onChange={(e) => setFormData({...formData, completion_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block">URL de la photo</label>
                  <input
                    type="text"
                    value={formData.photo_url || ''}
                    onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </>
            )}
            
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
          <h2 className="text-xl font-semibold mb-2">Dernières Exécutions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">Tâche</th>
                  <th className="py-2 px-4 border">Date</th>
                  <th className="py-2 px-4 border">Statut</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => {
                  const task = tasks.find(t => t.id === record.cleaning_task_id);
                  return (
                    <tr key={record.id}>
                      <td className="py-2 px-4 border">
                        {task ? task.name : 'N/A'}
                      </td>
                      <td className="py-2 px-4 border">
                        {new Date(record.scheduled_date).toLocaleString()}
                      </td>
                      <td className="py-2 px-4 border">
                        {record.is_completed ? (
                          record.is_compliant ? (
                            <span className="text-green-500">Complété (Conforme)</span>
                          ) : (
                            <span className="text-yellow-500">Complété (Non conforme)</span>
                          )
                        ) : (
                          <span className="text-gray-500">En attente</span>
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