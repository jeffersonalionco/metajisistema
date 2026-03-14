import { query } from '../db.js';

/**
 * GET /receita/:codigo
 * Retorna a receita (ingredientes) do produto industrializado
 */
export async function getReceita(req, res) {
  try {
    const codigo = req.params.codigo;
    const result = await query(
      `SELECT d.*,
              p.prod_descricao,
              p.prod_complemento,
              p.prod_codbarras,
              p.prod_marca,
              p.prod_descrpdvs
       FROM public.industd d
       LEFT JOIN public.produtos p ON p.prod_codigo = d.indd_cod2
       WHERE d.indd_cod1 = $1
       ORDER BY d.indd_cod2`,
      [codigo]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro em getReceita:', err);
    res.status(500).json({ erro: 'Erro ao buscar receita' });
  }
}
