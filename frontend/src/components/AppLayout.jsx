import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmpresa } from '../services/api';

export function AppLayout({ children }) {
  const {
    usuario,
    logout,
    canEmpresa,
    canManageUsuarios,
    canRelatoriosMensal,
    canRelatorioValidade,
    canReceitas,
  } = useAuth();
  const location = useLocation();
  const [empresa, setEmpresa] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [submenuRelatoriosAberto, setSubmenuRelatoriosAberto] = useState(false);
  const submenuRef = useRef(null);

  useEffect(() => {
    // Só busca dados da empresa quando há usuário logado.
    // Isso evita 401 e redirecionamento para login em páginas públicas (ex.: links de resumo mensal).
    if (!usuario) {
      setEmpresa(null);
      return;
    }
    getEmpresa()
      .then(setEmpresa)
      .catch(() => setEmpresa(null));
  }, [usuario]);

  useEffect(() => {
    setMenuAberto(false);
    setSubmenuRelatoriosAberto(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setMenuAberto(false);
        setSubmenuRelatoriosAberto(false);
      }
    }
    function onMouseDown(e) {
      if (!submenuRef.current) return;
      if (submenuRef.current.contains(e.target)) return;
      setSubmenuRelatoriosAberto(false);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const linkAtivo = (path) => location.pathname === path;
  const rotaComecaCom = (prefixo) => location.pathname.startsWith(prefixo);

  const desktopLink = (ativo) =>
    `inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      ativo ? 'bg-white/15 text-white' : 'text-emerald-50/90 hover:bg-white/10 hover:text-white'
    }`;

  const mobileLink = (ativo) =>
    `flex items-center justify-between w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
      ativo ? 'bg-emerald-600/25 text-white' : 'text-emerald-50/90 hover:bg-white/10'
    }`;

  const desktopNavLinks = (
    <>
      {canReceitas && (
        <Link to="/" className={desktopLink(linkAtivo('/'))}>
          Receitas
        </Link>
      )}
      <Link to="/documentacao" className={desktopLink(linkAtivo('/documentacao'))}>
        Documentação
      </Link>
      {(canEmpresa || canManageUsuarios || canRelatoriosMensal || canRelatorioValidade) && (
        <>
          {canEmpresa && (
            <Link to="/empresa" className={desktopLink(linkAtivo('/empresa'))}>
              Empresa
            </Link>
          )}
          {canManageUsuarios && (
            <Link to="/usuarios" className={desktopLink(linkAtivo('/usuarios'))}>
              Usuários
            </Link>
          )}
          {/* Relatórios - submenu */}
          {(canRelatoriosMensal || canRelatorioValidade) && (
            <div ref={submenuRef} className="hidden md:inline-block relative">
              <button
                type="button"
                onClick={() => setSubmenuRelatoriosAberto((v) => !v)}
                className={`${desktopLink(rotaComecaCom('/relatorios'))} pr-2`}
                aria-haspopup="menu"
                aria-expanded={submenuRelatoriosAberto}
              >
                <span>Relatórios</span>
                <svg
                  className={`h-4 w-4 transition-transform ${submenuRelatoriosAberto ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {submenuRelatoriosAberto && (
                <div className="absolute left-0 mt-2 w-60 rounded-xl bg-white text-slate-800 shadow-xl ring-1 ring-black/5 z-50 overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Relatórios
                    </p>
                  </div>
                  {canRelatoriosMensal && (
                    <Link
                      to="/relatorios"
                      className={`flex items-center justify-between px-3 py-2.5 text-sm hover:bg-emerald-50 ${
                        linkAtivo('/relatorios') ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''
                      }`}
                    >
                      <span>Resumo mensal</span>
                      <span className="text-[11px] text-slate-400">Excel + IA</span>
                    </Link>
                  )}
                  {canRelatorioValidade && (
                    <Link
                      to="/relatorios/validade"
                      className={`flex items-center justify-between px-3 py-2.5 text-sm hover:bg-emerald-50 ${
                        linkAtivo('/relatorios/validade') ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''
                      }`}
                    >
                      <span>Validades</span>
                      <span className="text-[11px] text-slate-400">ERP</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );

  const mobileNavLinks = (
    <>
      {canReceitas && (
        <Link to="/" className={mobileLink(linkAtivo('/'))}>
          <span>Receitas</span>
          <span className="text-[11px] font-semibold text-emerald-100/90">Ver</span>
        </Link>
      )}
      <Link to="/documentacao" className={mobileLink(linkAtivo('/documentacao'))}>
        <span>Documentação</span>
        <span className="text-[11px] font-semibold text-emerald-100/90">Posts</span>
      </Link>
      {(canEmpresa || canManageUsuarios || canRelatoriosMensal || canRelatorioValidade) && (
        <>
          {canEmpresa && (
            <Link to="/empresa" className={mobileLink(linkAtivo('/empresa'))}>
              <span>Empresa</span>
              <span className="text-[11px] font-semibold text-emerald-100/90">Dados</span>
            </Link>
          )}
          {canManageUsuarios && (
            <Link to="/usuarios" className={mobileLink(linkAtivo('/usuarios'))}>
              <span>Usuários</span>
              <span className="text-[11px] font-semibold text-emerald-100/90">Admin</span>
            </Link>
          )}
          {canRelatoriosMensal && (
            <Link to="/relatorios" className={mobileLink(linkAtivo('/relatorios'))}>
              <span>Relatórios</span>
              <span className="text-[11px] font-semibold text-emerald-100/90">Resumo mensal</span>
            </Link>
          )}
          {canRelatorioValidade && (
            <Link to="/relatorios/validade" className={mobileLink(linkAtivo('/relatorios/validade'))}>
              <span>Relatórios</span>
              <span className="text-[11px] font-semibold text-emerald-100/90">Validades</span>
            </Link>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {(empresa?.logo_base64 || empresa?.nome_fantasia) && (
                <div className="flex items-center gap-2 shrink-0">
                  {empresa.logo_base64 && (
                    <img
                      src={empresa.logo_base64}
                      alt=""
                      className="h-7 sm:h-8 w-auto object-contain max-w-[110px] sm:max-w-[140px] drop-shadow-sm"
                    />
                  )}
                  {empresa.nome_fantasia && (
                    <span className="text-xs sm:text-sm font-semibold text-emerald-100 truncate hidden sm:inline max-w-[160px] sm:max-w-none">
                      {empresa.nome_fantasia}
                    </span>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setMenuAberto((v) => !v)}
                className="md:hidden p-2 -ml-1 rounded-xl text-emerald-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={menuAberto}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  {menuAberto ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <nav className="hidden md:flex items-center gap-1 flex-1">
                {desktopNavLinks}
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span
                className="text-xs sm:text-sm text-emerald-100 truncate max-w-[120px] sm:max-w-[220px] font-medium"
                title={usuario?.nome || usuario?.email}
              >
                {usuario?.nome || usuario?.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-xs sm:text-sm px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px] md:min-h-0"
              >
                Sair
              </button>
            </div>
          </div>
          {/* Mobile drawer */}
          {menuAberto && (
            <div className="md:hidden">
              <button
                type="button"
                className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
                aria-label="Fechar menu"
                onClick={() => setMenuAberto(false)}
              />
              <nav className="fixed left-0 top-0 h-full w-[86%] max-w-[360px] bg-emerald-900 text-white z-50 shadow-2xl p-3 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-emerald-200/80 font-semibold">
                      Metaji Sistemas
                    </p>
                    <p className="text-sm font-semibold truncate text-white/95">
                      {empresa?.nome_fantasia || 'Menu'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMenuAberto(false)}
                    className="p-2 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Fechar menu"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-1">
                  {mobileNavLinks}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 text-sm font-semibold"
                  >
                    Sair
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8 flex-1">
        {children}
      </main>
    </div>
  );
}
