-- Execute no banco metajireceitas para adicionar perfil de administrador
-- psql -h localhost -U postgres -d metajireceitas -f adicionar-coluna-admin.sql

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS admin BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.usuarios.admin IS 'Se true, usuário pode cadastrar e gerenciar outros usuários';

-- Opcional: definir o primeiro usuário como admin (troque o e-mail pelo do seu admin)
-- UPDATE public.usuarios SET admin = true WHERE email = 'admin@seusite.com';
