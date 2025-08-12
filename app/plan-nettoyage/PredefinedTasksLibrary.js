// PredefinedTasksLibrary.js
export const predefinedTasks = {
  CUISINE: {
    "APRÈS CHAQUE UTILISATION": [
      { name: "Nettoyage des friteuses", defaultFrequency: "after_each_use" },
      { name: "Essuyage des surfaces (Essa)", defaultFrequency: "after_each_use" }
    ],
    "QUOTIDIEN": [
      { name: "Sols, plinthes, grilles et siphons", defaultFrequency: "daily" },
      { name: "Désinfection des poignées de portes et interrupteurs", defaultFrequency: "daily" },
      { name: "Nettoyage des ustensiles, planches et couteaux", defaultFrequency: "daily" },
      { name: "Désinfection des plans de travail", defaultFrequency: "daily" },
      { name: "Nettoyage du passe-plat", defaultFrequency: "daily" }
    ],
    "HEBDOMADAIRE": [
      { name: "Nettoyage des échelles", defaultFrequency: "weekly" },
      { name: "Détartrage des hottes et remplacement des filtres", defaultFrequency: "weekly" },
      { name: "Nettoyage de la cellule de refroidissement", defaultFrequency: "weekly" }
    ],
    "MENSUEL": [
      { name: "Nettoyage des murs et portes", defaultFrequency: "monthly" },
      { name: "Désinfection des tiroirs et étagères", defaultFrequency: "monthly" },
      { name: "Nettoyage de l'armoire froide", defaultFrequency: "monthly" }
    ]
  },
  ECONOMAT: {
    "APRÈS CHAQUE SERVICE": [
      { name: "Nettoyage des sols, plinthes, grilles et siphons", defaultFrequency: "after_each_service" }
    ],
    "HEBDOMADAIRE": [
      { name: "Nettoyage des étagères et clayettes", defaultFrequency: "weekly" },
      { name: "Désinfection des chambres froides", defaultFrequency: "weekly" }
    ],
    "MENSUEL": [
      { name: "Nettoyage des murs et portes", defaultFrequency: "monthly" }
    ]
  },
  // Add all other zones similarly...
};

export const frequencyOptions = [
  { value: "after_each_use", label: "Après chaque utilisation" },
  { value: "after_each_service", label: "Après chaque service" },
  { value: "daily", label: "Quotidien (avant 23h)" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" },
  { value: "custom", label: "Personnalisé" }
];