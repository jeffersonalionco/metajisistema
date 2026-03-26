import { useEffect, useMemo, useRef, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import {
  atualizarPostDocumentacao,
  criarPostDocumentacao,
  excluirPostDocumentacao,
  listarDocumentacao,
} from '../services/api';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

function formatarData(dt) {
  if (!dt) return '';
  try {
    return new Date(dt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const schemaPreview = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'div',
    'span',
    'u',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'blockquote',
    'pre',
    'code',
    'img',
  ],
  attributes: {
    ...(defaultSchema.attributes || {}),
    div: [...((defaultSchema.attributes || {}).div || []), 'style', 'className'],
    span: [...((defaultSchema.attributes || {}).span || []), 'style', 'className'],
    h1: [...((defaultSchema.attributes || {}).h1 || []), 'style', 'className'],
    h2: [...((defaultSchema.attributes || {}).h2 || []), 'style', 'className'],
    h3: [...((defaultSchema.attributes || {}).h3 || []), 'style', 'className'],
    p: [...((defaultSchema.attributes || {}).p || []), 'style', 'className'],
    a: [...((defaultSchema.attributes || {}).a || []), 'href', 'title', 'target', 'rel', 'style', 'className'],
    table: [...((defaultSchema.attributes || {}).table || []), 'style', 'className', 'bgcolor'],
    thead: [...((defaultSchema.attributes || {}).thead || []), 'style', 'className', 'bgcolor'],
    tbody: [...((defaultSchema.attributes || {}).tbody || []), 'style', 'className', 'bgcolor'],
    tr: [...((defaultSchema.attributes || {}).tr || []), 'style', 'className', 'bgcolor'],
    th: [...((defaultSchema.attributes || {}).th || []), 'align', 'style', 'className', 'bgcolor'],
    td: [...((defaultSchema.attributes || {}).td || []), 'align', 'style', 'className', 'bgcolor'],
    blockquote: [...((defaultSchema.attributes || {}).blockquote || []), 'style', 'className'],
    pre: [...((defaultSchema.attributes || {}).pre || []), 'style', 'className'],
    code: [...((defaultSchema.attributes || {}).code || []), 'style', 'className'],
    img: ['src', 'alt', 'title', 'width', 'height', 'style', 'className'],
  },
};

function previewMarkdown({ descricao, conteudo }) {
  const baseRaw = (descricao && String(descricao).trim()) || (conteudo && String(conteudo).trim()) || '';
  let base = baseRaw;
  base = base.replace(/```html\s*([\s\S]*?)```/gi, (_, inner) => inner.trim());
  base = base.replace(/```\s*([\s\S]*?)```/g, (full, inner) => {
    const trecho = String(inner || '').trim();
    const pareceHtml = /^<\/?[a-z][\s\S]*>/i.test(trecho) || /<table[\s\S]*>/i.test(trecho);
    return pareceHtml ? trecho : full;
  });
  if (!base) return 'Sem descrição.';
  const linhas = base
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
  const preview = linhas.slice(0, 4).join('\n');
  return linhas.length > 4 ? `${preview}\n\n...` : preview;
}

export function Documentacao() {
  const { isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [form, setForm] = useState({
    categoria: '',
    titulo: '',
    descricao: '',
    conteudo: '',
    ativo: true,
  });
  const textareaRef = useRef(null);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const data = await listarDocumentacao({
        categoria: filtroCategoria || undefined,
        busca: busca || undefined,
        apenas_ativos: mostrarInativos ? 'false' : 'true',
      });
      setPosts(data);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao carregar documentação.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categorias = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => set.add(p.categoria));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [posts]);

  const postsFiltrados = useMemo(() => {
    let arr = posts;
    if (filtroCategoria) {
      arr = arr.filter((p) => p.categoria === filtroCategoria);
    }
    if (busca.trim()) {
      const b = busca.trim().toLowerCase();
      arr = arr.filter((p) => {
        const t = `${p.titulo || ''} ${p.descricao || ''} ${p.conteudo || ''}`.toLowerCase();
        return t.includes(b);
      });
    }
    if (!mostrarInativos) {
      arr = arr.filter((p) => p.ativo === true);
    }
    return arr;
  }, [posts, filtroCategoria, busca, mostrarInativos]);

  const grupos = useMemo(() => {
    const g = {};
    postsFiltrados.forEach((p) => {
      if (!g[p.categoria]) g[p.categoria] = [];
      g[p.categoria].push(p);
    });
    Object.keys(g).forEach((k) => {
      g[k].sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    });
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }, [postsFiltrados]);

  function abrirNovo() {
    setEditando(null);
    setForm({ categoria: '', titulo: '', descricao: '', conteudo: '', ativo: true });
    setModalAberto(true);
  }

  function abrirEditar(p) {
    setEditando(p);
    setForm({
      categoria: p.categoria || '',
      titulo: p.titulo || '',
      descricao: p.descricao || '',
      conteudo: p.conteudo || '',
      ativo: p.ativo !== false,
    });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.categoria.trim() || !form.titulo.trim()) {
      setErro('Informe pelo menos categoria e título.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      if (editando?.id) {
        await atualizarPostDocumentacao(editando.id, form);
      } else {
        await criarPostDocumentacao(form);
      }
      setModalAberto(false);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar post.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(p) {
    const ok = window.confirm(`Excluir o post "${p.titulo}"?`);
    if (!ok) return;
    setErro('');
    try {
      await excluirPostDocumentacao(p.id);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao excluir post.');
    }
  }

  async function excluirPostEmEdicao() {
    if (!editando) return;
    const ok = window.confirm(`Excluir o post "${editando.titulo}"?`);
    if (!ok) return;
    try {
      await excluirPostDocumentacao(editando.id);
      setModalAberto(false);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao excluir post.');
    }
  }

  function aplicarWrap(prefixo, sufixo = prefixo) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = el.value || '';
    const selecionado = value.slice(start, end) || 'texto';
    const novoValor = value.slice(0, start) + prefixo + selecionado + sufixo + value.slice(end);
    setForm((f) => ({ ...f, conteudo: novoValor }));
    requestAnimationFrame(() => {
      el.focus();
      const novoStart = start + prefixo.length;
      const novoEnd = novoStart + selecionado.length;
      el.setSelectionRange(novoStart, novoEnd);
    });
  }

  function inserirLinha(texto) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const value = el.value || '';
    const prefixo = value.slice(0, start);
    const sufixo = value.slice(start);
    const antes = prefixo.endsWith('\n') || prefixo.length === 0 ? '' : '\n';
    const depois = sufixo.startsWith('\n') || sufixo.length === 0 ? '' : '\n';
    const novoValor = prefixo + antes + texto + depois + sufixo;
    setForm((f) => ({ ...f, conteudo: novoValor }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = (prefixo + antes + texto).length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <AppLayout>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">Documentação</h1>
          <p className="text-slate-500 text-sm mt-1">
            Informações internas da empresa: processos, padrões, instruções e comunicados.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={abrirNovo}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Novo post
          </button>
        )}
      </div>

      {erro && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {erro}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-800"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Buscar</label>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no título, descrição ou conteúdo"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            />
          </div>
          <div className="flex items-end justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={mostrarInativos}
                onChange={(e) => setMostrarInativos(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Mostrar inativos
            </label>
            <button
              type="button"
              onClick={carregar}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Atualizar
            </button>
          </div>
        </div>
      </section>

      {carregando ? (
        <div className="flex justify-center py-12">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : grupos.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-sm text-slate-600">Nenhum post encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map(([cat, itens]) => (
            <section key={cat} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="px-3 sm:px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  {cat}
                </h2>
                <span className="text-xs text-slate-500">{itens.length} item(ns)</span>
              </div>
              <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {itens.map((p) => (
                  <article
                    key={p.id}
                    className={`group rounded-2xl border p-3 sm:p-4 transition-shadow hover:shadow-md ${
                      p.ativo ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/documentacao/${p.id}`} className="block">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 break-words group-hover:text-emerald-800">
                            {p.titulo}
                          </h3>
                          <div className="mt-1 text-xs sm:text-sm text-slate-600 break-words max-h-28 overflow-hidden">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[[rehypeRaw], [rehypeSanitize, schemaPreview]]}
                              components={{
                                p: (props) => <p {...props} className="mt-1 first:mt-0" />,
                                h1: (props) => <h4 {...props} className="font-bold mt-1 first:mt-0" />,
                                h2: (props) => <h4 {...props} className="font-bold mt-1 first:mt-0" />,
                                h3: (props) => <h4 {...props} className="font-bold mt-1 first:mt-0" />,
                                ul: (props) => <ul {...props} className="list-disc pl-4 mt-1 space-y-0.5" />,
                                ol: (props) => <ol {...props} className="list-decimal pl-4 mt-1 space-y-0.5" />,
                                hr: () => <hr className="my-1 border-slate-200" />,
                                strong: (props) => <strong {...props} className="font-extrabold text-slate-700" />,
                                em: (props) => <em {...props} className="italic" />,
                                u: (props) => <u {...props} className="underline underline-offset-2" />,
                                a: (props) => <span {...props} className="underline" />,
                              }}
                            >
                              {previewMarkdown(p)}
                            </ReactMarkdown>
                          </div>
                        </Link>
                      </div>
                      {!p.ativo && (
                        <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-200 text-slate-700">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-[11px] text-slate-500">
                        Por <span className="font-semibold">{p.autor_nome}</span> •{' '}
                        {formatarData(p.criado_em)}
                      </p>
                      <Link
                        to={`/documentacao/${p.id}`}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Ler completo →
                      </Link>
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditar(p)}
                            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => excluir(p)}
                            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
            onClick={() => setModalAberto(false)}
          />
          <div className="relative h-full w-full p-0 sm:p-3">
            <div className="h-full w-full rounded-none sm:rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
                    {editando ? 'Editar post' : 'Novo post'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Editor completo de documentação
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editando && (
                    <button
                      type="button"
                      onClick={excluirPostEmEdicao}
                      className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Apagar
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                    onClick={() => setModalAberto(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Categoria
                    </label>
                    <input
                      value={form.categoria}
                      onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                      placeholder="Ex.: Processos, TI, RH..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Título
                    </label>
                    <input
                      value={form.titulo}
                      onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                      placeholder="Ex.: Procedimento de recebimento"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Descrição (curta)
                  </label>
                  <input
                    value={form.descricao}
                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    placeholder="Uma frase para contextualizar o post"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Conteúdo
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => aplicarWrap('**')}
                      className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      title="Negrito"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarWrap('*')}
                      className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      title="Itálico"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarWrap('<u>', '</u>')}
                      className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      title="Sublinhado"
                    >
                      U
                    </button>
                    <span className="h-5 w-px bg-slate-200" />
                    <button
                      type="button"
                      onClick={() => inserirLinha('---')}
                      className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      title="Divisor"
                    >
                      Divisor
                    </button>
                    <button
                      type="button"
                      onClick={() => inserirLinha('- item')}
                      className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      title="Lista"
                    >
                      Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => inserirLinha('![Legenda](https://)')}
                      className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      title="Imagem (Markdown)"
                    >
                      Imagem
                    </button>
                    <button
                      type="button"
                      onClick={() => inserirLinha('<table style="border-collapse: collapse; width: 100%;"><tr><th style="background:#0f766e;color:#fff;padding:8px;border:1px solid #ccc;">Coluna</th><th style="background:#134e4a;color:#fff;padding:8px;border:1px solid #ccc;">Valor</th></tr><tr><td style="padding:8px;border:1px solid #ccc;">Exemplo</td><td style="padding:8px;border:1px solid #ccc;">123</td></tr></table>')}
                      className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      title="Tabela colorida (HTML)"
                    >
                      Tabela colorida
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarPreview((v) => !v)}
                      className="inline-flex items-center rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      title="Alternar preview"
                    >
                      {mostrarPreview ? 'Ocultar preview' : 'Mostrar preview'}
                    </button>
                  </div>
                  <div className={`grid gap-3 ${mostrarPreview ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                    <textarea
                      ref={textareaRef}
                      value={form.conteudo}
                      onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                      rows={22}
                      className="w-full min-h-[50vh] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed"
                      placeholder="Escreva aqui usando Markdown. Ex.: **negrito**, *itálico*, <u>sublinhado</u>, listas, e --- para divisor."
                    />
                    {mostrarPreview && (
                      <div className="min-h-[50vh] rounded-lg border border-slate-200 bg-slate-50 p-3 overflow-auto">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Preview do post
                        </p>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[[rehypeRaw], [rehypeSanitize, schemaPreview]]}
                          components={{
                            p: (props) => <p {...props} className="mt-2 first:mt-0 text-sm text-slate-800 leading-relaxed" />,
                            h1: (props) => <h1 {...props} className="text-xl font-extrabold mt-3 first:mt-0 text-slate-900" />,
                            h2: (props) => <h2 {...props} className="text-lg font-bold mt-3 first:mt-0 text-slate-900" />,
                            h3: (props) => <h3 {...props} className="text-base font-bold mt-3 first:mt-0 text-slate-900" />,
                            ul: (props) => <ul {...props} className="list-disc pl-5 mt-2 space-y-1" />,
                            ol: (props) => <ol {...props} className="list-decimal pl-5 mt-2 space-y-1" />,
                            table: (props) => (
                              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                <table {...props} className="min-w-full text-xs" />
                              </div>
                            ),
                            th: (props) => <th {...props} className="px-2 py-1.5 border-b border-slate-200 text-left font-semibold" />,
                            td: (props) => <td {...props} className="px-2 py-1.5 border-b border-slate-100 align-top" />,
                            pre: (props) => <pre {...props} className="mt-3 rounded-lg bg-slate-900 text-slate-100 p-3 overflow-x-auto text-xs" />,
                          }}
                        >
                          {form.conteudo || '_Escreva o conteúdo para visualizar o preview._'}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Dica: você pode usar Markdown (títulos, listas, links). O sistema também aceita <code>&lt;u&gt;</code> para sublinhado.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Ativo (visível para os usuários)
                </label>
              </div>
              <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  {form.conteudo?.length || 0} caracteres
                </span>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  disabled={salvando}
                  onClick={salvar}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {salvando ? 'Publicando...' : editando ? 'Salvar alterações' : 'Publicar post'}
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

