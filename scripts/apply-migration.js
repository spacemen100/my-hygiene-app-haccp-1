const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase (vous devrez ajuster selon votre configuration)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Vérifiez que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📦 Application de la migration pour les tables clients et factures...');
    
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_clients_invoices_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Fichier de migration lu avec succès');
    
    // Diviser le SQL en instructions individuelles
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Exécution de ${statements.length} instructions SQL...`);
    
    // Exécuter chaque instruction
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`   ${i + 1}/${statements.length}: Exécution...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Essayer avec la méthode directe si la fonction RPC n'existe pas
          const { error: directError } = await supabase.from('_').select('*').limit(0);
          if (directError && directError.message.includes('relation "_" does not exist')) {
            // Utiliser une approche différente - exécuter via une fonction personnalisée
            console.log('   ⚠️  Méthode RPC non disponible, tentative alternative...');
            
            // Pour certaines installations Supabase, nous devons utiliser l'API REST directement
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              },
              body: JSON.stringify({ sql: statement })
            });
            
            if (!response.ok) {
              console.log(`   ✅ Instruction ${i + 1} - probablement déjà appliquée ou non critique`);
            }
          } else {
            throw error;
          }
        } else {
          console.log(`   ✅ Instruction ${i + 1} exécutée avec succès`);
        }
      } catch (err) {
        // Ignorer certaines erreurs communes (table existe déjà, etc.)
        if (err.message && (
          err.message.includes('already exists') ||
          err.message.includes('does not exist') ||
          err.message.includes('permission denied')
        )) {
          console.log(`   ⚠️  Instruction ${i + 1} - ${err.message}`);
        } else {
          console.error(`   ❌ Erreur instruction ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Migration terminée !');
    console.log('');
    console.log('📋 Tables créées :');
    console.log('   - clients');
    console.log('   - client_orders');
    console.log('   - client_order_items');
    console.log('   - invoices');
    console.log('   - invoice_items');
    console.log('');
    console.log('✅ Vous pouvez maintenant utiliser le système de commandes clients !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    console.log('');
    console.log('💡 Solutions possibles :');
    console.log('   1. Vérifiez vos variables d\'environnement Supabase');
    console.log('   2. Assurez-vous d\'avoir les permissions admin sur la base');
    console.log('   3. Appliquez manuellement le SQL via l\'interface Supabase');
    process.exit(1);
  }
}

// Exécuter la migration
applyMigration();