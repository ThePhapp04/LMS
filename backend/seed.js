require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

async function seedDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    console.log('Connected to PostgreSQL. Running seed...\n');
    
    // Read SQL file and split by INSERT INTO blocks
    const sql = fs.readFileSync('seed.sql', 'utf8');
    
    // Split into individual statements (multi-line aware)
    const statements = [];
    let current = '';
    const lines = sql.split('\n');
    
    for (const line of lines) {
      // Skip comments and empty lines when not building a statement
      if (!current && (line.trim().startsWith('--') || !line.trim())) continue;
      
      current += line + '\n';
      
      // End of statement (semicolon at end of line, not inside string)
      if (line.trim().endsWith(';')) {
        statements.push(current.trim());
        current = '';
      }
    }
    
    console.log(`📝 Found ${statements.length} SQL statements\n`);
    
    let successCount = 0;
    for (const stmt of statements) {
      try {
        // Show what we're inserting
        const preview = stmt.split('\n')[0].substring(0, 60);
        console.log(`▶ ${preview}...`);
        
        await pool.query(stmt);
        successCount++;
      } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        // Don't stop on error, continue with next statement
      }
    }

    console.log(`\n✅ Inserted ${successCount}/${statements.length} statements successfully!`);
    console.log('\n📚 Demo accounts (password: 123456):');
    console.log('   Giáo viên: mai.nguyen@school.edu.vn');
    console.log('   Giáo viên: minh.tran@school.edu.vn');
    console.log('   Giáo viên: huong.le@school.edu.vn');
    console.log('   Học sinh: an@student.edu.vn');
    console.log('   Học sinh: binh@student.edu.vn');
    console.log('   Học sinh: chi@student.edu.vn');
    console.log('   Admin: admin@school.edu.vn');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

seedDatabase();
