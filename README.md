# Metaji Sistemas

Sistema web para consulta de receitas industriais: busca de produtos que possuem industrialização e visualização da receita (ingredientes) de cada item. Acesso restrito a usuários cadastrados (login).

## Tecnologias

- **Backend:** Node.js, Express, PostgreSQL (pg), JWT, bcrypt, API REST
- **Frontend:** React, Vite, React Router, Axios, TailwindCSS

## Estrutura do projeto

```
/backend
  server.js, db.js (banco receitas), dbMetaji.js (banco metajireceitas)
  routes/, controllers/, middleware/
  scripts/criar-tabela-usuarios.sql

/frontend/src
  context/AuthContext.jsx
  pages/Login.jsx, Registro.jsx, Receitas.jsx
  components/, services/
```

## Bancos de dados

O sistema usa **dois** bancos PostgreSQL:

1. **Banco principal** (variáveis `PG*` no `.env`) – onde estão `industc`, `industd`, `produtos` (consulta de receitas).
2. **metajireceitas** (variáveis `METAJI_*` no `.env`) – onde ficam os usuários que podem acessar o sistema.

### Banco metajireceitas (usuários)

É necessário **criar apenas o banco** `metajireceitas`. A tabela `public.usuarios` e a coluna `admin` são **criadas automaticamente** na primeira vez que o backend sobe.

```bash
# No psql ou pgAdmin: criar o banco
CREATE DATABASE metajireceitas;
```

Ao iniciar o servidor, o backend verifica/cria a tabela `usuarios` (id, nome, email, senha, ativo, admin, criado_em) e o índice em `email`. O campo `admin` (boolean) define se o usuário pode cadastrar outros usuários.

### Primeiro usuário administrador

**Opção A – Banco novo (já com coluna `admin`):** crie o admin pelo script Node (usa o `.env` do backend):

```bash
cd backend
node scripts/criar-admin.js
# Login: admin@receitas.local / admin123 (troque depois)
# Opcional: ADMIN_EMAIL=seu@email ADMIN_SENHA=suasenha node scripts/criar-admin.js
```

**Opção B:** Cadastre-se pela tela **Cadastre-se** e torne-se admin no banco:  
`UPDATE public.usuarios SET admin = true WHERE email = 'seu@email';`

## Pré-requisitos

- Node.js 18+
- PostgreSQL: um banco com `industc`, `industd`, `produtos`; outro banco `metajireceitas` (a tabela `usuarios` é criada automaticamente ao subir o backend).

## Como rodar

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edite .env: PGHOST, PGDATABASE, PGPASSWORD (banco receitas) e METAJI_*, JWT_SECRET (banco metajireceitas)

npm install
npm run dev
```

Servidor em `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App em `http://localhost:5173`.

### 3. Uso

1. Acesse `http://localhost:5173` – será redirecionado para **Login**.
2. Entre com um usuário (ex.: admin@receitas.local / admin123 se criou pelo script) ou use **Cadastre-se**.
3. Após login: use a busca e clique em um produto para ver a receita.
4. **Administradores** veem no header o link **Usuários**: lá é possível listar usuários e **cadastrar novos** (nome, e-mail, senha).

## Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login` | Não | Login (body: email, senha) |
| POST | `/api/auth/registro` | Não | Cadastro (body: nome, email, senha) |
| GET | `/api/auth/me` | Sim | Dados do usuário logado |
| GET | `/api/usuarios` | Admin | Lista usuários |
| POST | `/api/usuarios` | Admin | Cria usuário (nome, email, senha) |
| GET | `/api/buscar?q=texto` | Sim | Busca produtos |
| GET | `/api/produto/:codigo` | Sim | Dados do produto |
| GET | `/api/receita/:codigo` | Sim | Ingredientes da receita |
| GET | `/health` | Não | Status da API |

Rotas marcadas com "Sim" exigem header `Authorization: Bearer <token>` (JWT).

## Exemplo de .env (backend)

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=erp
PGUSER=erp
PGPASSWORD=***

METAJI_HOST=localhost
METAJI_PORT=5432
METAJI_DATABASE=metajireceitas
METAJI_USER=postgres
METAJI_PASSWORD=***

JWT_SECRET=uma-chave-secreta-forte-em-producao
JWT_EXPIRES=7d

PORT=3001
```

## Build para produção

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
# Servir a pasta frontend/dist com um servidor estático e configurar proxy /api para o backend
```
