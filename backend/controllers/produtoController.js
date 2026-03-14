import { query } from '../db.js';
import { query as queryMetaji } from '../dbMetaji.js';

/**
 * GET /produto/:codigo
 * Retorna informações do produto industrializado e última alteração do modo de preparo (metajireceitas).
 */
export async function getProduto(req, res) {
  try {
    const codigo = req.params.codigo;
    const result = await query(
      `SELECT
        c.indc_prod_codigo,
        c.indc_descricao,
        c.indc_unid_codigo,
        c.indc_rendimento,
        c.indc_pesototal,
        c.indc_precototal,
        c.indc_obs,
        p.prod_codbarras
       FROM public.industc c
       LEFT JOIN public.produtos p ON p.prod_codigo = c.indc_prod_codigo
       WHERE c.indc_prod_codigo = $1`,
      [codigo]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const produto = result.rows[0];
    let ultima_alteracao_obs = null;
    try {
      const alt = await queryMetaji(
        `SELECT u.nome, a.alterado_em
         FROM public.modo_preparo_alteracoes a
         JOIN public.usuarios u ON u.id = a.usuario_id
         WHERE a.indc_prod_codigo = $1`,
        [codigo]
      );
      if (alt.rows[0]) {
        ultima_alteracao_obs = { nome: alt.rows[0].nome, alterado_em: alt.rows[0].alterado_em };
      }
    } catch {
      // metajireceitas indisponível ou tabela ainda não existe
    }

    res.json({ ...produto, ultima_alteracao_obs });
  } catch (err) {
    console.error('Erro em getProduto:', err);
    res.status(500).json({ erro: 'Erro ao buscar produto' });
  }
}
