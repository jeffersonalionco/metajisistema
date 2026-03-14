import { useState, useEffect, useCallback } from 'react';
import { getEmpresa, updateEmpresa } from '../services/api';
import { AppLayout } from '../components/AppLayout';

const MAX_LOGO_KB = 400;

export function Empresa() {
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [msgSucesso, setMsgSucesso] = useState(null);
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [logoBase64, setLogoBase64] = useState(null);
  const [logoArquivo, setLogoArquivo] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const data = await getEmpresa();
      setNomeFantasia(data.nome_fantasia || '');
      setRazaoSocial(data.razao_social || '');
      setCnpj(cnpjParaExibicao(data.cnpj));
      setEndereco(data.endereco || '');
      setTelefone(data.telefone || '');
      setEmail(data.email || '');
      setLogoBase64(data.logo_base64 || null);
      setLogoArquivo(null);
    } catch (err) {
      setErro('Erro ao carregar dados da empresa.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem (PNG, JPG, etc.).');
      return;
    }
    if (file.size > MAX_LOGO_KB * 1024) {
      setErro(`Imagem deve ter no máximo ${MAX_LOGO_KB} KB.`);
      return;
    }
    setErro(null);
    const reader = new FileReader();
    reader.onload = () => setLogoBase64(reader.result);
    reader.readAsDataURL(file);
    setLogoArquivo(file.name);
  }

  function removerLogo() {
    setLogoBase64(null);
    setLogoArquivo(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setMsgSucesso(null);
    setEnviando(true);
    try {
      await updateEmpresa({
        nome_fantasia: nomeFantasia.trim() || null,
        razao_social: razaoSocial.trim() || null,
        cnpj: cnpj.trim().replace(/\D/g, '') || null,
        endereco: endereco.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        logo_base64: logoBase64,
      });
      setMsgSucesso('Dados da empresa salvos.');
      setLogoArquivo(null);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar.');
    } finally {
      setEnviando(false);
    }
  }

  function formatarCnpj(val) {
    const v = String(val).replace(/\D/g, '');
    if (v.length <= 2) return v;
    if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`;
    if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
    if (v.length <= 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`;
    return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`;
  }

  function cnpjParaExibicao(num) {
    if (!num) return '';
    return formatarCnpj(String(num).replace(/\D/g, ''));
  }

  if (carregando) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Dados da empresa</h1>
        <p className="text-slate-500 text-sm mt-1">Identificação da empresa (logo, nome, CNPJ). Exibido no sistema.</p>
      </div>

      {erro && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{erro}</div>
      )}
      {msgSucesso && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">{msgSucesso}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl w-full">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4">Logo</h2>
          <div className="flex flex-wrap items-start gap-6">
            {logoBase64 && (
              <div className="relative">
                <img src={logoBase64} alt="Logo" className="h-24 w-auto object-contain border border-slate-200 rounded-lg" />
                <button type="button" onClick={removerLogo} className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center hover:bg-red-600">
                  ×
                </button>
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2.5 file:text-emerald-700 hover:file:bg-emerald-100 file:min-h-[44px]"
              />
              <p className="mt-1 text-xs text-slate-500">Máx. {MAX_LOGO_KB} KB. PNG ou JPG.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Identificação</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome fantasia</label>
            <input
              type="text"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
              placeholder="Nome da empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Razão social</label>
            <input
              type="text"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
              placeholder="Razão social"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatarCnpj(e.target.value))}
              maxLength={18}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Contato / Endereço</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
              placeholder="Endereço completo"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
                placeholder="(00) 0000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
                placeholder="contato@empresa.com"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full sm:w-auto rounded-lg bg-emerald-600 px-6 py-3 sm:py-2.5 font-medium text-white shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 min-h-[48px] touch-manipulation"
        >
          {enviando ? 'Salvando...' : 'Salvar dados da empresa'}
        </button>
      </form>
    </AppLayout>
  );
}
