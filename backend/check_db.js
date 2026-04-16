require('dotenv').config();
const { Pool } = require('pg');

async function checkData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    console.log('Checking database...\n');
    
    const tables = ['users', 'courses', 'chapters', 'lessons', 'assignments', 'enrollments'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${result.rows[0].count} rows`);
    }
    
    // Show users
    const users = await pool.query('SELECT id, name, email, role FROM users LIMIT 10');
    console.log('\n👥 Users:');
    users.rows.forEach(u => console.log(`  ${u.id}. ${u.name} (${u.email}) - ${u.role}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkData();
