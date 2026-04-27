const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_T6AdXDaGbi7J@ep-icy-fire-aldzcte7.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=verify-full';

async function dropViews() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Drop views starting from the ones that depend on others
    await client.query('DROP VIEW IF EXISTS classifica_qualificazione_disciplina CASCADE;');
    await client.query('DROP VIEW IF EXISTS classifica_complessiva CASCADE;');
    await client.query('DROP VIEW IF EXISTS v_participations CASCADE;');
    
    console.log('Successfully dropped views.');
  } catch (err) {
    console.error('Error dropping views:', err);
  } finally {
    await client.end();
  }
}

dropViews();
