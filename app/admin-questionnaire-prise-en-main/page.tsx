'use client';

import React, { useState, useCallback } from 'react';
import { User, Plus, Minus, Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ColdEnclosure {
  id: string;
  name: string;
  temperatureType: 'positive' | 'negative';
  maxTemp: number;
  minTemp: number;
}

interface CleaningTask {
  id: string;
  name: string;
  frequency: string;
  zone: string;
  enabled: boolean;
}

type Step = 'login' | 'info' | 'users' | 'suppliers' | 'enclosures' | 'cleaning' | 'complete';

export default function HACCPSetupComponent() {
  const [currentStep, setCurrentStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  
  // Login data
  const [email, setEmail] = useState('decin10022@mardiek.com');
  const [password, setPassword] = useState('123456789gR@');
  const [showPassword, setShowPassword] = useState(false);
  
  // Company info
  const [activitySector, setActivitySector] = useState('Restauration collective');
  const [establishmentName, setEstablishmentName] = useState('sdfd');
  const [firstName, setFirstName] = useState('sdfs');
  const [lastName, setLastName] = useState('lkmlm');
  const [phoneNumber, setPhoneNumber] = useState('534354646344');
  
  // Users
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'sdfs' },
    { id: '2', name: 'remi' },
    { id: '3', name: 'julien' }
  ]);
  
  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Cold enclosures
  const [showExample, setShowExample] = useState(false);
  const [coldEnclosures, setColdEnclosures] = useState<ColdEnclosure[]>([
    { id: '1', name: 'Enceinte froide', temperatureType: 'positive', maxTemp: 5, minTemp: 0 },
    { id: '2', name: 'Congélateur', temperatureType: 'negative', maxTemp: -15, minTemp: -24 }
  ]);
  
  // Cleaning tasks
  const [activeZone, setActiveZone] = useState('Cuisine');
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([
    { id: '1', name: 'Sol, plinthes, grilles et siphons', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '2', name: 'Sol, plinthes, grilles et siphons', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '3', name: 'Murs et portes', frequency: 'Mois', zone: 'Cuisine', enabled: true },
    { id: '4', name: 'Plans de travail', frequency: 'Après usage', zone: 'Cuisine', enabled: true },
    { id: '5', name: 'Chariots de transports plateaux', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '6', name: 'Lave-main', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '7', name: 'Poubelles et supports poubelles', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '8', name: 'Étagères', frequency: 'Mois', zone: 'Cuisine', enabled: true },
    { id: '9', name: 'Feux vifs et fourneaux', frequency: 'Jour', zone: 'Cuisine', enabled: true },
    { id: '10', name: 'Hottes et filtres de hottes', frequency: 'Mois', zone: 'Cuisine', enabled: true },
    { id: '11', name: 'Sol, plinthes, grilles et siphons', frequency: 'Semaine', zone: 'Économat', enabled: true },
    { id: '12', name: 'Murs et portes', frequency: 'Mois', zone: 'Économat', enabled: true },
    { id: '13', name: 'Poignées de portes et interrupteurs', frequency: 'Semaine', zone: 'Économat', enabled: true },
    { id: '14', name: 'Étagères et clayettes', frequency: 'Semaine', zone: 'Économat', enabled: true },
    { id: '15', name: 'Groupe Froid', frequency: 'Mois', zone: 'Économat', enabled: true }
  ]);

  const zones = ['Cuisine', 'Plonge', 'Préparation froide', 'Économat', 'Légumerie', 'Toilettes', 'Vestiaires', 'Autres'];

  const passwordRequirements = [
    { text: '1 majuscule', met: /[A-Z]/.test(password) },
    { text: '1 chiffre', met: /\d/.test(password) },
    { text: '1 caractère spécial', met: /[!@#$%^&*]/.test(password) },
    { text: '8 caractères minimum', met: password.length >= 8 }
  ];

  const handleNext = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stepOrder: Step[] = ['login', 'info', 'users', 'suppliers', 'enclosures', 'cleaning', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
    setLoading(false);
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    const stepOrder: Step[] = ['login', 'info', 'users', 'suppliers', 'enclosures', 'cleaning', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep]);

  const addUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: ''
    };
    setUsers([...users, newUser]);
  };

  const addSupplier = () => {
    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: ''
    };
    setSuppliers([...suppliers, newSupplier]);
  };

  const addColdEnclosure = () => {
    const newEnclosure: ColdEnclosure = {
      id: Date.now().toString(),
      name: '',
      temperatureType: 'positive',
      maxTemp: 5,
      minTemp: 0
    };
    setColdEnclosures([...coldEnclosures, newEnclosure]);
  };

  const updateEnclosure = (id: string, field: keyof ColdEnclosure, value: string | number) => {
    setColdEnclosures(prev => prev.map(enc => 
      enc.id === id ? { ...enc, [field]: value } : enc
    ));
  };

  const getStepProgress = () => {
    const stepOrder: Step[] = ['login', 'info', 'users', 'suppliers', 'enclosures', 'cleaning', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    return Math.round(((currentIndex + 1) / stepOrder.length) * 100);
  };

  const getFilteredTasks = () => {
    return cleaningTasks.filter(task => task.zone === activeZone);
  };

  const toggleTask = (taskId: string) => {
    setCleaningTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, enabled: !task.enabled } : task
    ));
  };

  const toggleAllTasks = () => {
    const filteredTasks = getFilteredTasks();
    const allEnabled = filteredTasks.every(task => task.enabled);
    
    setCleaningTasks(prev => prev.map(task =>
      task.zone === activeZone ? { ...task, enabled: !allEnabled } : task
    ));
  };

  const renderProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
      <div 
        className="bg-teal-600 h-2 rounded-full transition-all duration-500"
        style={{ width: `${getStepProgress()}%` }}
      />
    </div>
  );

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-3">
        <div className="text-orange-500 text-2xl font-bold">🐙</div>
        <span className="text-teal-600 text-xl font-semibold">octopus</span>
      </div>
      <button className="text-gray-400 hover:text-gray-600">
        ✕
      </button>
    </div>
  );

  const renderLoginStep = () => (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="text-2xl mb-2">🏃‍♀️ <span className="text-teal-600 font-semibold">Testez rapidement</span></div>
        <div className="flex items-start space-x-2 text-sm text-gray-600">
          <span>💡</span>
          <p>Testez gratuitement Octopus HACCP, en créant votre compte en quelques minutes. Pas de carte bancaire requise pour tester l&apos;application.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email :</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <div className="absolute right-3 top-3 text-green-500">✓</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe :</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 pr-20"
            />
            <div className="absolute right-3 top-3 flex items-center space-x-2">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <div className="text-green-500">✓</div>
            </div>
          </div>
          
          <div className="mt-2 space-y-1">
            {passwordRequirements.map((req, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {req.met && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={req.met ? 'text-green-600' : 'text-gray-500'}>{req.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInfoStep = () => (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="text-2xl mb-4">👋 <span className="text-teal-600 font-semibold">Parlez-nous un peu de vous</span></div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Secteur d&apos;activité :</label>
          <select
            value={activitySector}
            onChange={(e) => setActivitySector(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option>Restauration collective</option>
            <option>Restaurant</option>
            <option>Boulangerie</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l&apos;établissement :</label>
          <input
            type="text"
            value={establishmentName}
            onChange={(e) => setEstablishmentName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prénom :</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom :</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone :</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>
    </div>
  );

  const renderUsersStep = () => (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="text-2xl mb-4">👥 <span className="text-teal-600 font-semibold">Utilisateurs</span></div>
        <p className="text-sm text-gray-600">Veuillez indiquer le nom ou le poste des personnes qui effectueront des relevés HACCP, y compris vous-même si vous réalisez des relevés.</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
          <p className="text-sm text-yellow-800">⚠️ Vos équipes changent souvent ? Aucun problème, vous pourrez modifier, ajouter ou supprimer des utilisateurs par la suite dans vos paramètres.</p>
        </div>
      </div>

      <div className="space-y-3">
        {users.map((user, index) => (
          <input
            key={user.id}
            type="text"
            value={user.name}
            onChange={(e) => {
              const newUsers = [...users];
              newUsers[index] = { ...user, name: e.target.value };
              setUsers(newUsers);
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Nom de l&apos;utilisateur"
          />
        ))}
        
        <button
          onClick={addUser}
          className="w-full p-3 border-2 border-dashed border-teal-300 rounded-lg text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus size={20} />
          <span>Ajouter un utilisateur</span>
        </button>
      </div>
    </div>
  );

  const renderSuppliersStep = () => (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="text-2xl mb-4">🚚 <span className="text-teal-600 font-semibold">Fournisseurs</span></div>
        <p className="text-sm text-gray-600">Veuillez ajouter le nom de vos fournisseurs chez qui vous effectuez des contrôles de produits.</p>
      </div>

      <div className="space-y-3">
        {suppliers.map((supplier, index) => (
          <input
            key={supplier.id}
            type="text"
            value={supplier.name}
            onChange={(e) => {
              const newSuppliers = [...suppliers];
              newSuppliers[index] = { ...supplier, name: e.target.value };
              setSuppliers(newSuppliers);
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Ex : Pomona, Transgourmet, Metro..."
          />
        ))}
        
        <button
          onClick={addSupplier}
          className="w-full p-3 border-2 border-dashed border-teal-300 rounded-lg text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus size={20} />
          <span>Ajouter un fournisseur</span>
        </button>
      </div>
    </div>
  );

  const renderEnclosuresStep = () => (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="text-2xl mb-4">🧊 <span className="text-teal-600 font-semibold">Enceintes froides</span></div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">💡 Nous vous recommandons de créer vos enceintes froides en respectant l&apos;ordre dans lequel vous effectuez vos relevés de température.</p>
        </div>
        
        <div className="mt-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showExample}
              onChange={(e) => setShowExample(e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <span className="text-sm text-teal-600">💡 Affichez-moi un exemple</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {coldEnclosures.map((enclosure) => (
          <div key={enclosure.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l&apos;enceinte :</label>
              <input
                type="text"
                value={enclosure.name}
                onChange={(e) => updateEnclosure(enclosure.id, 'name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ex : Enceinte, congélateur..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner la température de l&apos;enceinte :</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`temp-${enclosure.id}`}
                    value="positive"
                    checked={enclosure.temperatureType === 'positive'}
                    onChange={(e) => updateEnclosure(enclosure.id, 'temperatureType', e.target.value)}
                    className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span className="text-sm">Température positive</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`temp-${enclosure.id}`}
                    value="negative"
                    checked={enclosure.temperatureType === 'negative'}
                    onChange={(e) => updateEnclosure(enclosure.id, 'temperatureType', e.target.value)}
                    className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span className="text-sm">Température négative</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">T° max</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateEnclosure(enclosure.id, 'maxTemp', enclosure.maxTemp - 1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-center min-w-12">{enclosure.maxTemp} °C</span>
                  <button
                    onClick={() => updateEnclosure(enclosure.id, 'maxTemp', enclosure.maxTemp + 1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">T° min</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateEnclosure(enclosure.id, 'minTemp', enclosure.minTemp - 1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-center min-w-12">{enclosure.minTemp} °C</span>
                  <button
                    onClick={() => updateEnclosure(enclosure.id, 'minTemp', enclosure.minTemp + 1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <button
          onClick={addColdEnclosure}
          className="w-full p-3 border-2 border-dashed border-teal-300 rounded-lg text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus size={20} />
          <span>Ajouter une enceinte froide</span>
        </button>
      </div>
    </div>
  );

  const renderCleaningStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="text-2xl mb-4">🧽 <span className="text-teal-600 font-semibold">Plan de nettoyage</span></div>
        <p className="text-sm text-gray-600">Nous vous proposons une liste de tâches avec leur fréquence. Nous vous invitons à choisir les tâches dans chaque zone et à modifier la fréquence proposée si besoin.</p>
      </div>

      <div className="flex space-x-1 mb-6 border-b">
        {zones.map((zone) => (
          <button
            key={zone}
            onClick={() => setActiveZone(zone)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeZone === zone
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {zone}
          </button>
        ))}
        <button className="px-4 py-2 text-sm font-medium text-gray-400">
          <Plus size={16} />
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={getFilteredTasks().every(task => task.enabled)}
            onChange={toggleAllTasks}
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
          />
          <span className="text-sm font-medium">Sélectionner toutes les tâches</span>
        </label>
      </div>

      <div className="space-y-2">
        {getFilteredTasks().map((task) => (
          <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={task.enabled}
                onChange={() => toggleTask(task.id)}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <span className="text-sm">{task.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{task.frequency}</span>
              <div className={`w-8 h-5 rounded-full flex items-center justify-center ${
                task.enabled ? 'bg-teal-500' : 'bg-gray-300'
              }`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  task.enabled ? 'transform translate-x-1' : 'transform -translate-x-1'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="w-full p-3 border-2 border-dashed border-teal-300 rounded-lg text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-colors flex items-center justify-center space-x-2 mt-6"
      >
        <Plus size={20} />
        <span>Ajouter une tâche</span>
      </button>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="text-4xl">💝</div>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">C&apos;est parfait !</h2>
        <p className="text-gray-600 mb-2">Vous avez terminé vos paramétrages</p>
        <p className="text-gray-600">En avant pour utiliser l&apos;application !</p>
      </div>

      <button
        onClick={() => {}}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Continuer
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6">
        {renderHeader()}
        {renderProgressBar()}
        
        <div className="mb-8">
          {currentStep === 'login' && renderLoginStep()}
          {currentStep === 'info' && renderInfoStep()}
          {currentStep === 'users' && renderUsersStep()}
          {currentStep === 'suppliers' && renderSuppliersStep()}
          {currentStep === 'enclosures' && renderEnclosuresStep()}
          {currentStep === 'cleaning' && renderCleaningStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>

        <div className="flex justify-between">
          {currentStep !== 'login' && (
            <button
              onClick={handlePrevious}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Précédent
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={loading}
            className={`px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${
              currentStep === 'complete' ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {loading ? 'Chargement...' : currentStep === 'complete' ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
}