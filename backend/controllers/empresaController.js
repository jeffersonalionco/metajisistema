import { query } from '../dbMetaji.js';

const MAX_LOGO_BYTES = 400 * 1024; // ~400 KB

/**
 * GET /api/empresa
 * Retorna os dados da empresa (uma única linha). Qualquer usuário logado pode ver.
 */
export async function getEmpresa(req, res) {
  try {
    const result = await query(
      `SELECT id, nome_fantasia, razao_social, cnpj, logo_base64, endereco, telefone, email, atualizado_em
       FROM public.empresa WHERE id = 1`
    );
    if (result.rows.length === 0) {
      return res.json({ nome_fantasia: null, razao_social: null, cnpj: null, logo_base64: null, endereco: null, telefone: null, email: null });
    }
    const row = result.rows[0];
    res.json({
      id: row.id,
      nome_fantasia: row.nome_fantasia,
      razao_social: row.razao_social,
      cnpj: row.cnpj,
      logo_base64: row.logo_base64,
      endereco: row.endereco,
      telefone: row.telefone,
      email: row.email,
      atualizado_em: row.atualizado_em,
    });
  } catch (err) {
    console.error('Erro em getEmpresa:', err);
    res.status(500).json({ erro: 'Erro ao buscar dados da empresa' });
  }
}

/**
 * PUT /api/empresa
 * Atualiza dados da empresa (apenas admin). Body: nome_fantasia, razao_social, cnpj, endereco, telefone, email, logo_base64 (opcional).
 */
export async function updateEmpresa(req, res) {
  try {
    const body = req.body || {};
    const current = await query(`SELECT * FROM public.empresa WHERE id = 1`);
    const row = current.rows[0] || {};

    const nome_fantasia = body.nome_fantasia !== undefined ? (String(body.nome_fantasia).trim() || null) : row.nome_fantasia;
    const razao_social = body.razao_social !== undefined ? (String(body.razao_social).trim() || null) : row.razao_social;
    const cnpj = body.cnpj !== undefined ? (String(body.cnpj).trim().replace(/\D/g, '') || null) : row.cnpj;
    const endereco = body.endereco !== undefined ? (String(body.endereco).trim() || null) : row.endereco;
    const telefone = body.telefone !== undefined ? (String(body.telefone).trim() || null) : row.telefone;
    const email = body.email !== undefined ? (String(body.email).trim() || null) : row.email;

    let logo_base64 = row.logo_base64;
    if ('logo_base64' in body) {
      if (body.logo_base64 == null || body.logo_base64 === '') {
        logo_base64 = null;
      } else {
        const base64 = String(body.logo_base64);
        if (base64.startsWith('data:image')) {
          const match = base64.match(/^data:image\/\w+;base64,(.+)$/);
          if (match) {
            const buf = Buffer.from(match[1], 'base64');
            if (buf.length > MAX_LOGO_BYTES) {
              return res.status(400).json({ erro: `Imagem muito grande. Máximo ${Math.round(MAX_LOGO_BYTES / 1024)} KB.` });
            }
            logo_base64 = base64;
          }
        }
      }
    }

    await query(
      `UPDATE public.empresa SET
        nome_fantasia = $1, razao_social = $2, cnpj = $3, endereco = $4, telefone = $5, email = $6, logo_base64 = $7,
        atualizado_em = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [nome_fantasia, razao_social, cnpj, endereco, telefone, email, logo_base64]
    );

    const result = await query(
      `SELECT id, nome_fantasia, razao_social, cnpj, logo_base64, endereco, telefone, email, atualizado_em FROM public.empresa WHERE id = 1`
    );
    const out = result.rows[0];
    res.json({
      id: out.id,
      nome_fantasia: out.nome_fantasia,
      razao_social: out.razao_social,
      cnpj: out.cnpj,
      logo_base64: out.logo_base64,
      endereco: out.endereco,
      telefone: out.telefone,
      email: out.email,
      atualizado_em: out.atualizado_em,
    });
  } catch (err) {
    console.error('Erro ao atualizar empresa:', err);
    res.status(500).json({ erro: 'Erro ao salvar dados da empresa' });
  }
}
