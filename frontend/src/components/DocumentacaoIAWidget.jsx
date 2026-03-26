import { useEffect, useMemo, useState } from 'react';
import { conversarIADocumentacao, obterConfigIADocumentacao, salvarConfigIADocumentacao } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

function idMsg() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const schemaChat = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
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
    'hr',
  ],
  attributes: {
    ...(defaultSchema.attributes || {}),
    table: [...((defaultSchema.attributes || {}).table || []), 'style', 'className'],
    thead: [...((defaultSchema.attributes || {}).thead || []), 'style', 'className'],
    tbody: [...((defaultSchema.attributes || {}).tbody || []), 'style', 'className'],
    tr: [...((defaultSchema.attributes || {}).tr || []), 'style', 'className'],
    th: [...((defaultSchema.attributes || {}).th || []), 'style', 'className'],
    td: [...((defaultSchema.attributes || {}).td || []), 'style', 'className'],
    blockquote: [...((defaultSchema.attributes || {}).blockquote || []), 'style', 'className'],
    pre: [...((defaultSchema.attributes || {}).pre || []), 'style', 'className'],
    code: [...((defaultSchema.attributes || {}).code || []), 'style', 'className'],
  },
};

export function DocumentacaoIAWidget({ categorias = [] }) {
  const { isAdmin } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [carregandoConfig, setCarregandoConfig] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagens, setMensagens] = useState([
    {
      id: idMsg(),
      role: 'assistant',
      text: 'Oi! Sou a Metaji AI da Documentacao. Pergunte sobre processos, categorias e assuntos dos posts.',
    },
  ]);
  const [pergunta, setPergunta] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [config, setConfig] = useState({
    ativo: true,
    model: 'gemini-1.5-flash',
    prompt_base: '',
    max_posts_contexto: 8,
  });

  useEffect(() => {
    if (!aberto || !isAdmin) return;
    setCarregandoConfig(true);
    setErro('');
    obterConfigIADocumentacao()
      .then((data) => {
        setConfig({
          ativo: data.ativo !== false,
          model: data.model || 'gemini-1.5-flash',
          prompt_base: data.prompt_base || '',
          max_posts_contexto: Number(data.max_posts_contexto) || 8,
        });
      })
      .catch((err) => {
        setErro(err.response?.data?.erro || 'Erro ao carregar configuracoes da IA.');
      })
      .finally(() => setCarregandoConfig(false));
  }, [aberto, isAdmin]);

  const podeEnviar = useMemo(() => pergunta.trim().length >= 3 && !enviando, [pergunta, enviando]);

  async function enviarPergunta() {
    if (!podeEnviar) return;
    const textoPergunta = pergunta.trim();
    setPergunta('');
    setErro('');

    setMensagens((prev) => [...prev, { id: idMsg(), role: 'user', text: textoPergunta }]);
    setEnviando(true);
    try {
      const data = await conversarIADocumentacao({
        pergunta: textoPergunta,
        categoria: filtroCategoria || undefined,
        assunto: assunto || undefined,
      });
      const refs = (data.fontes || [])
        .slice(0, 5)
        .map((f) => `- **${f.categoria}**: ${f.titulo}`)
        .join('\n');
      const respostaFinal = refs ? `${data.resposta}\n\n### Base usada\n${refs}` : data.resposta;
      setMensagens((prev) => [...prev, { id: idMsg(), role: 'assistant', text: respostaFinal }]);
    } catch (err) {
      const msg = err.response?.data?.erro || 'Erro ao consultar a Metaji AI.';
      setErro(msg);
      setMensagens((prev) => [...prev, { id: idMsg(), role: 'assistant', text: `Falha: ${msg}` }]);
    } finally {
      setEnviando(false);
    }
  }

  async function salvarConfig() {
    setSalvandoConfig(true);
    setErro('');
    try {
      const data = await salvarConfigIADocumentacao(config);
      setConfig({
        ativo: data.ativo !== false,
        model: data.model || 'gemini-1.5-flash',
        prompt_base: data.prompt_base || '',
        max_posts_contexto: Number(data.max_posts_contexto) || 8,
      });
      setMostrarConfig(false);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar configuracoes.');
    } finally {
      setSalvandoConfig(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="fixed z-[70] bottom-5 right-5 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 px-4 py-3 text-sm font-bold"
      >
        {aberto ? 'Fechar IA' : 'Metaji AI'}
      </button>

      {aberto && (
        <div className="fixed z-[70] bottom-20 right-3 sm:right-5 w-[calc(100vw-1.5rem)] sm:w-[420px] max-h-[78vh] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Metaji AI - Posts</h3>
              <p className="text-[11px] text-slate-500">Busca inteligente por categoria e assunto</p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setMostrarConfig((v) => !v)}
                className="text-xs font-semibold rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-100"
              >
                {mostrarConfig ? 'Ocultar config' : 'Config IA'}
              </button>
            )}
          </div>

          {isAdmin && mostrarConfig && (
            <div className="px-3 py-3 border-b border-slate-200 bg-amber-50/40 space-y-2">
              {carregandoConfig ? (
                <p className="text-xs text-slate-600">Carregando configuracoes...</p>
              ) : (
                <>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={config.ativo}
                      onChange={(e) => setConfig((c) => ({ ...c, ativo: e.target.checked }))}
                    />
                    IA ativa para Documentacao
                  </label>
                  <input
                    value={config.model}
                    onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    placeholder="Modelo Gemini"
                  />
                  <input
                    type="number"
                    min={3}
                    max={20}
                    value={config.max_posts_contexto}
                    onChange={(e) => setConfig((c) => ({ ...c, max_posts_contexto: Number(e.target.value) || 8 }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    placeholder="Maximo de posts no contexto"
                  />
                  <textarea
                    rows={4}
                    value={config.prompt_base}
                    onChange={(e) => setConfig((c) => ({ ...c, prompt_base: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    placeholder="Prompt base da IA para respostas"
                  />
                  <button
                    type="button"
                    disabled={salvandoConfig}
                    onClick={salvarConfig}
                    className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {salvandoConfig ? 'Salvando...' : 'Salvar configuracao'}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="px-3 py-2 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
            >
              <option value="">Todas categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Assunto (opcional)"
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-slate-50 space-y-2">
            {mensagens.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white ml-8'
                    : 'bg-white border border-slate-200 text-slate-800 mr-4'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div className="prose prose-slate max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 prose-pre:my-2 prose-pre:text-[11px] prose-code:text-[11px]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[[rehypeRaw], [rehypeSanitize, schemaChat]]}
                      components={{
                        p: (props) => <p {...props} className="text-xs leading-relaxed text-slate-800" />,
                        h1: (props) => <h4 {...props} className="text-sm font-bold text-slate-900" />,
                        h2: (props) => <h4 {...props} className="text-sm font-bold text-slate-900" />,
                        h3: (props) => <h5 {...props} className="text-xs font-bold text-slate-900 uppercase tracking-wide" />,
                        ul: (props) => <ul {...props} className="list-disc pl-4 space-y-0.5" />,
                        ol: (props) => <ol {...props} className="list-decimal pl-4 space-y-0.5" />,
                        blockquote: (props) => (
                          <blockquote {...props} className="border-l-2 border-emerald-300 pl-2 text-slate-700 italic" />
                        ),
                        table: (props) => (
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table {...props} className="min-w-full text-[11px]" />
                          </div>
                        ),
                        th: (props) => <th {...props} className="px-2 py-1 border-b border-slate-200 text-left font-semibold" />,
                        td: (props) => <td {...props} className="px-2 py-1 border-b border-slate-100 align-top" />,
                        code: ({ inline, ...props }) =>
                          inline ? (
                            <code {...props} className="rounded bg-slate-100 px-1 py-0.5 text-[11px]" />
                          ) : (
                            <code {...props} className="text-[11px]" />
                          ),
                        pre: (props) => <pre {...props} className="rounded bg-slate-900 text-slate-100 p-2 overflow-x-auto" />,
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  m.text
                )}
              </div>
            ))}
            {enviando && <p className="text-xs text-slate-500">Metaji AI analisando posts...</p>}
          </div>

          {erro && <div className="px-3 py-2 text-xs text-red-700 bg-red-50 border-t border-red-100">{erro}</div>}

          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarPergunta();
                  }
                }}
                placeholder="Digite sua duvida sobre os posts..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              />
              <button
                type="button"
                disabled={!podeEnviar}
                onClick={enviarPergunta}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
