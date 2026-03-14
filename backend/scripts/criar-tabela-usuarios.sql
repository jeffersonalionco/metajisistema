-- Execute no banco metajireceitas para criar a tabela de usuários
-- psql -h localhost -U postgres -d metajireceitas -f criar-tabela-usuarios.sql

CREATE TABLE IF NOT EXISTS public.usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  admin BOOLEAN DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios (email);

COMMENT ON TABLE public.usuarios IS 'Usuários que podem acessar o sistema de receitas industriais';
