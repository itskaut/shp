const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PGHOST || 'db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'shopdb',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432
});
module.exports = pool;
