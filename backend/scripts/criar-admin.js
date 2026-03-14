/**
 * Cria o primeiro usuário administrador no banco metajireceitas.
 * Uso: cd backend && node scripts/criar-admin.js
 * Opcional: ADMIN_EMAIL=... ADMIN_SENHA=... ADMIN_NOME=... node scripts/criar-admin.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
import bcrypt from 'bcryptjs';
import pg from 'pg';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@receitas.local';
const adminSenha = process.env.ADMIN_SENHA || 'admin123';
const adminNome = process.env.ADMIN_NOME || 'Administrador';

const pool = new pg.Pool({
  host: process.env.METAJI_HOST || 'localhost',
  port: parseInt(process.env.METAJI_PORT || '5432', 10),
  database: process.env.METAJI_DATABASE || 'metajireceitas',
  user: process.env.METAJI_USER || 'postgres',
  password: process.env.METAJI_PASSWORD || '',
});

async function main() {
  const senhaHash = await bcrypt.hash(adminSenha, 10);
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO public.usuarios (nome, email, senha, admin)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email) DO UPDATE SET nome = $1, senha = $3, admin = true`,
      [adminNome, adminEmail.toLowerCase(), senhaHash]
    );
    console.log('Admin criado/atualizado:', adminEmail);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
