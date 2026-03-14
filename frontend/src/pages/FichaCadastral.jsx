import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduto, getReceita, getEmpresa } from '../services/api';

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

function formatarCnpj(val) {
  if (!val) return '–';
  const v = String(val).replace(/\D/g, '');
  if (v.length < 14) return v;
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`;
}

function unidadeParaRendimento(codigo) {
  if (!codigo) return 'kg';
  const c = String(codigo).toLowerCase().replace(/\s/g, '');
  if (c === '003' || c === '3' || c === 'g' || c === 'gr' || c === 'grama') return 'g';
  return 'kg';
}

export function FichaCadastral() {
  const { codigo } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [produto, setProduto] = useState(null);
  const [receita, setReceita] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [imprimirComFundo, setImprimirComFundo] = useState(false);
  const fichaRef = useRef(null);

  useEffect(() => {
    if (!codigo) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(null);
    Promise.all([getEmpresa(), getProduto(codigo), getReceita(codigo)])
      .then(([emp, prod, rec]) => {
        setEmpresa(emp);
        setProduto(prod);
        setReceita(Array.isArray(rec) ? rec : []);
      })
      .catch(() => setErro('Erro ao carregar dados.'))
      .finally(() => setCarregando(false));
  }, [codigo]);

  function imprimir() {
    window.print();
  }

  useEffect(() => {
    let tituloAntesImprimir = '';
    function ajustarParaUmaPagina() {
      tituloAntesImprimir = document.title;
      document.title = 'Ficha Cadastral';
      const el = fichaRef.current;
      if (!el) return;
      const comFundo = el.closest('.ficha-outer-com-fundo');
      const pageHeightMm = comFundo ? 273 : 297;
      const pageHeightPx = (pageHeightMm * 96) / 25.4;
      const contentHeight = el.offsetHeight;
      const scale = contentHeight > 0 ? Math.min(1, pageHeightPx / contentHeight) : 1;
      el.style.transform = `scale(${scale})`;
    }
    function resetar() {
      if (tituloAntesImprimir) document.title = tituloAntesImprimir;
      const el = fichaRef.current;
      if (el) el.style.transform = '';
    }
    window.addEventListener('beforeprint', ajustarParaUmaPagina);
    window.addEventListener('afterprint', resetar);
    return () => {
      window.removeEventListener('beforeprint', ajustarParaUmaPagina);
      window.removeEventListener('afterprint', resetar);
    };
  }, [produto, receita, empresa]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (erro || !produto) {
    return (
      <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{erro || 'Produto não encontrado.'}</p>
        <Link to="/" className="text-emerald-600 hover:underline">Voltar às receitas</Link>
      </div>
    );
  }

  const nomeProduto = produto.indc_descricao || `Produto ${formatarCodigo(produto.indc_prod_codigo)}`;

  return (
    <>
      <div className="print:hidden bg-slate-100 border-b border-slate-200 px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <Link to="/" className="text-emerald-600 hover:underline text-sm font-medium min-h-[44px] flex items-center touch-manipulation">← Voltar às receitas</Link>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 min-h-[44px] py-1">
            <input
              type="checkbox"
              checked={imprimirComFundo}
              onChange={(e) => setImprimirComFundo(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
            />
            <span>Incluir plano de fundo na impressão</span>
          </label>
          <button
            type="button"
            onClick={imprimir}
            className="rounded-lg bg-emerald-600 px-4 py-3 sm:py-2 text-sm font-medium text-white hover:bg-emerald-700 min-h-[48px] touch-manipulation"
          >
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      <div className={`ficha-cadastral-outer w-full max-w-4xl mx-auto px-0 sm:px-2 print:max-w-none print:px-0 relative ${imprimirComFundo ? 'ficha-outer-com-fundo' : ''}`}>
        {/* Overlay transparente em toda a área (como a imagem de fundo), só um detalhe */}
        {imprimirComFundo && <div className="ficha-overlay" aria-hidden />}
        <div
          ref={fichaRef}
          className={`ficha-cadastral ficha-cadastral-inner text-slate-900 print:p-0 p-3 sm:p-6 relative min-h-[297mm] ${imprimirComFundo ? 'ficha-com-fundo' : 'bg-white'} ${imprimirComFundo ? 'z-10' : ''}`}
        >
        <div className={imprimirComFundo ? 'relative z-10' : ''}>
        {/* Cabeçalho empresa */}
        <header className="border-b-2 border-slate-500 pb-6 mb-6">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            {empresa?.logo_base64 && (
              <img src={empresa.logo_base64} alt="" className="h-16 w-auto object-contain print:h-14" />
            )}
            <div>
              {empresa?.nome_fantasia && (
                <h1 className="text-xl font-bold text-slate-900">{empresa.nome_fantasia}</h1>
              )}
              {empresa?.razao_social && empresa.razao_social !== empresa.nome_fantasia && (
                <p className="text-sm text-slate-700">{empresa.razao_social}</p>
              )}
              {empresa?.cnpj && (
                <p className="text-sm text-slate-600 mt-0.5">CNPJ: {formatarCnpj(empresa.cnpj)}</p>
              )}
            </div>
          </div>
        </header>

        {/* Título do documento */}
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Ficha cadastral do produto</h2>
        <p className="text-sm text-slate-600 mb-6">Documento gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

        {/* Dados do produto */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-slate-800 border-b-2 border-slate-500 pb-2 mb-3">Dados do produto</h3>
          <p className="text-sm font-medium text-slate-900 mb-3">{nomeProduto}</p>
          <ul className="border-2 border-slate-400 rounded-lg overflow-hidden text-sm">
            <li className="flex justify-between items-baseline gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-400 last:border-b-0">
              <span className="text-slate-600">Código</span>
              <span className="font-medium text-slate-900">{formatarCodigo(produto.indc_prod_codigo)}</span>
            </li>
            <li className="flex justify-between items-baseline gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-400 last:border-b-0">
              <span className="text-slate-600">Código de barras</span>
              <span className="font-mono text-slate-900">{produto.prod_codbarras || '–'}</span>
            </li>
            <li className="flex justify-between items-baseline gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-400 last:border-b-0">
              <span className="text-slate-600">Unidade</span>
              <span className="font-medium text-slate-900">{produto.indc_unid_codigo || '–'}</span>
            </li>
            <li className="flex justify-between items-baseline gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-400 last:border-b-0">
              <span className="text-slate-600">Rendimento</span>
              <span className="font-medium text-slate-900">{formatarNumero(produto.indc_rendimento)}</span>
            </li>
          </ul>
        </section>

        {/* Modo de preparo */}
        {produto.indc_obs != null && String(produto.indc_obs).trim() !== '' && (
          <section className="mb-6">
            <h3 className="text-base font-semibold text-slate-800 border-b-2 border-slate-500 pb-2 mb-2">Modo de preparo</h3>
            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{produto.indc_obs}</p>
          </section>
        )}

        {/* Ingredientes e rendimento */}
        <section>
          <h3 className="text-base font-semibold text-slate-800 border-b-2 border-slate-500 pb-2 mb-3">Ingredientes da receita</h3>
          {receita.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum ingrediente cadastrado.</p>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-sm border-collapse min-w-[280px]">
              <thead>
                <tr className="border-b-2 border-slate-500">
                  <th className="text-left py-2 pr-4 font-semibold text-slate-800">Código</th>
                  <th className="text-left py-2 pr-4 font-semibold text-slate-800">Descrição</th>
                  <th className="text-right py-2 font-semibold text-slate-800">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {receita.map((row, i) => {
                  const descricao = [row.prod_descricao, row.prod_complemento].filter(Boolean).join(' ') || '–';
                  return (
                    <tr key={row.indd_cod2 ?? i} className="border-b border-slate-300">
                      <td className="py-2 pr-4 font-medium text-slate-900">{formatarCodigo(row.indd_cod2)}</td>
                      <td className="py-2 pr-4 text-slate-900">{descricao}</td>
                      <td className="py-2 text-right text-slate-900">{formatarNumero(row.indd_qreceita)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
          {receita.length > 0 && (
            <p className="mt-3 text-sm text-slate-600">
              Esta receita utiliza {receita.length} ingrediente(s) e rende <strong>{formatarNumero(produto.indc_rendimento)}</strong> {unidadeParaRendimento(produto.indc_unid_codigo)} conforme cadastro.
            </p>
          )}
        </section>

        <p className="mt-6 pt-4 border-t border-slate-400 text-xs text-slate-600 text-center">
          Metaji Sistemas - Desenvolvido por Jefferson L. Alionco
        </p>

        </div>
        </div>
      </div>

      <div className="hidden print:block print:fixed print:bottom-0 print:right-0 print:py-4 print:pr-4 print:text-xs print:text-slate-400">
        Metaji Sistemas - Desenvolvido por Jefferson L. Alionco
      </div>

      <style>{`
        .ficha-com-fundo {
          background-image: url(/fundo-ficha.png);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .ficha-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.90);
          border-radius: 0;
          z-index: 1;
          pointer-events: none;
        }
        @media print {
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
          .ficha-cadastral { box-shadow: none; }
          .ficha-cadastral-outer {
            width: 210mm !important;
            height: 297mm !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .ficha-cadastral-outer.ficha-outer-com-fundo {
            background-image: url(/fundo-ficha.png) !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .ficha-cadastral-inner {
            transform-origin: top center !important;
            width: 210mm !important;
            margin-left: auto !important;
            margin-right: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .ficha-cadastral-inner.ficha-com-fundo {
            background-image: none !important;
            margin: 12mm auto !important;
            width: calc(210mm - 24mm) !important;
            min-height: calc(297mm - 24mm) !important;
            box-sizing: border-box !important;
          }
          .ficha-overlay {
            position: absolute !important;
            inset: 0 !important;
            background: rgba(255, 255, 255, 0.90) !important;
            border-radius: 0 !important;
            z-index: 1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}
