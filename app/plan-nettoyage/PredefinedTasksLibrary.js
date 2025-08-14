// PredefinedTasksLibrary.js
export const predefinedTasks = {
  CUISINE: {
    "QUOTIDIEN": [
      { name: "Nettoyage des friteuses", defaultFrequency: "daily" },
      { name: "Essuyage des surfaces (Essa)", defaultFrequency: "daily" },
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
  PLONGE: {
    "QUOTIDIEN": [
      { name: "Sols, plinthes, grilles et siphons", defaultFrequency: "daily" },
      { name: "Désinfection des poignées et interrupteurs", defaultFrequency: "daily" },
      { name: "Vidange et nettoyage des poubelles et supports", defaultFrequency: "daily" },
      { name: "Nettoyage du bac de plonge", defaultFrequency: "daily" }
    ],
    "MENSUEL": [
      { name: "Nettoyage des murs et portes", defaultFrequency: "monthly" },
      { name: "Désinfection des étagères", defaultFrequency: "monthly" }
    ]
  },
  TOILETTES: {
    "QUOTIDIEN": [
      { name: "Nettoyage complet des toilettes (sanitaires, urinoirs, lave-mains)", defaultFrequency: "daily" },
      { name: "Désinfection des miroirs et surfaces vitrées", defaultFrequency: "daily" }
    ],
    "HEBDOMADAIRE": [
      { name: "Nettoyage des murs et portes", defaultFrequency: "weekly" }
    ]
  },
  VESTIAIRES: {
    "QUOTIDIEN": [
      { name: "Nettoyage général (sols, bancs, surfaces)", defaultFrequency: "daily" }
    ],
    "HEBDOMADAIRE": [
      { name: "Nettoyage des douches", defaultFrequency: "weekly" }
    ],
    "MENSUEL": [
      { name: "Désinfection des armoires", defaultFrequency: "monthly" }
    ]
  },
  "AUTRES ZONES": {
    "QUOTIDIEN": [
      { name: "Essuyage des surfaces (Essa)", defaultFrequency: "daily" },
      { name: "Nettoyage des lave-mains", defaultFrequency: "daily" },
      { name: "Balayage/lavage des sols", defaultFrequency: "daily" },
      { name: "Désinfection des toilettes/urinoirs (si présents)", defaultFrequency: "daily" },
      { name: "Nettoyage des miroirs et surfaces vitrées", defaultFrequency: "daily" },
      { name: "Vidange du bac de plonge (si applicable)", defaultFrequency: "daily" }
    ],
    "HEBDOMADAIRE": [
      { name: "Nettoyage des échelles (si présentes)", defaultFrequency: "weekly" },
      { name: "Détartrage des hottes/filtres (si applicable)", defaultFrequency: "weekly" },
      { name: "Nettoyage de la cellule de refroidissement (si présente)", defaultFrequency: "weekly" },
      { name: "Nettoyage des douches (si présentes)", defaultFrequency: "weekly" },
      { name: "Nettoyage des murs et portes", defaultFrequency: "weekly" }
    ],
    "MENSUEL": [
      { name: "Nettoyage approfondi des murs et portes", defaultFrequency: "monthly" },
      { name: "Désinfection des tiroirs/étagères (si présents)", defaultFrequency: "monthly" },
      { name: "Nettoyage de l'armoire froide (si présente)", defaultFrequency: "monthly" },
      { name: "Désinfection des étagères/armoires", defaultFrequency: "monthly" }
    ]
  }
};

export const frequencyOptions = [
  { value: "after_each_service", label: "Après chaque service" },
  { value: "daily", label: "Quotidien (avant 23h)" },
  { value: "every_2_days", label: "Tous les 2 jours (avant 23h)" },
  { value: "every_3_days", label: "Tous les 3 jours (avant 23h)" },
  { value: "every_4_days", label: "Tous les 4 jours (avant 23h)" },
  { value: "every_5_days", label: "Tous les 5 jours (avant 23h)" },
  { value: "every_10_days", label: "Tous les 10 jours (avant 23h)" },
  { value: "weekly", label: "Hebdomadaire (avant 23h)" },
  { value: "monthly", label: "Mensuel (avant 23h)" },
  { value: "custom", label: "Personnalisé" }
];