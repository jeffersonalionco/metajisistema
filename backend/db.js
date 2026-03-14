import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega .env da pasta backend; se não existir, tenta a raiz do projeto
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.PGHOST && !process.env.PGDATABASE) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

const { Pool } = pg;

// pg exige que password seja sempre string (nunca undefined)
const password = process.env.PGPASSWORD;
const passwordStr = typeof password === 'string' ? password : '';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'receitas',
  user: process.env.PGUSER || 'postgres',
  password: passwordStr,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err);
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executada', { text: text.substring(0, 50), duration, rows: res.rowCount });
    }
    return res;
  } catch (err) {
    console.error('Erro na query:', err.message);
    throw err;
  }
}

export { pool };
