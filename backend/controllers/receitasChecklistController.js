import { query } from '../dbMetaji.js';

function parseCodigosQuery(codigosRaw) {
  const raw = String(codigosRaw || '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const n = Number(p);
      if (!Number.isFinite(n)) return null;
      return Math.round(n);
    })
    .filter((n) => n != null && n > 0);
}

export async function obterChecklistReceitas(req, res) {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) return res.status(401).json({ erro: 'Usuário não autenticado' });

    const codigos = parseCodigosQuery(req.query?.codigos);
    if (codigos.length === 0) return res.json({});

    const result = await query(
      `
      SELECT prod_codigo, atualizado
      FROM public.receitas_produto_checklist
      WHERE usuario_id = $1
        AND prod_codigo = ANY($2::numeric[])
      `,
      [usuarioId, codigos],
    );

    const map = {};
    (result.rows || []).forEach((r) => {
      const key = String(Math.round(Number(r.prod_codigo)));
      map[key] = r.atualizado === true;
    });

    res.json(map);
  } catch (err) {
    console.error('Erro em obterChecklistReceitas:', err);
    res.status(500).json({ erro: 'Erro ao carregar checklist de receitas.' });
  }
}

export async function atualizarChecklistReceitas(req, res) {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) return res.status(401).json({ erro: 'Usuário não autenticado' });

    const codigoRaw = req.params?.codigo;
    const codigo = Math.round(Number(codigoRaw));
    if (!Number.isFinite(codigo) || codigo <= 0) {
      return res.status(400).json({ erro: 'Código de produto inválido.' });
    }

    const atualizado = req.body?.atualizado === true;

    const result = await query(
      `
      INSERT INTO public.receitas_produto_checklist (usuario_id, prod_codigo, atualizado, atualizado_em)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (usuario_id, prod_codigo)
      DO UPDATE SET atualizado = EXCLUDED.atualizado,
                    atualizado_em = CURRENT_TIMESTAMP
      RETURNING prod_codigo, atualizado, atualizado_em
      `,
      [usuarioId, codigo, atualizado],
    );

    const row = result.rows?.[0];
    res.json({
      prod_codigo: row?.prod_codigo,
      atualizado: row?.atualizado === true,
      atualizado_em: row?.atualizado_em,
    });
  } catch (err) {
    console.error('Erro em atualizarChecklistReceitas:', err);
    res.status(500).json({ erro: 'Erro ao salvar checklist de receitas.' });
  }
}

