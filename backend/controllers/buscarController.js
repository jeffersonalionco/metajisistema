import { query } from '../db.js';

const FILTROS_VALIDOS = new Set(['sem_obs', 'sem_receita', 'com_obs', 'com_receita']);

/**
 * GET /buscar?q=texto&filtro=sem_obs|sem_receita|com_obs|com_receita
 * Busca produtos industrializados por descrição.
 * filtro opcional: sem_obs (sem modo de preparo), sem_receita (sem itens na receita),
 * com_obs (com modo de preparo), com_receita (com itens na receita).
 */
export async function buscarProdutos(req, res) {
  try {
    const q = req.query.q?.trim() || '';
    if (!q) {
      return res.json([]);
    }
    const filtro = FILTROS_VALIDOS.has(req.query.filtro) ? req.query.filtro : null;
    const searchTerm = `%${q}%`;
    const qSomenteDigitos = /^[0-9]+$/.test(q) ? q : null;
    const codigoNumero = qSomenteDigitos ? Math.round(Number(qSomenteDigitos)) : null;

    let sql = `
      SELECT c.indc_prod_codigo, c.indc_descricao
      FROM public.industc c
      WHERE (
        c.indc_descricao ILIKE $1
        OR CAST(c.indc_prod_codigo AS TEXT) ILIKE $1
        ${codigoNumero ? `OR c.indc_prod_codigo = $2` : ''}
      )
    `;
    const params = codigoNumero ? [searchTerm, codigoNumero] : [searchTerm];

    if (filtro === 'sem_obs') {
      sql += ` AND (c.indc_obs IS NULL OR TRIM(c.indc_obs) = '')`;
    } else if (filtro === 'com_obs') {
      sql += ` AND c.indc_obs IS NOT NULL AND TRIM(c.indc_obs) <> ''`;
    } else if (filtro === 'sem_receita') {
      sql += ` AND NOT EXISTS (SELECT 1 FROM public.industd d WHERE d.indd_cod1 = c.indc_prod_codigo)`;
    } else if (filtro === 'com_receita') {
      sql += ` AND EXISTS (SELECT 1 FROM public.industd d WHERE d.indd_cod1 = c.indc_prod_codigo)`;
    }

    sql += ` ORDER BY c.indc_descricao LIMIT 50`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro em buscarProdutos:', err);
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
}
