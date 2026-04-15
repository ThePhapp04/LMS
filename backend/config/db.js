const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

// Convert MySQL-style ? placeholders to PostgreSQL $1, $2, ...
function toPostgres(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Wrap pool.query to return [rows] matching mysql2/promise API shape
const db = {
  query: async (sql, params = []) => {
    const pgSql = toPostgres(sql);
    const result = await pool.query(pgSql, params);
    return [result.rows];
  },
};

module.exports = db;
