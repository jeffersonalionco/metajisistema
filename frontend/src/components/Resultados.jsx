export function Resultados({ termo, itens, carregando, onSelecionar, selecionadoCodigo }) {
  if (!termo?.trim()) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Resultados</h2>
        <p className="mt-4 text-slate-500 text-sm">Digite algo no campo de busca para listar produtos.</p>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Resultados</h2>
        <div className="mt-4 flex items-center gap-2 text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Carregando...
        </div>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Resultados</h2>
        <p className="mt-4 text-slate-500 text-sm">Nenhum produto encontrado para &quot;{termo}&quot;.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-3 sm:px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Resultados</h2>
        <p className="text-xs text-slate-500 mt-0.5">{itens.length} produto(s) encontrado(s)</p>
      </div>
      <ul className="divide-y divide-slate-100 max-h-[50vh] sm:max-h-[420px] overflow-y-auto overscroll-contain touch-pan-y">
        {itens.map((item) => {
          const codigoRaw = item.indc_prod_codigo;
          const codigo = Math.round(Number(codigoRaw));
          const codigoStr = codigoRaw != null && codigoRaw !== '' ? String(codigo) : '–';
          const ativo = Number(selecionadoCodigo) === codigo;
          const descricao = item.indc_descricao || `Produto ${codigoStr}`;
          return (
            <li key={codigo}>
              <button
                type="button"
                onClick={() => onSelecionar(item)}
                className={`w-full text-left px-3 sm:px-4 py-3 sm:py-3 min-h-[56px] flex flex-col justify-center transition-all rounded-none touch-manipulation active:bg-slate-100 ${
                  ativo
                    ? 'bg-emerald-50 text-emerald-800 font-medium border-l-4 border-emerald-500'
                    : 'hover:bg-slate-50 text-slate-800 border-l-4 border-transparent'
                }`}
              >
                <span className="block text-sm leading-snug break-words">{descricao}</span>
                <span className="block text-xs text-slate-500 mt-0.5">Cód. {codigoStr}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
