import bcrypt from 'bcryptjs';
import { query } from '../dbMetaji.js';

/**
 * GET /api/usuarios
 * Lista usuários (apenas admin). Não retorna senha.
 */
export async function listar(req, res) {
  try {
    const result = await query(
      `SELECT id, nome, email, cpf, telefone, setor, cargo, ativo, admin,
              pode_documentacao, pode_usuarios, pode_relatorios_mensal, pode_relatorio_validade, pode_empresa,
              pode_receitas,
              criado_em
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
    const {
      nome,
      email,
      senha,
      cpf,
      telefone,
      setor,
      cargo,
      pode_documentacao,
      pode_usuarios,
      pode_relatorios_mensal,
      pode_relatorio_validade,
      pode_empresa,
      pode_receitas,
    } = req.body || {};
    const podeDoc = pode_documentacao === true;
    const podeUsuarios = pode_usuarios === true;
    const podeRelMensal = pode_relatorios_mensal === true;
    const podeRelValidade = pode_relatorio_validade === true;
    const podeEmpresa = pode_empresa === true;
    const podeReceitas = pode_receitas !== false;
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
      `INSERT INTO public.usuarios (
         nome, email, senha, cpf, telefone, setor, cargo,
         pode_documentacao, pode_usuarios, pode_relatorios_mensal, pode_relatorio_validade, pode_empresa, pode_receitas
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        nome.trim(),
        emailNorm,
        senhaHash,
        cpfVal,
        telefoneVal,
        setorVal,
        cargoVal,
        podeDoc,
        podeUsuarios,
        podeRelMensal,
        podeRelValidade,
        podeEmpresa,
        podeReceitas,
      ]
    );

    const result = await query(
      `SELECT id, nome, email, cpf, telefone, setor, cargo, ativo, admin,
              pode_documentacao, pode_usuarios, pode_relatorios_mensal, pode_relatorio_validade, pode_empresa,
              pode_receitas,
              criado_em
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

export async function atualizarPermissaoDocumentacao(req, res) {
  try {
    const { id } = req.params;
    const { pode_documentacao } = req.body || {};
    if (typeof pode_documentacao !== 'boolean') {
      return res.status(400).json({ erro: 'Campo pode_documentacao deve ser booleano.' });
    }

    const result = await query(
      `UPDATE public.usuarios
       SET pode_documentacao = $2
       WHERE id = $1
       RETURNING id, nome, email, cpf, telefone, setor, cargo, ativo, admin, pode_documentacao, criado_em`,
      [id, pode_documentacao],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro em atualizarPermissaoDocumentacao:', err);
    res.status(500).json({ erro: 'Erro ao atualizar permissão de documentação.' });
  }
}

export async function atualizarPermissoesUsuario(req, res) {
  try {
    const { id } = req.params;
    const {
      pode_documentacao,
      pode_usuarios,
      pode_relatorios_mensal,
      pode_relatorio_validade,
      pode_empresa,
      pode_receitas,
    } = req.body || {};

    const campos = [
      ['pode_documentacao', pode_documentacao],
      ['pode_usuarios', pode_usuarios],
      ['pode_relatorios_mensal', pode_relatorios_mensal],
      ['pode_relatorio_validade', pode_relatorio_validade],
      ['pode_empresa', pode_empresa],
      ['pode_receitas', pode_receitas],
    ].filter(([, valor]) => typeof valor === 'boolean');

    if (campos.length === 0) {
      return res.status(400).json({ erro: 'Nenhuma permissão válida informada.' });
    }

    const sets = campos.map(([campo], i) => `${campo} = $${i + 2}`).join(', ');
    const params = [id, ...campos.map(([, valor]) => valor)];

    const result = await query(
      `UPDATE public.usuarios
       SET ${sets}
       WHERE id = $1
       RETURNING id, nome, email, cpf, telefone, setor, cargo, ativo, admin,
                 pode_documentacao, pode_usuarios, pode_relatorios_mensal, pode_relatorio_validade, pode_empresa, pode_receitas, criado_em`,
      params,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro em atualizarPermissoesUsuario:', err);
    res.status(500).json({ erro: 'Erro ao atualizar permissões do usuário.' });
  }
}
