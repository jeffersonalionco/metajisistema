import { useState, useCallback } from 'react';
import { buscarProdutos, getProduto, getReceita } from '../services/api';
import { Busca } from '../components/Busca';
import { Resultados } from '../components/Resultados';
import { PainelReceita } from '../components/PainelReceita';
import { AppLayout } from '../components/AppLayout';

const OPCOES_FILTRO = [
  { value: '', label: 'Todos' },
  { value: 'sem_obs', label: 'Sem modo de preparo' },
  { value: 'com_obs', label: 'Com modo de preparo' },
  { value: 'sem_receita', label: 'Sem receita (sem ingredientes)' },
  { value: 'com_receita', label: 'Com receita (com ingredientes)' },
];

export function Receitas() {
  const [termo, setTermo] = useState('');
  const [filtro, setFiltro] = useState('');
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [receita, setReceita] = useState([]);
  const [carregandoReceita, setCarregandoReceita] = useState(false);
  const [erro, setErro] = useState(null);

  const pesquisar = useCallback(async (q, f) => {
    const termoBusca = q ?? termo;
    const filtroBusca = f ?? filtro;
    setTermo(termoBusca);
    if (f !== undefined) setFiltro(f);
    if (!termoBusca?.trim()) {
      setResultados([]);
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const data = await buscarProdutos(termoBusca, filtroBusca || undefined);
      setResultados(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro('Erro ao buscar produtos. Verifique se o backend está rodando.');
      setResultados([]);
    } finally {
      setCarregando(false);
    }
  }, [termo, filtro]);

  const selecionarProduto = useCallback(async (item) => {
    setProdutoSelecionado(null);
    setReceita([]);
    setCarregandoReceita(true);
    setErro(null);
    try {
      const [produto, ingredientes] = await Promise.all([
        getProduto(item.indc_prod_codigo),
        getReceita(item.indc_prod_codigo),
      ]);
      setProdutoSelecionado(produto);
      setReceita(Array.isArray(ingredientes) ? ingredientes : []);
    } catch (err) {
      setErro('Erro ao carregar produto ou receita.');
    } finally {
      setCarregandoReceita(false);
    }
  }, []);

  const fecharPainel = useCallback(() => {
    setProdutoSelecionado(null);
    setReceita([]);
  }, []);

  const aoSalvarModoPreparo = useCallback(async (codigo) => {
    try {
      const p = await getProduto(codigo);
      setProdutoSelecionado(p);
    } catch {
      // mantém estado atual em caso de erro ao recarregar
    }
  }, []);

  return (
    <AppLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-slate-800">Metaji Sistemas</h1>
        <p className="text-slate-500 text-sm mt-1">Consulte itens industrializados e suas receitas</p>
      </div>
      <Busca
        onBuscar={(q) => pesquisar(q, filtro)}
        placeholder="Pesquisar produto..."
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600 w-full sm:w-auto">Filtrar resultados:</span>
        <select
          value={filtro}
          onChange={(e) => {
            const v = e.target.value;
            setFiltro(v);
            if (termo?.trim()) pesquisar(termo, v);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full sm:w-auto min-h-[48px] sm:min-h-0"
        >
          {OPCOES_FILTRO.map((op) => (
            <option key={op.value || 'todos'} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

        {erro && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erro}
          </div>
        )}

        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Resultados
              termo={termo}
              itens={resultados}
              carregando={carregando}
              onSelecionar={selecionarProduto}
              selecionadoCodigo={produtoSelecionado?.indc_prod_codigo}
            />
          </div>
          <div className="lg:col-span-3 order-1 lg:order-2">
            <PainelReceita
              produto={produtoSelecionado}
              receita={receita}
              carregando={carregandoReceita}
              onFechar={fecharPainel}
              onObsSalvo={aoSalvarModoPreparo}
            />
          </div>
        </div>
    </AppLayout>
  );
}
