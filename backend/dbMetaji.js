import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.METAJI_HOST && !process.env.METAJI_DATABASE) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

const { Pool } = pg;

const password = process.env.METAJI_PASSWORD;
const passwordStr = typeof password === 'string' ? password : '';

const pool = new Pool({
  host: process.env.METAJI_HOST || 'localhost',
  port: parseInt(process.env.METAJI_PORT || '5432', 10),
  database: process.env.METAJI_DATABASE || 'metajireceitas',
  user: process.env.METAJI_USER || 'postgres',
  password: passwordStr,
});

pool.on('error', (err) => {
  console.error('Erro no pool metajireceitas:', err);
});

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('Erro na query metajireceitas:', err.message);
    throw err;
  }
}

/**
 * Cria a tabela usuarios e a coluna admin no banco metajireceitas, se não existirem.
 * Chamado automaticamente na subida do servidor.
 */
export async function initMetajiSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        admin BOOLEAN DEFAULT false,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios (email)
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS admin BOOLEAN DEFAULT false
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS cpf VARCHAR(14)
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS telefone VARCHAR(20)
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS setor VARCHAR(100)
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS cargo VARCHAR(100)
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS pode_documentacao BOOLEAN DEFAULT false
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS pode_usuarios BOOLEAN DEFAULT false
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS pode_relatorios_mensal BOOLEAN DEFAULT false
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS pode_relatorio_validade BOOLEAN DEFAULT false
    `);
    await client.query(`
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS pode_empresa BOOLEAN DEFAULT false
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.modo_preparo_alteracoes (
        indc_prod_codigo NUMERIC(8,0) PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id),
        alterado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.resumos_mensais (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id),
        nome_arquivo VARCHAR(255) NOT NULL,
        periodo VARCHAR(100),
        dados JSONB NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      ALTER TABLE public.resumos_mensais
      ADD COLUMN IF NOT EXISTS nome_relatorio VARCHAR(200)
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.empresa (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        nome_fantasia VARCHAR(150),
        razao_social VARCHAR(200),
        cnpj VARCHAR(18),
        logo_base64 TEXT,
        endereco VARCHAR(300),
        telefone VARCHAR(20),
        email VARCHAR(100),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      INSERT INTO public.empresa (id) VALUES (1) ON CONFLICT (id) DO NOTHING
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.documentacao_posts (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id),
        categoria VARCHAR(80) NOT NULL,
        titulo VARCHAR(160) NOT NULL,
        descricao VARCHAR(400),
        conteudo TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documentacao_posts_categoria ON public.documentacao_posts (categoria)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documentacao_posts_criado_em ON public.documentacao_posts (criado_em DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documentacao_posts_ativo ON public.documentacao_posts (ativo)
    `);
  } finally {
    client.release();
  }
}

export { pool };
