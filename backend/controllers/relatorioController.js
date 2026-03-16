import multer from 'multer';
import xlsx from 'xlsx';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../dbMetaji.js';

// Configuração do multer: mantém arquivo em memória (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv' ||
      file.originalname.toLowerCase().endsWith('.xlsx') ||
      file.originalname.toLowerCase().endsWith('.xls') ||
      file.originalname.toLowerCase().endsWith('.csv');
    if (!ok) {
      return cb(new Error('Tipo de arquivo não suportado. Envie um Excel (.xlsx/.xls) ou CSV.'));
    }
    cb(null, true);
  },
});

export const uploadRelatorioMiddleware = upload.single('arquivo');

function inferirTipoColuna(valoresAmostra) {
  const naoNulos = valoresAmostra.filter((v) => v !== null && v !== undefined && v !== '');
  if (naoNulos.length === 0) return 'desconhecido';

  const nums = naoNulos.filter((v) => typeof v === 'number' || (!Number.isNaN(Number(v)) && v !== ''));
  if (nums.length / naoNulos.length >= 0.7) return 'numero';

  const datas = naoNulos.filter((v) => {
    const d = new Date(v);
    return !Number.isNaN(d.getTime());
  });
  if (datas.length / naoNulos.length >= 0.7) return 'data';

  return 'texto';
}

function calcularMetricas(colunas, linhas) {
  const metricas = {};

  colunas.forEach((col) => {
    const valores = linhas.map((linha) => linha[col]);
    const tipo = inferirTipoColuna(valores.slice(0, 50));
    const resumo = { tipo };

    if (tipo === 'numero') {
      const nums = valores
        .map((v) => (typeof v === 'number' ? v : Number(v)))
        .filter((v) => !Number.isNaN(v));
      if (nums.length > 0) {
        const soma = nums.reduce((acc, n) => acc + n, 0);
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const media = soma / nums.length;
        resumo.soma = soma;
        resumo.min = min;
        resumo.max = max;
        resumo.media = media;
        resumo.qtd_numeros = nums.length;
      }
    } else if (tipo === 'texto') {
      const freq = {};
      valores.forEach((v) => {
        if (v == null || v === '') return;
        const chave = String(v).trim();
        freq[chave] = (freq[chave] || 0) + 1;
      });
      const top = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([valor, contagem]) => ({ valor, contagem }));
      resumo.top_valores = top;
      resumo.qtd_distintos = Object.keys(freq).length;
    }

    metricas[col] = resumo;
  });

  return metricas;
}

