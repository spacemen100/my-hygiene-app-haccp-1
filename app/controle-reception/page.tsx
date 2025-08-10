"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/src/types/database';
import { Camera, CheckCircle, XCircle, AlertTriangle, FileText, Thermometer, Package, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

type Delivery = TablesInsert<'deliveries'> & {
  supplier?: {
    name: string;
    contact_person: string;
  };
};

export default function DeliveryComponent() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDelivery, setNewDelivery] = useState<Partial<Delivery>>({
    delivery_date: new Date().toISOString(),
    is_compliant: true,
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeliveries();
    fetchSuppliers();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`*, supplier:suppliers(name, contact_person)`)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les livraisons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleCreateDelivery = async () => {
    if (!newDelivery.supplier_id || !newDelivery.delivery_date) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .insert([{
          ...newDelivery,
          organization_id: 'your-organization-id', // À remplacer par l'ID réel
          user_id: 'current-user-id', // À remplacer par l'ID utilisateur
        }])
        .select();

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Livraison enregistrée avec succès',
      });

      setNewDelivery({
        delivery_date: new Date().toISOString(),
        is_compliant: true,
      });
      setShowForm(false);
      fetchDeliveries();
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la livraison',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(filePath);

      setNewDelivery({ ...newDelivery, photo_url: publicUrl });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger la photo',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          Gestion des Livraisons
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Livraison
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Nouvelle Livraison
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="supplier">Fournisseur *</Label>
              <Select
                onValueChange={(value) => setNewDelivery({ ...newDelivery, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date de livraison *</Label>
              <Input
                type="datetime-local"
                value={newDelivery.delivery_date?.substring(0, 16)}
                onChange={(e) =>
                  setNewDelivery({
                    ...newDelivery,
                    delivery_date: e.target.value ? new Date(e.target.value).toISOString() : '',
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="number">Numéro de livraison</Label>
              <Input
                type="text"
                placeholder="N° livraison"
                value={newDelivery.delivery_number || ''}
                onChange={(e) =>
                  setNewDelivery({ ...newDelivery, delivery_number: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="compliance">Conformité</Label>
              <Select
                onValueChange={(value) =>
                  setNewDelivery({ ...newDelivery, is_compliant: value === 'true' })
                }
                value={newDelivery.is_compliant ? 'true' : 'false'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Conforme</SelectItem>
                  <SelectItem value="false">Non conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="comments">Commentaires</Label>
              <Input
                type="text"
                placeholder="Commentaires"
                value={newDelivery.comments || ''}
                onChange={(e) =>
                  setNewDelivery({ ...newDelivery, comments: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="photo">Photo</Label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer border rounded-md p-2 hover:bg-gray-50">
                  <Camera className="w-4 h-4" />
                  <span>{newDelivery.photo_url ? 'Photo sélectionnée' : 'Ajouter une photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadPhoto}
                  />
                </label>
                {newDelivery.photo_url && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Photo prête
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateDelivery} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-100 p-4 font-semibold border-b">
            <div className="col-span-2">Date</div>
            <div className="col-span-3">Fournisseur</div>
            <div className="col-span-2">N° Livraison</div>
            <div className="col-span-2">Statut</div>
            <div className="col-span-2">Photo</div>
            <div className="col-span-1">Actions</div>
          </div>

          {deliveries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucune livraison enregistrée
            </div>
          ) : (
            deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="grid grid-cols-12 p-4 items-center border-b hover:bg-gray-50"
              >
                <div className="col-span-2">
                  {new Date(delivery.delivery_date).toLocaleString()}
                </div>
                <div className="col-span-3">
                  <div className="font-medium">{delivery.supplier?.name}</div>
                  <div className="text-sm text-gray-500">
                    {delivery.supplier?.contact_person}
                  </div>
                </div>
                <div className="col-span-2">{delivery.delivery_number || '-'}</div>
                <div className="col-span-2">
                  {delivery.is_compliant ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Conforme
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      Non conforme
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  {delivery.photo_url ? (
                    <a
                      href={delivery.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Camera className="w-4 h-4" />
                      Voir
                    </a>
                  ) : (
                    <span className="text-gray-400">Aucune</span>
                  )}
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="sm">
                    Détails
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}