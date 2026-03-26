import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../dbMetaji.js';

const DEFAULT_PROMPT_BASE =
  'Você é a Metaji AI. Responda dúvidas de usuários com base APENAS na documentação interna fornecida no contexto.';

function normalizarTexto(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizar(texto) {
  const stop = new Set([
    'de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'para', 'com', 'um', 'uma', 'no', 'na',
    'os', 'as', 'que', 'se', 'por', 'ao', 'como', 'ou', 'mais', 'menos', 'sobre', 'sistema',
  ]);
  return normalizarTexto(texto)
    .split(' ')
    .filter((t) => t.length >= 3 && !stop.has(t));
}

function pontuarPost(tokensPergunta, post) {
  const texto = `${post.categoria || ''} ${post.titulo || ''} ${post.descricao || ''} ${post.conteudo || ''}`;
  const textoNormalizado = normalizarTexto(texto);
  let score = 0;
  for (const tk of tokensPergunta) {
    if (!tk) continue;
    if ((post.categoria || '').toLowerCase().includes(tk)) score += 3;
    if ((post.titulo || '').toLowerCase().includes(tk)) score += 3;
    if ((post.descricao || '').toLowerCase().includes(tk)) score += 2;
    if (textoNormalizado.includes(tk)) score += 1;
  }
  return score;
}

function resumirConteudo(conteudo) {
  const texto = String(conteudo || '').replace(/\s+/g, ' ').trim();
  return texto.length > 1200 ? `${texto.slice(0, 1200)}...` : texto;
}

async function obterConfigIA() {
  const result = await query(
    `SELECT ativo, model, prompt_base, max_posts_contexto, atualizado_em
     FROM public.documentacao_ia_config
     WHERE id = 1`,
  );
  const row = result.rows[0] || {};
  return {
    ativo: row.ativo !== false,
    model: row.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    prompt_base: row.prompt_base || DEFAULT_PROMPT_BASE,
    max_posts_contexto: Number(row.max_posts_contexto) > 0 ? Number(row.max_posts_contexto) : 8,
    atualizado_em: row.atualizado_em || null,
  };
}

export async function obterConfigDocumentacaoIA(req, res) {
  try {
    const config = await obterConfigIA();
    res.json(config);
  } catch (err) {
    console.error('Erro em obterConfigDocumentacaoIA:', err);
    res.status(500).json({ erro: 'Erro ao carregar configuração da IA de documentação.' });
  }
}

export async function salvarConfigDocumentacaoIA(req, res) {
  try {
    const { ativo, model, prompt_base, max_posts_contexto } = req.body || {};
    const ativoVal = ativo !== false;
    const modelVal = model ? String(model).trim().slice(0, 80) : null;
    const promptVal = prompt_base ? String(prompt_base).trim().slice(0, 12000) : DEFAULT_PROMPT_BASE;
    const maxPostsVal = Math.min(20, Math.max(3, Number(max_posts_contexto) || 8));

    await query(
      `UPDATE public.documentacao_ia_config
       SET ativo = $1,
           model = $2,
           prompt_base = $3,
           max_posts_contexto = $4,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [ativoVal, modelVal, promptVal, maxPostsVal],
    );

    const config = await obterConfigIA();
    res.json(config);
  } catch (err) {
    console.error('Erro em salvarConfigDocumentacaoIA:', err);
    res.status(500).json({ erro: 'Erro ao salvar configuração da IA de documentação.' });
  }
}

export async function conversarComDocumentacaoIA(req, res) {
  try {
    const { pergunta, categoria, assunto } = req.body || {};
    if (!pergunta || String(pergunta).trim().length < 3) {
      return res.status(400).json({ erro: 'Informe uma pergunta válida.' });
    }

    const config = await obterConfigIA();
    if (!config.ativo) {
      return res.status(400).json({ erro: 'Metaji AI da Documentação está desativada pelo administrador.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ erro: 'GEMINI_API_KEY não configurada no backend.' });
    }

    const resultPosts = await query(
      `SELECT id, categoria, titulo, descricao, conteudo, atualizado_em
       FROM public.documentacao_posts
       WHERE ativo = true
       ORDER BY atualizado_em DESC
       LIMIT 1000`,
    );
    const posts = resultPosts.rows || [];
    const consultaCompleta = `${String(pergunta || '')} ${String(assunto || '')} ${String(categoria || '')}`;
    const tokens = tokenizar(consultaCompleta);

    let selecionados = posts
      .map((post) => ({ ...post, _score: pontuarPost(tokens, post) }))
      .sort((a, b) => b._score - a._score);

    if (categoria) {
      const categoriaNorm = normalizarTexto(categoria);
      selecionados = selecionados.filter((p) => normalizarTexto(p.categoria).includes(categoriaNorm));
    }
    if (assunto) {
      const assuntoNorm = normalizarTexto(assunto);
      selecionados = selecionados.filter((p) =>
        normalizarTexto(`${p.titulo} ${p.descricao || ''} ${p.conteudo || ''}`).includes(assuntoNorm),
      );
    }

    const contexto = selecionados
      .filter((p) => p._score > 0 || categoria || assunto)
      .slice(0, config.max_posts_contexto)
      .map((p) => ({
        id: p.id,
        categoria: p.categoria,
        titulo: p.titulo,
        descricao: p.descricao,
        conteudo: resumirConteudo(p.conteudo),
        atualizado_em: p.atualizado_em,
      }));

    if (contexto.length === 0) {
      return res.json({
        resposta:
          'Nao encontrei posts com alta relevancia para essa duvida. Tente informar categoria, assunto ou palavras mais especificas.',
        fontes: [],
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: config.model });

    const prompt = `
${config.prompt_base}

Regras obrigatorias:
- Use apenas o contexto dos posts abaixo.
- Se faltar informacao, diga claramente que nao ha dado suficiente nos posts.
- Sempre responda em portugues.
- Responda de forma didatica e objetiva.
- Traga um passo a passo pratico quando possivel.

Pergunta do usuario:
${String(pergunta).trim()}

Filtros informados:
- categoria: ${categoria ? String(categoria) : '(nao informado)'}
- assunto: ${assunto ? String(assunto) : '(nao informado)'}

Contexto de posts (JSON):
${JSON.stringify(contexto, null, 2)}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resposta = response.text();

    return res.json({
      resposta,
      fontes: contexto.map((p) => ({ id: p.id, titulo: p.titulo, categoria: p.categoria })),
    });
  } catch (err) {
    console.error('Erro em conversarComDocumentacaoIA:', err);
    res.status(500).json({ erro: 'Erro ao consultar Metaji AI da documentação.' });
  }
}