function normalizarNomeColuna(nome) {
  return String(nome || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calcularKpisVendas(colunas, linhas) {
  const mapa = {};
  colunas.forEach((c) => {
    mapa[normalizarNomeColuna(c)] = c;
  });

  const colQtdReg = mapa['quantidade reg.'] || mapa['quantidade reg'] || mapa['quantidade'];
  const colQtdUn = mapa['quantidade un.'] || mapa['quantidade un'] || mapa['quantidade unidade'];
  const colVendaBruta = mapa['venda bruta'];
  const colCancelamentos = mapa['cancelamentos'];
  const colAcrescimos = mapa['acrescimos'] || mapa['acréscimos'];
  const colDescontos = mapa['descontos'];
  const colVendaLiquida = mapa['venda liquida'] || mapa['venda líquida'];
  const colDepartamento = mapa['departamento'];
  const colMarca = mapa['marca'];
  const colDescricao = mapa['descricao'] || mapa['descrição'];

  if (!colVendaBruta || !colVendaLiquida) {
    return null;
  }

  let totalBruta = 0;
  let totalLiquida = 0;
  let totalDescontos = 0;
  let totalCancelamentos = 0;
  let totalQtdReg = 0;
  let totalQtdUn = 0;

  const porDepartamento = {};
  const porMarca = {};
  const porProduto = {};

  linhas.forEach((linha) => {
    const vendaBruta = Number(linha[colVendaBruta] ?? 0) || 0;
    const vendaLiquida = Number(linha[colVendaLiquida] ?? 0) || 0;
    const descontos = colDescontos ? Number(linha[colDescontos] ?? 0) || 0 : 0;
    const cancel = colCancelamentos ? Number(linha[colCancelamentos] ?? 0) || 0 : 0;
    const qtdReg = colQtdReg ? Number(linha[colQtdReg] ?? 0) || 0 : 0;
    const qtdUn = colQtdUn ? Number(linha[colQtdUn] ?? 0) || 0 : 0;

    totalBruta += vendaBruta;
    totalLiquida += vendaLiquida;
    totalDescontos += descontos;
    totalCancelamentos += cancel;
    totalQtdReg += qtdReg;
    totalQtdUn += qtdUn;

    const dep = colDepartamento ? String(linha[colDepartamento] || 'Sem departamento').trim() : 'Sem departamento';
    const marca = colMarca ? String(linha[colMarca] || 'Sem marca').trim() : 'Sem marca';
    const desc = colDescricao ? String(linha[colDescricao] || 'Sem descrição').trim() : 'Sem descrição';

    if (!porDepartamento[dep]) {
      porDepartamento[dep] = { departamento: dep, venda_liquida: 0 };
    }
    porDepartamento[dep].venda_liquida += vendaLiquida;

    if (!porMarca[marca]) {
      porMarca[marca] = { marca, venda_liquida: 0 };
    }
    porMarca[marca].venda_liquida += vendaLiquida;

    if (!porProduto[desc]) {
      porProduto[desc] = {
        descricao: desc,
        departamento: dep,
        marca,
        venda_liquida: 0,
        quantidade_reg: 0,
      };
    }
    porProduto[desc].venda_liquida += vendaLiquida;
    porProduto[desc].quantidade_reg += qtdReg;
  });

  const pctDescontos = totalBruta > 0 ? (totalDescontos / totalBruta) * 100 : 0;
  const pctCancel = totalBruta > 0 ? (totalCancelamentos / totalBruta) * 100 : 0;
  const ticketMedioItem = totalQtdReg > 0 ? totalLiquida / totalQtdReg : 0;
  const ticketMedioReg = totalQtdUn > 0 ? totalLiquida / totalQtdUn : 0;

  const vendasPorDepartamento = Object.values(porDepartamento).sort(
    (a, b) => b.venda_liquida - a.venda_liquida,
  );
  const vendasTopMarcas = Object.values(porMarca)
    .sort((a, b) => b.venda_liquida - a.venda_liquida)
    .slice(0, 10);
  // Ordenar por venda líquida (maior para menor) para top produtos
  const produtosOrdenadosDesc = Object.values(porProduto).sort(
    (a, b) => b.venda_liquida - a.venda_liquida,
  );
  const vendasTopProdutos = produtosOrdenadosDesc.slice(0, 15);

  // Para baixa saída, consideramos apenas itens com venda líquida > 0
  // e pegamos os 10 com MENOR venda líquida positiva.
  const produtosComVendaPositiva = Object.values(porProduto).filter(
    (p) => p.venda_liquida > 0,
  );
  const produtosBaixaSaida = produtosComVendaPositiva
    .sort((a, b) => a.venda_liquida - b.venda_liquida)
    .slice(0, 10);

  return {
    disponivel: true,
    colunas_mapeadas: {
      quantidade_reg: colQtdReg,
      quantidade_un: colQtdUn,
      venda_bruta: colVendaBruta,
      cancelamentos: colCancelamentos,
      acrescimos: colAcrescimos,
      descontos: colDescontos,
      venda_liquida: colVendaLiquida,
      departamento: colDepartamento,
      marca: colMarca,
      descricao: colDescricao,
    },
    totais: {
      venda_bruta: totalBruta,
      venda_liquida: totalLiquida,
      descontos: totalDescontos,
      cancelamentos: totalCancelamentos,
      quantidade_reg: totalQtdReg,
      quantidade_un: totalQtdUn,
      perc_descontos: pctDescontos,
      perc_cancelamentos: pctCancel,
      ticket_medio_item: ticketMedioItem,
      ticket_medio_registro: ticketMedioReg,
    },
    por_departamento: vendasPorDepartamento,
    top_marcas: vendasTopMarcas,
    top_produtos: vendasTopProdutos,
    produtos_baixa_saida: produtosBaixaSaida,
  };
}

async function gerarResumoIA({ nomeArquivo, colunas, totalLinhas, metricas, amostra, kpisVendas }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Modelo configurável via ambiente, com padrão para um modelo Gemini rápido.
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
Você é um analista de dados. Resuma de forma objetiva esta planilha.

Nome do arquivo: ${nomeArquivo}
Total de linhas úteis: ${totalLinhas}

Colunas detectadas:
${colunas.join(', ')}

Métricas básicas por coluna (JSON):
${JSON.stringify(metricas, null, 2)}

${kpisVendas ? `Indicadores de vendas calculados (JSON):\n${JSON.stringify(kpisVendas, null, 2)}\n` : ''}

Amostra de linhas (máx 5):
${JSON.stringify(amostra, null, 2)}

Você está ajudando o dono de um supermercado a entender o desempenho de vendas.

Responda em português, de forma objetiva, em até 5 parágrafos curtos, seguindo esta estrutura:

1) **Visão geral**: Resuma rapidamente o nível de faturamento, volume vendido e se os descontos/cancelamentos parecem altos, médios ou baixos.
2) **Top destaques positivos**: Aponte quais departamentos, marcas ou grupos de produtos mais puxam o resultado (cite exemplos concretos com números aproximados).
3) **Pontos fracos / alertas**: Destaque produtos, departamentos ou marcas com baixa saída, muita dependência de poucos itens ou descontos/cancelamentos acima do normal. Traga críticas construtivas.
4) **Sugestões práticas**: Traga de 2 a 4 recomendações claras para o dono agir (ex.: rever preço de itens específicos, reforçar exposição de determinada categoria, reduzir descontos em certos grupos, etc.).
5) **Observações finais**: Se notar alguma anomalia (valores muito extremos, colunas inconsistentes, etc.), comente.
`;

    const result = await model.generateContent(prompt);
    const resposta = await result.response;
    return resposta.text();
  } catch (err) {
    // Se o modelo não estiver disponível ou der erro, apenas seguimos sem IA.
    console.warn('IA desativada ao analisar relatório:', err.message);
    return null;
  }
}

export async function analisarRelatorio(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado. Use o campo "arquivo".' });
    }

    const { buffer, originalname } = req.file;

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const primeiraAbaNome = workbook.SheetNames[0];
    const sheet = workbook.Sheets[primeiraAbaNome];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (!Array.isArray(json) || json.length === 0) {
      return res.status(400).json({ erro: 'Planilha vazia ou sem dados reconhecíveis.' });
    }

    const colunas = Object.keys(json[0]);
    const linhas = json;
    const totalLinhas = linhas.length;

    const metricas = calcularMetricas(colunas, linhas);
    const amostra = linhas.slice(0, 5);
    const vendasKpis = calcularKpisVendas(colunas, linhas);

    const resumoIA = await gerarResumoIA({
      nomeArquivo: originalname,
      colunas,
      totalLinhas,
      metricas,
      amostra,
      kpisVendas: vendasKpis,
    });

    const payload = {
      arquivo: originalname,
      aba_analisada: primeiraAbaNome,
      total_linhas: totalLinhas,
      colunas,
      metricas,
      amostra,
      vendas_kpis: vendasKpis,
      resumo_ia: resumoIA,
      ia_ativa: Boolean(process.env.GEMINI_API_KEY),
    };
    // Nesta rota, apenas retornamos o resultado da análise.
    // O salvamento no banco é feito manualmente via endpoint dedicado.
    res.json(payload);
  } catch (err) {
    console.error('Erro em analisarRelatorio:', err);
    if (err.message?.includes('Tipo de arquivo não suportado')) {
      return res.status(400).json({ erro: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ erro: 'Arquivo muito grande. Tamanho máximo: 5 MB.' });
    }
    res.status(500).json({ erro: 'Erro ao analisar o relatório.' });
  }
}

export async function salvarResumoMensal(req, res) {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    const { resumo, periodo, nome_relatorio } = req.body || {};
    if (!resumo || !resumo.arquivo) {
      return res.status(400).json({ erro: 'Resumo inválido para salvar.' });
    }

    const nomeArquivo = String(resumo.arquivo).slice(0, 255);
    const periodoVal = periodo ? String(periodo).slice(0, 100) : null;
    const nomeRelatorio = nome_relatorio ? String(nome_relatorio).slice(0, 200) : null;

    const insert = await query(
      `INSERT INTO public.resumos_mensais (usuario_id, nome_arquivo, periodo, nome_relatorio, dados)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, criado_em`,
      [usuarioId, nomeArquivo, periodoVal, nomeRelatorio, JSON.stringify(resumo)],
    );

    const row = insert.rows[0];
    res.status(201).json({
      resumo_id: row.id,
      nome_arquivo: nomeArquivo,
      nome_relatorio: nomeRelatorio,
      periodo: periodoVal,
      criado_em: row.criado_em,
    });
  } catch (err) {
    console.error('Erro em salvarResumoMensal:', err);
    res.status(500).json({ erro: 'Erro ao salvar resumo mensal.' });
  }
}

export async function obterResumoMensal(req, res) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, usuario_id, nome_arquivo, periodo, nome_relatorio, dados, criado_em
       FROM public.resumos_mensais
       WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Resumo não encontrado' });
    }
    const row = result.rows[0];
    // Esta rota é pública: qualquer pessoa com o link pode visualizar o resumo.
    const dados = row.dados || {};
    res.json({
      resumo_id: row.id,
      usuario_id: row.usuario_id,
      nome_arquivo: row.nome_arquivo,
      nome_relatorio: row.nome_relatorio,
      periodo: row.periodo,
      criado_em: row.criado_em,
      ...dados,
    });
  } catch (err) {
    console.error('Erro em obterResumoMensal:', err);
    res.status(500).json({ erro: 'Erro ao carregar resumo mensal.' });
  }
}

