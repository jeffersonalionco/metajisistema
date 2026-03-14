import bcrypt from 'bcryptjs';
import { query } from '../dbMetaji.js';

/**
 * GET /api/usuarios
 * Lista usuários (apenas admin). Não retorna senha.
 */
export async function listar(req, res) {
  try {
    const result = await query(
      `SELECT id, nome, email, cpf, telefone, setor, cargo, ativo, admin, criado_em
       FROM public.usuarios
       ORDER BY nome`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro em listar usuários:', err);
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
}

/**
 * POST /api/usuarios
 * Cria novo usuário (apenas admin). Body: { nome, email, senha, cpf?, telefone?, setor?, cargo? }
 */
export async function criar(req, res) {
  try {
    const { nome, email, senha, cpf, telefone, setor, cargo } = req.body || {};
    if (!nome?.trim() || !email?.trim() || !senha) {
      return res.status(400).json({ erro: 'Nome completo, e-mail e senha são obrigatórios' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const emailNorm = email.trim().toLowerCase();
    const senhaHash = await bcrypt.hash(senha, 10);
    const cpfVal = cpf != null && String(cpf).trim() !== '' ? String(cpf).trim() : null;
    const telefoneVal = telefone != null && String(telefone).trim() !== '' ? String(telefone).trim() : null;
    const setorVal = setor != null && String(setor).trim() !== '' ? String(setor).trim() : null;
    const cargoVal = cargo != null && String(cargo).trim() !== '' ? String(cargo).trim() : null;

    await query(
      `INSERT INTO public.usuarios (nome, email, senha, cpf, telefone, setor, cargo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nome.trim(), emailNorm, senhaHash, cpfVal, telefoneVal, setorVal, cargoVal]
    );

    const result = await query(
      `SELECT id, nome, email, cpf, telefone, setor, cargo, ativo, admin, criado_em
       FROM public.usuarios WHERE email = $1`,
      [emailNorm]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado' });
    }
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
  }
}
