import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AppLayout } from '../components/AppLayout';
import { analisarRelatorioExcel, salvarResumoMensal } from '../services/api';
import { Link, useParams } from 'react-router-dom';

function markdownToHtml(texto) {
  if (!texto) return '';
  // Escapar HTML básico
  let t = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Negrito e itálico em Markdown simples
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');

  const linhas = t.split('\n').map((l) => l.trim());
  const partes = [];
  let listaAtual = [];

  function flushLista() {
    if (listaAtual.length) {
      partes.push(
        `<ul class="list-disc list-inside space-y-0.5">${listaAtual
          .map((li) => `<li>${li}</li>`)
          .join('')}</ul>`,
      );
      listaAtual = [];
    }
  }

  linhas.forEach((linha) => {
    if (!linha) return;
    if (linha.startsWith('* ')) {
      listaAtual.push(linha.substring(2));
    } else {
      flushLista();
      partes.push(`<p>${linha}</p>`);
    }
  });

  flushLista();
  return partes.join('');
}

export function Relatorios({ resultadoInicial = null, semLayout = false }) {
  const params = useParams();
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(resultadoInicial);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSalvo, setMensagemSalvo] = useState('');
  const [nomeRelatorio, setNomeRelatorio] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!arquivo) {
      setErro('Selecione um arquivo Excel ou CSV para analisar.');
      return;
    }
    setErro('');
    setCarregando(true);
    setResultado(null);
    try {
      const data = await analisarRelatorioExcel(arquivo);
      setResultado(data);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao analisar o relatório.');
    } finally {
      setCarregando(false);
    }
  }

  function handleArquivoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setArquivo(null);
      return;
    }
    setArquivo(file);
  }

  const vendas = resultado?.vendas_kpis;
  const COLORS = ['#047857', '#0ea5e9', '#f97316', '#6366f1', '#facc15', '#22c55e', '#ec4899'];

  const content = (
    <>
      {!params.id && (
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">Resumo mensal de vendas</h1>
            <p className="text-slate-500 text-sm mt-1">
              Gere um resumo mensal profissional a partir do relatório exportado do seu sistema de vendas.
            </p>
          </div>
          {resultado && (
            <div className="flex flex-col items-start gap-1 text-xs sm:text-sm text-slate-500">
              <input
                type="text"
                value={nomeRelatorio}
                onChange={(e) => setNomeRelatorio(e.target.value)}
                placeholder="Nome do relatório (ex.: Março/2026 – Superama)"
                className="w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs sm:text-sm text-slate-800"
              />
              {mensagemSalvo && (
                <span className="block text-emerald-700 font-medium">{mensagemSalvo}</span>
              )}
              {!resultado.resumo_id && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setSalvando(true);
                      setMensagemSalvo('');
                      const resp = await salvarResumoMensal(resultado, null, nomeRelatorio);
                      setResultado((prev) => (prev ? { ...prev, resumo_id: resp.resumo_id } : prev));
                      setMensagemSalvo('Resumo salvo com sucesso.');
                    } catch (err) {
                      setMensagemSalvo(
                        err.response?.data?.erro || 'Erro ao salvar resumo. Tente novamente.',
                      );
                    } finally {
                      setSalvando(false);
                    }
                  }}
                  disabled={salvando}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : 'Salvar este resumo mensal'}
                </button>
              )}
              {resultado.resumo_id && (
                <>
                  <span className="block">Resumo salvo.</span>
                  <Link
                    to={`/resumo-mensal/${resultado.resumo_id}`}
                    className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 mt-1 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Ver este resumo depois
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!params.id && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Estrutura recomendada da planilha
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-2">
            Para uma análise completa, a planilha deve conter pelo menos as colunas abaixo (com estes nomes
            ou bem próximos):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-slate-700">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
              <p className="font-semibold">Identificação do item</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><strong>Código Interno</strong></li>
                <li><strong>Código Barras</strong></li>
                <li><strong>Descrição</strong></li>
              </ul>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
              <p className="font-semibold">Classificação</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><strong>Departamento</strong></li>
                <li><strong>Grupo</strong> (opcional, mas recomendado)</li>
                <li><strong>Marca</strong></li>
              </ul>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
              <p className="font-semibold">Indicadores de venda</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><strong>Quantidade Reg.</strong> (quantidade vendida)</li>
                <li><strong>Quantidade Un.</strong> (registros/unidades, se houver)</li>
                <li><strong>Venda Bruta</strong></li>
                <li><strong>Cancelamentos</strong></li>
                <li><strong>Acréscimos</strong></li>
                <li><strong>Descontos</strong></li>
                <li><strong>Venda Líquida</strong></li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Se alguma coluna não existir, a Metaji AI ainda tentará analisar, mas quanto mais completa estiver
            a estrutura, melhor será o resumo mensal.
          </p>
        </section>
      )}

      {!params.id && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Arquivo de relatório (Excel ou CSV)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleArquivoChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2.5 file:text-emerald-700 hover:file:bg-emerald-100 file:min-h-[44px]"
            />
            {arquivo && (
              <p className="mt-1 text-xs text-slate-500">
                Selecionado: <span className="font-medium">{arquivo.name}</span> ({Math.round(arquivo.size / 1024)} KB)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 min-h-[44px] touch-manipulation"
          >
            {carregando ? 'Analisando...' : 'Enviar e analisar'}
          </button>

          {erro && (
            <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {erro}
            </div>
          )}
        </form>
      )}

      {resultado && (
        <div className="space-y-4">
          {vendas && vendas.disponivel && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 shadow-sm p-3 sm:p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-800 mb-3">
                Indicadores de vendas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg bg-white/80 border border-emerald-100 p-3">
                  <p className="text-xs text-emerald-700 uppercase tracking-wide">Venda bruta</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    {vendas.totais.venda_bruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 border border-emerald-100 p-3">
                  <p className="text-xs text-emerald-700 uppercase tracking-wide">Venda líquida</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    {vendas.totais.venda_liquida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 border border-emerald-100 p-3">
                  <p className="text-xs text-emerald-700 uppercase tracking-wide">Descontos</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    {vendas.totais.descontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {vendas.totais.perc_descontos.toFixed(2).replace('.', ',')}% da venda bruta
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 border border-emerald-100 p-3">
                  <p className="text-xs text-emerald-700 uppercase tracking-wide">Cancelamentos</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    {vendas.totais.cancelamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {vendas.totais.perc_cancelamentos.toFixed(2).replace('.', ',')}% da venda bruta
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 border border-emerald-100 p-3 col-span-2 md:col-span-2">
                  <p className="text-xs text-emerald-700 uppercase tracking-wide">Ticket médio</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Por item vendido:{' '}
                    <span className="font-semibold text-emerald-900">
                      {vendas.totais.ticket_medio_item.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </p>
                  {vendas.totais.ticket_medio_registro > 0 && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Por registro/unidade:{' '}
                      <span className="font-semibold text-emerald-900">
                        {vendas.totais.ticket_medio_registro.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-4 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-4">
                {Array.isArray(vendas.por_departamento) && vendas.por_departamento.length > 0 && (
                  <div className="h-56 sm:h-64">
                    <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                      Venda líquida por departamento
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendas.por_departamento.slice(0, 8)}>
                        <XAxis
                          dataKey="departamento"
                          tick={{ fontSize: 9 }}
                          interval={0}
                          angle={-40}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip
                          formatter={(v) =>
                            v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          }
                        />
                        <Bar dataKey="venda_liquida" fill="#047857" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {Array.isArray(vendas.top_marcas) && vendas.top_marcas.length > 0 && (
                  <div className="h-56 sm:h-64">
                    <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                      Top marcas por venda líquida
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vendas.top_marcas.slice(0, 8)}
                          dataKey="venda_liquida"
                          nameKey="marca"
                          cx="50%"
                          cy="45%"
                          outerRadius={70}
                          labelLine={false}
                          label={({ name, percent }) =>
                            percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                          }
                        >
                          {vendas.top_marcas.slice(0, 8).map((entry, index) => (
                            <Cell key={entry.marca} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) =>
                            v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {Array.isArray(vendas.top_produtos) && vendas.top_produtos.length > 0 && (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-white/80 border border-emerald-100 p-3 sm:p-4">
                    <h3 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                      Top produtos por venda líquida
                    </h3>
                    <div className="max-h-64 overflow-y-auto pr-1 text-xs sm:text-sm">
                      <ul className="space-y-2">
                        {vendas.top_produtos.slice(0, 10).map((p) => (
                          <li key={p.descricao} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                            <p className="font-semibold text-slate-900 break-words">{p.descricao}</p>
                            <p className="text-[11px] text-slate-500">
                              {p.departamento} • {p.marca}
                            </p>
                            <p className="text-[11px] text-slate-700 mt-0.5">
                              Venda líquida:{' '}
                              <span className="font-semibold">
                                {p.venda_liquida.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </span>{' '}
                              • Qtd.: {p.quantidade_reg}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {Array.isArray(vendas.produtos_baixa_saida) && vendas.produtos_baixa_saida.length > 0 && (
                    <div className="rounded-lg bg-white/80 border border-amber-100 p-3 sm:p-4">
                      <h3 className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide">
                        Produtos com baixa saída
                      </h3>
                      <div className="max-h-64 overflow-y-auto pr-1 text-[11px] sm:text-xs">
                        <ul className="space-y-2">
                          {vendas.produtos_baixa_saida.slice(0, 10).map((p) => (
                            <li
                              key={`${p.descricao}-${p.departamento}-${p.marca}`}
                              className="border-b border-amber-100 pb-2 last:border-0 last:pb-0"
                            >
                              <p className="font-semibold text-slate-900 break-words">{p.descricao}</p>
                              <p className="text-[11px] text-slate-500">
                                {p.departamento} • {p.marca}
                              </p>
                              <p className="text-[11px] text-slate-700 mt-0.5">
                                Venda líquida:{' '}
                                <span className="font-semibold">
                                  {p.venda_liquida.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </span>{' '}
                                • Qtd.: {p.quantidade_reg}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="mt-2 text-[11px] text-amber-800">
                        Estes itens têm pouca movimentação. Avalie preço, exposição ou necessidade de manter em linha.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {resultado.resumo_ia && (() => {
            const linhas = resultado.resumo_ia
              .split('\n')
              .map((linha) => linha.trim())
              .filter(Boolean);

            const blocos = [];
            linhas.forEach((linha) => {
              const m = linha.match(/^(\d\))\s*\*\*(.+?)\*\*:\s*(.*)/);
              if (m) {
                blocos.push({
                  ordem: m[1],
                  titulo: m[2],
                  texto: m[3] || '',
                });
              } else if (blocos.length === 0) {
                // primeira linha sem numeração vira um bloco geral
                blocos.push({
                  ordem: '',
                  titulo: 'Resumo geral',
                  texto: linha,
                });
              } else {
                blocos[blocos.length - 1].texto += `\n${linha}`;
              }
            });

            return (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50/80 shadow-sm p-3 sm:p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-800 mb-3">
                Metaji AI – análise automática para o dono
                </h2>
                <div className="grid gap-3 md:gap-4 md:grid-cols-2">
                  {blocos.map((b, idx) => (
                    <article
                      key={`${b.ordem}-${b.titulo}-${idx}`}
                      className="rounded-lg bg-white/90 border border-emerald-100 p-3 sm:p-4 shadow-sm"
                    >
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-1.5">
                        {b.ordem && <span className="mr-1">{b.ordem}</span>}
                        {b.titulo}
                      </h3>
                      <div
                        className="text-sm text-emerald-950 leading-relaxed space-y-1"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(b.texto) }}
                      />
                    </article>
                  ))}
                </div>
              </section>
            );
          })()}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Resumo do arquivo
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Arquivo</dt>
                <dd className="font-medium text-slate-800 break-all">{resultado.arquivo}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Aba analisada</dt>
                <dd className="font-medium text-slate-800">{resultado.aba_analisada}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Linhas úteis</dt>
                <dd className="font-medium text-slate-800">{resultado.total_linhas}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Colunas detectadas</dt>
                <dd className="font-medium text-slate-800">
                  {resultado.colunas?.join(', ') || '–'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">IA (Gemini)</dt>
                <dd className="font-medium text-slate-800">
                  {resultado.ia_ativa ? 'Ativada (usando GEMINI_API_KEY)' : 'Desativada (sem chave configurada)'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </>
  );

  if (semLayout) {
    return content;
  }

  return <AppLayout>{content}</AppLayout>;
}

