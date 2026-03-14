import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../dbMetaji.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-trocar-em-producao';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/**
 * POST /api/auth/login
 * Body: { email, senha }
 */
export async function login(req, res) {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
    }

    const result = await query(
      'SELECT id, nome, email, senha, ativo, admin, cpf, telefone, setor, cargo FROM public.usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    const usuario = result.rows[0];
    if (usuario.ativo === false) {
      return res.status(401).json({ erro: 'Usuário inativo' });
    }

    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    const token = gerarToken(usuario);
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        admin: !!usuario.admin,
        cpf: usuario.cpf || null,
        telefone: usuario.telefone || null,
        setor: usuario.setor || null,
        cargo: usuario.cargo || null,
      },
    });
  } catch (err) {
    console.error('Erro em login:', err);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
}

/**
 * POST /api/auth/registro
 * Body: { nome, email, senha }
 */
export async function registro(req, res) {
  try {
    const { nome, email, senha } = req.body || {};
    if (!nome?.trim() || !email?.trim() || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const emailNorm = email.trim().toLowerCase();
    const senhaHash = await bcrypt.hash(senha, 10);

    const cpfVal = req.body.cpf != null && String(req.body.cpf).trim() !== '' ? String(req.body.cpf).trim() : null;
    const telefoneVal = req.body.telefone != null && String(req.body.telefone).trim() !== '' ? String(req.body.telefone).trim() : null;
    const setorVal = req.body.setor != null && String(req.body.setor).trim() !== '' ? String(req.body.setor).trim() : null;
    const cargoVal = req.body.cargo != null && String(req.body.cargo).trim() !== '' ? String(req.body.cargo).trim() : null;

    await query(
      `INSERT INTO public.usuarios (nome, email, senha, cpf, telefone, setor, cargo) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nome.trim(), emailNorm, senhaHash, cpfVal, telefoneVal, setorVal, cargoVal]
    );

    const result = await query(
      'SELECT id, nome, email, admin, cpf, telefone, setor, cargo FROM public.usuarios WHERE email = $1',
      [emailNorm]
    );
    const usuario = result.rows[0];
    const token = gerarToken(usuario);
    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        admin: !!usuario.admin,
        cpf: usuario.cpf || null,
        telefone: usuario.telefone || null,
        setor: usuario.setor || null,
        cargo: usuario.cargo || null,
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado' });
    }
    console.error('Erro em registro:', err);
    res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
  }
}

/**
 * GET /api/auth/me
 * Retorna o usuário atual (requer token)
 */
export async function me(req, res) {
  try {
    const usuario = req.usuario;
    if (!usuario) {
      return res.status(401).json({ erro: 'Não autorizado' });
    }
    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        admin: !!usuario.admin,
        cpf: usuario.cpf || null,
        telefone: usuario.telefone || null,
        setor: usuario.setor || null,
        cargo: usuario.cargo || null,
      },
    });
  } catch (err) {
    console.error('Erro em me:', err);
    res.status(500).json({ erro: 'Erro ao obter usuário' });
  }
}
