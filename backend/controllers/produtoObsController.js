import { query } from '../db.js';
import { query as queryMetaji } from '../dbMetaji.js';

const MAX_OBS = 3900;

/**
 * PATCH /api/produto/:codigo/obs
 * Atualiza apenas o campo indc_obs (modo de preparo) no industc.
 * Registra quem alterou e quando na tabela modo_preparo_alteracoes (metajireceitas).
 * Limite: 3900 caracteres. Requer autenticação.
 */
export async function atualizarObs(req, res) {
  try {
    const codigo = req.params.codigo;
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
      return res.status(401).json({ erro: 'Usuário não identificado' });
    }

    const texto = (req.body?.indc_obs != null ? String(req.body.indc_obs) : '').trim();
    const valorFinal = texto.length > MAX_OBS ? texto.slice(0, MAX_OBS) : texto;

    const result = await query(
      `UPDATE public.industc SET indc_obs = $1 WHERE indc_prod_codigo = $2 RETURNING indc_prod_codigo, indc_obs`,
      [valorFinal, codigo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    await queryMetaji(
      `INSERT INTO public.modo_preparo_alteracoes (indc_prod_codigo, usuario_id, alterado_em)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (indc_prod_codigo) DO UPDATE SET usuario_id = $2, alterado_em = CURRENT_TIMESTAMP`,
      [codigo, usuarioId]
    );

    const alt = await queryMetaji(
      `SELECT u.nome, a.alterado_em
       FROM public.modo_preparo_alteracoes a
       JOIN public.usuarios u ON u.id = a.usuario_id
       WHERE a.indc_prod_codigo = $1`,
      [codigo]
    );

    const ultima = alt.rows[0] || null;
    res.json({
      indc_obs: result.rows[0].indc_obs,
      ultima_alteracao_obs: ultima ? { nome: ultima.nome, alterado_em: ultima.alterado_em } : null,
    });
  } catch (err) {
    console.error('Erro ao atualizar modo de preparo:', err);
    res.status(500).json({ erro: 'Erro ao gravar modo de preparo' });
  }
}
