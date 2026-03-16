import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { obterResumoMensal } from '../services/api';
import { Relatorios } from './Relatorios';

export function ResumoMensalDetalhe() {
  const { id } = useParams();
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    setErro('');
    obterResumoMensal(id)
      .then(setResultado)
      .catch((err) => {
        setErro(err.response?.data?.erro || 'Erro ao carregar resumo mensal.');
      })
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (erro || !resultado) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-8">
          <p className="text-red-600 mb-4 text-sm">{erro}</p>
          <Link
            to="/relatorios"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            ← Voltar ao resumo mensal
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:mb-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">
            {resultado.nome_relatorio || 'Resumo mensal salvo'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Arquivo: <span className="font-medium">{resultado.nome_arquivo}</span>
          </p>
          {resultado.criado_em && (
            <p className="text-xs sm:text-sm text-slate-500">
              Gerado em:{' '}
              {new Date(resultado.criado_em).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Link
            to="/relatorios"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Voltar ao resumo mensal
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700"
          >
            Imprimir / Salvar em PDF
          </button>
        </div>
      </div>
      <Relatorios resultadoInicial={resultado} semLayout />
    </AppLayout>
  );
}

