import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { listarValidades } from '../services/api';

export function RelatorioValidades() {
  const [filtros, setFiltros] = useState({
    data_valid_ini: '',
    data_valid_fim: '',
    unidade: '',
    fornecedor: '',
    apenas_vencidos: false,
    ate_dias: '',
  });
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const resp = await listarValidades({
        ...filtros,
        apenas_vencidos: filtros.apenas_vencidos ? 'true' : undefined,
      });
      setDados(resp);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao carregar relatório de validades.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout>
      <div className="relatorio-validades-pagina">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 print:mb-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">Relatório de validades</h1>
          <p className="text-slate-500 text-sm mt-1">
            Consulte produtos por data de validade, estoque e lote para prevenir perdas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="hidden print:hidden sm:inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700"
        >
          Imprimir / Salvar em PDF
        </button>
        </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          carregar();
        }}
        className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs sm:text-sm"
      >
        <div>
          <label className="block mb-1 text-[11px] font-medium text-slate-600">Validade inicial</label>
          <input
            type="date"
            value={filtros.data_valid_ini}
            onChange={(e) => setFiltros((f) => ({ ...f, data_valid_ini: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs sm:text-sm text-slate-800"
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-medium text-slate-600">Validade final</label>
          <input
            type="date"
            value={filtros.data_valid_fim}
            onChange={(e) => setFiltros((f) => ({ ...f, data_valid_fim: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs sm:text-sm text-slate-800"
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-medium text-slate-600">Unidade</label>
          <input
            type="text"
            value={filtros.unidade}
            onChange={(e) => setFiltros((f) => ({ ...f, unidade: e.target.value }))}
            placeholder="Ex.: 001"
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs sm:text-sm text-slate-800"
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-medium text-slate-600">Fornecedor (código)</label>
          <input
            type="number"
            value={filtros.fornecedor}
            onChange={(e) => setFiltros((f) => ({ ...f, fornecedor: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs sm:text-sm text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2 mt-1">
          <label className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-700">
            <input
              type="checkbox"
              checked={filtros.apenas_vencidos}
              onChange={(e) => setFiltros((f) => ({ ...f, apenas_vencidos: e.target.checked }))}
              className="h-3 w-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Apenas vencidos
          </label>
          <div className="flex items-center gap-1">
            <span className="text-[11px] sm:text-xs text-slate-700">Ou que vencem em até</span>
            <input
              type="number"
              min="1"
              value={filtros.ate_dias}
              onChange={(e) => setFiltros((f) => ({ ...f, ate_dias: e.target.value }))}
              className="w-16 rounded-lg border border-slate-300 bg-white px-1.5 py-1 text-[11px] text-slate-800"
            />
            <span className="text-[11px] sm:text-xs text-slate-700">dias</span>
          </div>
        </div>
        <div className="sm:col-span-2 flex justify-end mt-2">
          <button
            type="submit"
            disabled={carregando}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {carregando ? 'Carregando...' : 'Aplicar filtros'}
          </button>
        </div>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 print:text-[10px]">
        {erro && <p className="text-xs sm:text-sm text-red-600 mb-2">{erro}</p>}
        {!erro && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-slate-600">
                Encontrados{' '}
                <span className="font-semibold text-slate-800">
                  {dados.length}
                </span>{' '}
                lançamentos de validade.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px] sm:text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="px-2 py-2 text-left font-semibold">Produto</th>
                    <th className="px-2 py-2 text-left font-semibold">Código</th>
                    <th className="px-2 py-2 text-left font-semibold">Unid.</th>
                    <th className="px-2 py-2 text-left font-semibold">Recebimento</th>
                    <th className="px-2 py-2 text-left font-semibold">Validade</th>
                    <th className="px-2 py-2 text-left font-semibold">Situação</th>
                    <th className="px-2 py-2 text-left font-semibold">Qtd. recebida</th>
                    <th className="px-2 py-2 text-left font-semibold">Saídas no período</th>
                    <th className="px-2 py-2 text-left font-semibold">Estoque atual</th>
                    <th className="px-2 py-2 text-left font-semibold">Lote / Doc.</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.map((item, idx) => {
                    const dias = item.dias_para_vencer ?? null;
                    let situacao = 'Sem informação';
                    let classe = 'text-slate-700';
                    if (dias !== null) {
                      if (dias < 0) {
                        situacao = `Vencido há ${Math.abs(dias)} dia(s)`;
                        classe = 'text-red-700';
                      } else if (dias === 0) {
                        situacao = 'Vence hoje';
                        classe = 'text-red-600';
                      } else if (dias <= 7) {
                        situacao = `Vence em ${dias} dia(s)`;
                        classe = 'text-amber-700';
                      } else if (dias <= 30) {
                        situacao = `Vence em ${dias} dia(s)`;
                        classe = 'text-amber-600';
                      } else {
                        situacao = `Faltam ${dias} dia(s)`;
                        classe = 'text-emerald-700';
                      }
                    }
                    return (
                      <tr key={`${item.prod_codigo}-${idx}`} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 max-w-[220px]">
                          <span className="font-medium text-slate-900 break-words">
                            {item.descricao || 'Sem descrição'}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">{item.prod_codigo}</td>
                        <td className="px-2 py-1.5">{item.unidade}</td>
                        <td className="px-2 py-1.5">
                          {item.data_entrada
                            ? new Date(item.data_entrada).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="px-2 py-1.5">
                          {item.validade
                            ? new Date(item.validade).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className={`px-2 py-1.5 ${classe}`}>{situacao}</td>
                        <td className="px-2 py-1.5">
                          {item.quantidade != null
                            ? Number(item.quantidade).toLocaleString('pt-BR', {
                                minimumFractionDigits: 3,
                              })
                            : '—'}
                        </td>
                        <td className="px-2 py-1.5">
                          {item.saidas_periodo != null
                            ? Number(item.saidas_periodo).toLocaleString('pt-BR', {
                                minimumFractionDigits: 3,
                              })
                            : '—'}
                        </td>
                        <td className="px-2 py-1.5">
                          {item.estoque_atual != null
                            ? Number(item.estoque_atual).toLocaleString('pt-BR', {
                                minimumFractionDigits: 3,
                              })
                            : '—'}
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="block">{item.lote || '—'}</span>
                          <span className="block text-[10px] text-slate-500">
                            {item.documento || ''}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      </div>
    </AppLayout>
  );
}

