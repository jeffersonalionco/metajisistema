import { useState, useEffect, useCallback } from 'react';
import { listarUsuarios, criarUsuario } from '../services/api';
import { AppLayout } from '../components/AppLayout';

function formatarData(val) {
  if (!val) return '–';
  try {
    return new Date(val).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '–';
  }
}

export function Usuarios() {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [setor, setSetor] = useState('');
  const [cargo, setCargo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const data = await listarUsuarios();
      setLista(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.response?.status === 403 ? 'Acesso restrito a administradores.' : 'Erro ao carregar usuários.');
      setLista([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setMsgSucesso('');
    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha nome completo, e-mail e senha.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setEnviando(true);
    try {
      await criarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        cpf: cpf.trim() || undefined,
        telefone: telefone.trim() || undefined,
        setor: setor.trim() || undefined,
        cargo: cargo.trim() || undefined,
      });
      setMsgSucesso('Usuário cadastrado com sucesso.');
      setNome('');
      setEmail('');
      setSenha('');
      setCpf('');
      setTelefone('');
      setSetor('');
      setCargo('');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao cadastrar usuário.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Cadastro de usuários</h1>
        <p className="text-slate-500 text-sm mt-1">Crie e visualize os usuários que podem acessar o sistema</p>
      </div>

      {erro && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {erro}
        </div>
      )}
      {msgSucesso && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          {msgSucesso}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6 sm:mb-8">
        <div className="border-b border-slate-200 bg-slate-50 px-3 sm:px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Novo usuário</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
              <input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
              <input
                id="telefone"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="setor" className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
              <input
                id="setor"
                type="text"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
                placeholder="Ex.: Produção, Qualidade"
              />
            </div>
            <div>
              <label htmlFor="cargo" className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
              <input
                id="cargo"
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
                placeholder="Ex.: Operador, Supervisor"
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 sm:py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base"
                placeholder="Mín. 6 caracteres"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-emerald-600 py-3 sm:py-2.5 font-medium text-white shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 min-h-[48px] touch-manipulation"
              >
                {enviando ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-3 sm:px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Usuários cadastrados</h2>
        </div>
        {carregando ? (
          <div className="p-6 sm:p-8 flex justify-center text-slate-500">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : lista.length === 0 ? (
          <p className="p-4 sm:p-6 text-slate-500 text-sm">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="overflow-x-auto overscroll-x-contain -mx-px">
            <table className="min-w-[640px] w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">Nome</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">E-mail</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">CPF</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">Telefone</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">Setor</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">Cargo</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">Admin</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">Ativo</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {lista.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-3 sm:px-4 py-2.5 font-medium">{u.nome || '–'}</td>
                    <td className="px-3 sm:px-4 py-2.5">{u.email || '–'}</td>
                    <td className="px-3 sm:px-4 py-2.5">{u.cpf || '–'}</td>
                    <td className="px-3 sm:px-4 py-2.5">{u.telefone || '–'}</td>
                    <td className="px-3 sm:px-4 py-2.5">{u.setor || '–'}</td>
                    <td className="px-3 sm:px-4 py-2.5">{u.cargo || '–'}</td>
                    <td className="px-3 sm:px-4 py-2.5">{u.admin ? 'Sim' : 'Não'}</td>
                    <td className="px-3 sm:px-4 py-2.5">{u.ativo !== false ? 'Sim' : 'Não'}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-slate-500 whitespace-nowrap">{formatarData(u.criado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
