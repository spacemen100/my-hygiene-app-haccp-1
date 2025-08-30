// Script simple pour créer les tables via l'API Supabase
const { createClient } = require('@supabase/supabase-js');

// Vous devez définir ces variables dans votre fichier .env.local
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🚀 Vérification des tables existantes...');
  
  // Vérifier si les tables existent déjà
  try {
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);
    
    if (!clientsError) {
      console.log('✅ Les tables existent déjà !');
      return;
    }
  } catch (e) {
    // Les tables n'existent pas, c'est normal
  }
  
  console.log('⚠️  Les tables n\'existent pas encore.');
  console.log('');
  console.log('📝 Pour créer les tables, vous devez :');
  console.log('');
  console.log('1. Aller sur https://supabase.com/dashboard/');
  console.log('2. Sélectionner votre projet');
  console.log('3. Aller dans l\'onglet "SQL Editor"');
  console.log('4. Copier-coller le contenu du fichier :');
  console.log('   supabase/migrations/create_clients_invoices_tables.sql');
  console.log('5. Exécuter le script SQL');
  console.log('');
  console.log('📄 Ou ouvrir le fichier et copier son contenu :');
  console.log('   C:\\Users\\moi\\Desktop\\my-hygiene-app-haccp\\supabase\\migrations\\create_clients_invoices_tables.sql');
  
  process.exit(0);
}

createTables();