import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { obterPostDocumentacao } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

const schemaSanitizado = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'div',
    'span',
    'u',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    'code',
    'blockquote',
  ],
  attributes: {
    ...(defaultSchema.attributes || {}),
    div: [...((defaultSchema.attributes || {}).div || []), 'style', 'className'],
    span: [...((defaultSchema.attributes || {}).span || []), 'style', 'className'],
    h1: [...((defaultSchema.attributes || {}).h1 || []), 'style', 'className'],
    h2: [...((defaultSchema.attributes || {}).h2 || []), 'style', 'className'],
    h3: [...((defaultSchema.attributes || {}).h3 || []), 'style', 'className'],
    p: [...((defaultSchema.attributes || {}).p || []), 'style', 'className'],
    blockquote: [...((defaultSchema.attributes || {}).blockquote || []), 'style', 'className'],
    hr: [...((defaultSchema.attributes || {}).hr || []), 'style', 'className'],
    ul: [...((defaultSchema.attributes || {}).ul || []), 'style', 'className'],
    ol: [...((defaultSchema.attributes || {}).ol || []), 'style', 'className'],
    li: [...((defaultSchema.attributes || {}).li || []), 'style', 'className'],
    pre: [...((defaultSchema.attributes || {}).pre || []), 'style', 'className'],
    a: [...((defaultSchema.attributes || {}).a || []), 'href', 'title', 'target', 'rel', 'style', 'className'],
    code: [...((defaultSchema.attributes || {}).code || []), 'className'],
    table: [...((defaultSchema.attributes || {}).table || []), 'style', 'className', 'bgcolor'],
    thead: [...((defaultSchema.attributes || {}).thead || []), 'style', 'className', 'bgcolor'],
    tbody: [...((defaultSchema.attributes || {}).tbody || []), 'style', 'className', 'bgcolor'],
    tr: [...((defaultSchema.attributes || {}).tr || []), 'style', 'className', 'bgcolor'],
    th: [...((defaultSchema.attributes || {}).th || []), 'align', 'style', 'className', 'bgcolor'],
    td: [...((defaultSchema.attributes || {}).td || []), 'align', 'style', 'className', 'bgcolor'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
};

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

function normalizarConteudoParaRender(conteudo) {
  const texto = String(conteudo || '').trim();
  if (!texto) return '';
  let saida = texto;

  // Remove blocos ```html ... ``` em qualquer posição.
  saida = saida.replace(/```html\s*([\s\S]*?)```/gi, (_, inner) => inner.trim());

  // Se houver bloco ``` ... ``` sem linguagem, renderiza como HTML apenas
  // quando o conteúdo tiver claramente marcação HTML.
  saida = saida.replace(/```\s*([\s\S]*?)```/g, (full, inner) => {
    const trecho = String(inner || '').trim();
    const pareceHtml = /^<\/?[a-z][\s\S]*>/i.test(trecho) || /<table[\s\S]*>/i.test(trecho);
    return pareceHtml ? trecho : full;
  });

  return saida;
}

export function DocumentacaoDetalhe() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [post, setPost] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const conteudoRender = normalizarConteudoParaRender(post?.conteudo);

  useEffect(() => {
    setCarregando(true);
    setErro('');
    obterPostDocumentacao(id)
      .then(setPost)
      .catch((err) => setErro(err.response?.data?.erro || 'Erro ao carregar post.'))
      .finally(() => setCarregando(false));
  }, [id]);

  return (
    <AppLayout>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to="/documentacao"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Voltar
          </Link>
          {post?.categoria && (
            <span className="text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
              {post.categoria}
            </span>
          )}
          {post && post.ativo === false && (
            <span className="text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Inativo
            </span>
          )}
        </div>
        {isAdmin && post && (
          <span className="text-[11px] sm:text-xs text-slate-500">
            ID: <span className="font-semibold">{post.id}</span>
          </span>
        )}
      </div>

      {carregando ? (
        <div className="flex justify-center py-12">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : erro ? (
        <div className="max-w-3xl mx-auto">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {erro}
          </div>
        </div>
      ) : (
        <article className="max-w-3xl mx-auto">
          <header className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 break-words">
              {post.titulo}
            </h1>
            {post.descricao && (
              <p className="mt-2 text-sm sm:text-base text-slate-600 break-words">
                {post.descricao}
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-slate-500">
              <p>
                Por <span className="font-semibold text-slate-700">{post.autor_nome}</span>
              </p>
              <p>
                Publicado em <span className="font-semibold text-slate-700">{formatarData(post.criado_em)}</span>
              </p>
            </div>
          </header>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
            <div className="max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeRaw], [rehypeSanitize, schemaSanitizado]]}
                components={{
                  h1: (props) => (
                    <h1 {...props} className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-5 first:mt-0" />
                  ),
                  h2: (props) => (
                    <h2 {...props} className="text-lg sm:text-xl font-bold text-slate-900 mt-5 first:mt-0" />
                  ),
                  h3: (props) => (
                    <h3 {...props} className="text-base sm:text-lg font-bold text-slate-900 mt-4 first:mt-0" />
                  ),
                  p: (props) => (
                    <p {...props} className="text-sm sm:text-base text-slate-800 leading-relaxed mt-3 first:mt-0" />
                  ),
                  ul: (props) => <ul {...props} className="mt-3 pl-5 list-disc space-y-1" />,
                  ol: (props) => <ol {...props} className="mt-3 pl-5 list-decimal space-y-1" />,
                  li: (props) => <li {...props} className="text-sm sm:text-base text-slate-800" />,
                  blockquote: (props) => (
                    <blockquote
                      {...props}
                      className="mt-4 border-l-4 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-slate-700 rounded-r-lg"
                    />
                  ),
                  hr: (props) => <hr {...props} className="my-4 border-slate-200" />,
                  table: (props) => (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                      <table {...props} className="min-w-full text-sm" />
                    </div>
                  ),
                  thead: (props) => <thead {...props} className="bg-slate-50" />,
                  th: (props) => (
                    <th {...props} className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-200" />
                  ),
                  td: (props) => (
                    <td {...props} className="px-3 py-2 text-sm text-slate-800 border-b border-slate-100 align-top" />
                  ),
                  pre: (props) => (
                    <pre
                      {...props}
                      className="mt-4 overflow-x-auto rounded-xl bg-slate-900 text-slate-50 p-4 text-xs sm:text-sm"
                    />
                  ),
                  code: ({ className, children, ...props }) => {
                    const isBlock = typeof className === 'string' && className.includes('language-');
                    if (isBlock) {
                      return (
                        <code {...props} className={className}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code
                        {...props}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] sm:text-sm text-slate-800"
                      >
                        {children}
                      </code>
                    );
                  },
                  a: (props) => (
                    <a
                      {...props}
                      className="text-emerald-700 font-semibold hover:text-emerald-800 underline underline-offset-2 break-words"
                      target="_blank"
                      rel="noreferrer"
                    />
                  ),
                  strong: (props) => <strong {...props} className="font-extrabold text-slate-900" />,
                  em: (props) => <em {...props} className="italic" />,
                  u: (props) => <u {...props} className="underline underline-offset-4" />,
                  img: ({ src, alt, title, ...props }) => {
                    const safeSrc = typeof src === 'string' ? src.trim() : '';
                    if (!safeSrc) {
                      return (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          Imagem sem URL. Use <code className="font-mono">![Legenda](https://...)</code>
                        </div>
                      );
                    }
                    return (
                      <figure className="mt-4">
                        <img
                          {...props}
                          src={safeSrc}
                          alt={alt || ''}
                          title={title}
                          loading="lazy"
                          className="max-w-full h-auto rounded-xl border border-slate-200 shadow-sm bg-white"
                        />
                        {(alt || title) && (
                          <figcaption className="mt-2 text-xs text-slate-500">
                            {alt || title}
                          </figcaption>
                        )}
                      </figure>
                    );
                  },
                }}
              >
                {conteudoRender || 'Sem conteúdo.'}
              </ReactMarkdown>
            </div>
          </section>
        </article>
      )}
    </AppLayout>
  );
}

