import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmpresa } from '../services/api';

export function AppLayout({ children }) {
  const { usuario, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [empresa, setEmpresa] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);

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
  }, [location.pathname]);

  const linkAtivo = (path) => location.pathname === path;

  const navLinks = (
    <>
      <Link
        to="/"
        className={`block py-3 px-4 rounded-lg font-medium transition-colors md:py-2 md:px-0 md:inline-block md:rounded-none ${linkAtivo('/') ? 'bg-emerald-600/20 text-white md:bg-transparent md:text-white md:underline' : 'text-emerald-100 hover:bg-white/10 md:hover:bg-transparent md:hover:underline'}`}
      >
        Receitas
      </Link>
      {isAdmin && (
        <>
          <Link
            to="/empresa"
            className={`block py-3 px-4 rounded-lg font-medium transition-colors md:py-2 md:px-0 md:inline-block md:rounded-none ${linkAtivo('/empresa') ? 'bg-emerald-600/20 text-white md:bg-transparent md:text-white md:underline' : 'text-emerald-100 hover:bg-white/10 md:hover:bg-transparent md:hover:underline'}`}
          >
            Empresa
          </Link>
          <Link
            to="/usuarios"
            className={`block py-3 px-4 rounded-lg font-medium transition-colors md:py-2 md:px-0 md:inline-block md:rounded-none ${linkAtivo('/usuarios') ? 'bg-emerald-600/20 text-white md:bg-transparent md:text-white md:underline' : 'text-emerald-100 hover:bg-white/10 md:hover:bg-transparent md:hover:underline'}`}
          >
            Usuários
          </Link>
          <Link
            to="/relatorios"
            className={`block py-3 px-4 rounded-lg font-medium transition-colors md:py-2 md:px-0 md:inline-block md:rounded-none ${linkAtivo('/relatorios') ? 'bg-emerald-600/20 text-white md:bg-transparent md:text-white md:underline' : 'text-emerald-100 hover:bg-white/10 md:hover:bg-transparent md:hover:underline'}`}
          >
            Resumo mensal
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {(empresa?.logo_base64 || empresa?.nome_fantasia) && (
                <div className="flex items-center gap-2 shrink-0">
                  {empresa.logo_base64 && (
                    <img src={empresa.logo_base64} alt="" className="h-7 sm:h-8 w-auto object-contain max-w-[100px] sm:max-w-[120px]" />
                  )}
                  {empresa.nome_fantasia && (
                    <span className="text-xs sm:text-sm font-medium text-emerald-100 truncate hidden sm:inline max-w-[120px] sm:max-w-none">
                      {empresa.nome_fantasia}
                    </span>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setMenuAberto((v) => !v)}
                className="md:hidden p-2 -ml-1 rounded-lg text-emerald-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
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
              <nav className="hidden md:flex items-center gap-4 flex-1">
                {navLinks}
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-xs sm:text-sm text-emerald-100 truncate max-w-[100px] sm:max-w-[180px]" title={usuario?.nome || usuario?.email}>
                {usuario?.nome || usuario?.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-900 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px] md:min-h-0"
              >
                Sair
              </button>
            </div>
          </div>
          {menuAberto && (
            <nav className="md:hidden mt-2 pb-2 border-t border-emerald-600/50 pt-2">
              {navLinks}
            </nav>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8 flex-1">
        {children}
      </main>
    </div>
  );
}
