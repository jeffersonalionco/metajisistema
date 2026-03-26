import { query } from '../dbMetaji.js';

export async function listarPosts(req, res) {
  try {
    const { categoria, busca, apenas_ativos } = req.query || {};

    const params = [];
    const cond = [];

    if (apenas_ativos !== 'false') {
      cond.push('p.ativo = true');
    }

    if (categoria) {
      params.push(String(categoria).slice(0, 80));
      cond.push(`p.categoria = $${params.length}`);
    }

    if (busca) {
      params.push(`%${String(busca).slice(0, 200)}%`);
      const idx = params.length;
      cond.push(
        `(p.titulo ILIKE $${idx} OR coalesce(p.descricao, '') ILIKE $${idx} OR coalesce(p.conteudo, '') ILIKE $${idx})`,
      );
    }

    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

    const result = await query(
      `
      SELECT
        p.id,
        p.categoria,
        p.titulo,
        p.descricao,
        p.conteudo,
        p.ativo,
        p.criado_em,
        p.atualizado_em,
        u.nome AS autor_nome
      FROM public.documentacao_posts p
      JOIN public.usuarios u ON u.id = p.usuario_id
      ${where}
      ORDER BY p.categoria ASC, p.criado_em DESC
      LIMIT 500
      `,
      params,
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erro em listarPosts:', err);
    res.status(500).json({ erro: 'Erro ao listar posts de documentação.' });
  }
}

export async function obterPost(req, res) {
  try {
    const { id } = req.params;
    const result = await query(
      `
      SELECT
        p.id,
        p.categoria,
        p.titulo,
        p.descricao,
        p.conteudo,
        p.ativo,
        p.criado_em,
        p.atualizado_em,
        u.nome AS autor_nome
      FROM public.documentacao_posts p
      JOIN public.usuarios u ON u.id = p.usuario_id
      WHERE p.id = $1
      `,
      [id],
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Post não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro em obterPost:', err);
    res.status(500).json({ erro: 'Erro ao carregar post de documentação.' });
  }
}

export async function criarPost(req, res) {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) return res.status(401).json({ erro: 'Usuário não autenticado' });

    const { categoria, titulo, descricao, conteudo, ativo } = req.body || {};
    if (!categoria || !titulo) {
      return res.status(400).json({ erro: 'Informe categoria e título.' });
    }

    const cat = String(categoria).trim().slice(0, 80);
    const tit = String(titulo).trim().slice(0, 160);
    const desc = descricao != null ? String(descricao).trim().slice(0, 400) : null;
    const cont = conteudo != null ? String(conteudo).trim() : null;
    const atv = ativo === false ? false : true;

    const result = await query(
      `
      INSERT INTO public.documentacao_posts (usuario_id, categoria, titulo, descricao, conteudo, ativo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, criado_em, atualizado_em
      `,
      [usuarioId, cat, tit, desc, cont, atv],
    );

    res.status(201).json({ id: result.rows[0].id, criado_em: result.rows[0].criado_em });
  } catch (err) {
    console.error('Erro em criarPost:', err);
    res.status(500).json({ erro: 'Erro ao criar post de documentação.' });
  }
}

export async function atualizarPost(req, res) {
  try {
    const { id } = req.params;
    const { categoria, titulo, descricao, conteudo, ativo } = req.body || {};

    const result = await query(
      `
      UPDATE public.documentacao_posts
      SET
        categoria = $2,
        titulo = $3,
        descricao = $4,
        conteudo = $5,
        ativo = $6,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, atualizado_em
      `,
      [
        id,
        String(categoria || '').trim().slice(0, 80),
        String(titulo || '').trim().slice(0, 160),
        descricao != null ? String(descricao).trim().slice(0, 400) : null,
        conteudo != null ? String(conteudo).trim() : null,
        ativo === false ? false : true,
      ],
    );

    if (result.rows.length === 0) return res.status(404).json({ erro: 'Post não encontrado.' });

    res.json({ id: result.rows[0].id, atualizado_em: result.rows[0].atualizado_em });
  } catch (err) {
    console.error('Erro em atualizarPost:', err);
    res.status(500).json({ erro: 'Erro ao atualizar post de documentação.' });
  }
}

export async function excluirPost(req, res) {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM public.documentacao_posts WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Post não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro em excluirPost:', err);
    res.status(500).json({ erro: 'Erro ao excluir post de documentação.' });
  }
}

