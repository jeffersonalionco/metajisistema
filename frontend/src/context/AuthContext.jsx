import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, registro as apiRegistro, getMe } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'receitas_token';
const USER_KEY = 'receitas_user';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setTokenState] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      setTokenState(newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setTokenState(null);
      setUsuario(null);
    }
  }, []);

  const login = useCallback(async (email, senha) => {
    const { token: t, usuario: u } = await apiLogin(email, senha);
    setToken(t);
    setUsuario(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return u;
  }, [setToken]);

  const registro = useCallback(async (nome, email, senha) => {
    const { token: t, usuario: u } = await apiRegistro(nome, email, senha);
    setToken(t);
    setUsuario(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return u;
  }, [setToken]);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      setTokenState(savedToken);
      try {
        setUsuario(JSON.parse(savedUser));
      } catch {
        setUsuario(null);
      }
      getMe()
        .then((res) => {
          if (res?.usuario) {
            setUsuario(res.usuario);
            localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
          }
        })
        .catch(() => setToken(null))
        .finally(() => setCarregando(false));
    } else {
      setCarregando(false);
    }
  }, []);

  const value = {
    usuario,
    token,
    carregando,
    login,
    registro,
    logout,
    isAuthenticated: !!token,
    isAdmin: !!usuario?.admin,
    canEditDocumentacao: !!usuario?.admin || !!usuario?.pode_documentacao,
    canManageUsuarios: !!usuario?.admin || !!usuario?.pode_usuarios,
    canRelatoriosMensal: !!usuario?.admin || !!usuario?.pode_relatorios_mensal,
    canRelatorioValidade: !!usuario?.admin || !!usuario?.pode_relatorio_validade,
    canEmpresa: !!usuario?.admin || !!usuario?.pode_empresa,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
