require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('📦 Script de migration pour les tables clients et factures');
console.log('');

// Vérifier les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Vérification de la configuration...');
console.log(`URL Supabase: ${supabaseUrl ? '✅ Définie' : '❌ Manquante'}`);
console.log(`Clé Supabase: ${supabaseKey ? '✅ Définie' : '❌ Manquante'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variables d\'environnement manquantes dans .env.local');
  console.log('');
  console.log('🔧 Solution : Copiez .env.example vers .env.local et ajustez les valeurs');
  process.exit(1);
}

// Lire le fichier de migration
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_clients_invoices_tables.sql');

if (!fs.existsSync(migrationPath)) {
  console.log('❌ Fichier de migration introuvable:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Instructions pour appliquer la migration :');
console.log('');
console.log('1. 🌐 Ouvrez votre dashboard Supabase :');
console.log(`   ${supabaseUrl.replace('supabase.co', 'supabase.com/dashboard')}`);
console.log('');
console.log('2. 🔧 Allez dans l\'onglet "SQL Editor"');
console.log('');
console.log('3. 📝 Créez une nouvelle query et collez ce SQL :');
console.log('');
console.log('----------------------------------------');
console.log(migrationSQL.substring(0, 500) + '...');
console.log('----------------------------------------');
console.log('');
console.log('4. ▶️  Exécutez le script');
console.log('');
console.log('💡 Ou copiez tout le contenu du fichier :');
console.log(`   ${migrationPath}`);
console.log('');
console.log('✅ Une fois appliqué, rechargez votre page web !');

console.log('');
console.log('📊 Résumé des tables à créer :');
console.log('   • clients - Informations des clients');
console.log('   • client_orders - Commandes clients');  
console.log('   • client_order_items - Articles des commandes');
console.log('   • invoices - Factures');
console.log('   • invoice_items - Lignes de factures');