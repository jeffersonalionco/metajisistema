import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { atualizarModoPreparo } from '../services/api';

function formatarCodigo(val) {
  if (val == null || val === '') return '–';
  const n = Number(val);
  return Number.isNaN(n) ? String(val) : String(Math.round(n));
}

function formatarNumero(val) {
  if (val == null || val === '') return '–';
  const n = Number(val);
  return Number.isNaN(n) ? String(val) : n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function formatarMoeda(val) {
  if (val == null || val === '') return '–';
  const n = Number(val);
  return Number.isNaN(n) ? String(val) : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const MAX_CARACTERES_OBS = 3900;

function formatarDataHora(val) {
  if (!val) return '–';
  try {
    return new Date(val).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '–';
  }
}

function ModoPreparoEditor({ produto, onSalvo }) {
  const [valor, setValor] = useState(produto?.indc_obs ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [msgOk, setMsgOk] = useState(null);

  useEffect(() => {
    setValor(produto?.indc_obs ?? '');
  }, [produto?.indc_prod_codigo, produto?.indc_obs]);

  async function handleSalvar() {
    if (!produto?.indc_prod_codigo || !onSalvo) return;
    setErro(null);
    setMsgOk(null);
    setSalvando(true);
    try {
      await atualizarModoPreparo(produto.indc_prod_codigo, valor);
      setMsgOk('Modo de preparo salvo.');
      onSalvo(produto.indc_prod_codigo);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  const codigo = produto?.indc_prod_codigo;
  const restante = MAX_CARACTERES_OBS - valor.length;
  const ultima = produto?.ultima_alteracao_obs;

  return (
    <div className="rounded-lg border border-slate-200 bg-amber-50/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-700">Modo de preparo</h4>
        <span className="text-xs text-slate-500">{valor.length} / {MAX_CARACTERES_OBS} caracteres</span>
      </div>
      <textarea
        value={valor}
        onChange={(e) => setValor(e.target.value.slice(0, MAX_CARACTERES_OBS))}
        maxLength={MAX_CARACTERES_OBS}
        rows={6}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-y min-h-[120px]"
        placeholder="Digite o modo de preparo (máx. 3900 caracteres)."
      />
      {ultima && (
        <p className="mt-2 text-xs text-slate-500">
          Última alteração: <strong>{ultima.nome}</strong> em {formatarDataHora(ultima.alterado_em)}
        </p>
      )}
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando || !codigo}
          className="rounded-lg bg-emerald-600 px-4 py-3 sm:py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 min-h-[44px] touch-manipulation"
        >
          {salvando ? 'Salvando...' : 'Salvar modo de preparo'}
        </button>
        {restante <= 100 && <span className="text-xs text-amber-700">Restam {restante} caracteres.</span>}
      </div>
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
      {msgOk && <p className="mt-2 text-sm text-emerald-700">{msgOk}</p>}
    </div>
  );
}

export function PainelReceita({ produto, receita, carregando, onFechar, onObsSalvo }) {
  if (!produto && !carregando) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <p className="text-slate-500">Selecione um produto na lista para ver a receita.</p>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Carregando receita...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Receita do produto</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/ficha/${formatarCodigo(produto.indc_prod_codigo)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 touch-manipulation"
          >
            Gerar ficha cadastral
          </Link>
          <button
            type="button"
            onClick={onFechar}
            className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg text-slate-500 hover:text-slate-700 text-sm font-medium touch-manipulation"
          >
            Fechar
          </button>
        </div>
      </div>
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 leading-snug mb-3 sm:mb-4">
            {produto.indc_descricao || `Produto ${produto.indc_prod_codigo}`}
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between items-baseline gap-4 py-1.5 border-b border-slate-200/80">
              <span className="text-slate-500 shrink-0">Código</span>
              <span className="font-medium text-slate-800 text-right">{formatarCodigo(produto.indc_prod_codigo)}</span>
            </li>
            <li className="flex justify-between items-baseline gap-4 py-1.5 border-b border-slate-200/80">
              <span className="text-slate-500 shrink-0">Código de barras</span>
              <span className="font-medium text-slate-800 text-right font-mono text-xs">{produto.prod_codbarras || '–'}</span>
            </li>
            <li className="flex justify-between items-baseline gap-4 py-1.5 border-b border-slate-200/80">
              <span className="text-slate-500 shrink-0">Unidade</span>
              <span className="font-medium text-slate-800 text-right">{produto.indc_unid_codigo || '–'}</span>
            </li>
            <li className="flex justify-between items-baseline gap-4 py-1.5 border-b border-slate-200/80">
              <span className="text-slate-500 shrink-0">Rendimento</span>
              <span className="font-medium text-slate-800 text-right">{formatarNumero(produto.indc_rendimento)}</span>
            </li>
            <li className="flex justify-between items-baseline gap-4 py-1.5 border-b border-slate-200/80">
              <span className="text-slate-500 shrink-0">Peso total</span>
              <span className="font-medium text-slate-800 text-right">{formatarNumero(produto.indc_pesototal)}</span>
            </li>
            <li className="flex justify-between items-baseline gap-4 py-1.5">
              <span className="text-slate-500 shrink-0">Custo total</span>
              <span className="font-medium text-slate-800 text-right">{formatarMoeda(produto.indc_precototal)}</span>
            </li>
          </ul>
        </div>

        <ModoPreparoEditor
          produto={produto}
          onSalvo={onObsSalvo}
        />

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Ingredientes</h4>
          {receita.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum ingrediente cadastrado para esta receita.</p>
          ) : (
            <ul className="space-y-3">
              {receita.map((row, i) => {
                const descricao = [row.prod_descricao, row.prod_complemento].filter(Boolean).join(' ') || '–';
                return (
                  <li
                    key={row.indd_cod2 ?? i}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 hover:shadow transition-shadow"
                  >
                    <p className="text-slate-800 text-sm font-medium leading-snug break-words mb-2">
                      {descricao}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 [word-break:break-word]">
                      <span><strong className="text-slate-500">Código:</strong> {formatarCodigo(row.indd_cod2)}</span>
                      <span><strong className="text-slate-500">Cód. barras:</strong> {row.prod_codbarras || '–'}</span>
                      <span><strong className="text-slate-500">Quantidade:</strong> {formatarNumero(row.indd_qreceita)} {row.indd_unid_codigo || ''}</span>
                      <span><strong className="text-slate-500">Custo:</strong> {formatarMoeda(row.indd_precoitem)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
