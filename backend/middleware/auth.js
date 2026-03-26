import jwt from 'jsonwebtoken';
import { query } from '../dbMetaji.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-trocar-em-producao';

/**
 * Middleware: exige token JWT válido e anexa req.usuario (dados do usuário).
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token não informado. Faça login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query(
      `SELECT id, nome, email, ativo, admin,
              pode_documentacao, pode_usuarios, pode_relatorios_mensal, pode_relatorio_validade, pode_empresa, pode_receitas,
              cpf, telefone, setor, cargo
       FROM public.usuarios
       WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0 || result.rows[0].ativo === false) {
      return res.status(401).json({ erro: 'Usuário inválido ou inativo' });
    }

    req.usuario = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
    }
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

/**
 * Middleware: exige que o usuário seja admin (use após requireAuth).
 */
export function requireAdmin(req, res, next) {
  if (!req.usuario || req.usuario.admin !== true) {
    return res.status(403).json({ erro: 'Acesso restrito a administradores' });
  }
  next();
}

export function requireDocumentacaoEditor(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ erro: 'Usuário não autenticado' });
  }
  if (req.usuario.admin === true || req.usuario.pode_documentacao === true) {
    return next();
  }
  return res.status(403).json({ erro: 'Sem permissão para editar/publicar documentação' });
}

export function requirePermissao(campo, mensagemErro) {
  return function middlewarePermissao(req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    if (req.usuario.admin === true || req.usuario[campo] === true) {
      return next();
    }
    return res.status(403).json({ erro: mensagemErro || 'Sem permissão para acessar este recurso' });
  };
}
