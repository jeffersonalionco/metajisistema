import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { Receitas } from './pages/Receitas';
import { Usuarios } from './pages/Usuarios';
import { Empresa } from './pages/Empresa';
import { FichaCadastral } from './pages/FichaCadastral';
import { Relatorios } from './pages/Relatorios';
import { RelatorioValidades } from './pages/RelatorioValidades';
import { ResumoMensalDetalhe } from './pages/ResumoMensalDetalhe';
import { Documentacao } from './pages/Documentacao';
import { DocumentacaoDetalhe } from './pages/DocumentacaoDetalhe';

function RotasProtegidas({ children }) {
  const { isAuthenticated, carregando } = useAuth();
  const location = useLocation();
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function RotaPermissao({ allow, children, fallback = '/documentacao' }) {
  if (!allow) return <Navigate to={fallback} replace />;
  return children;
}

export default function App() {
  const { canManageUsuarios, canEmpresa, canRelatoriosMensal, canRelatorioValidade, canReceitas } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route
        path="/"
        element={
          <RotasProtegidas>
            <RotaPermissao allow={canReceitas}>
              <Receitas />
            </RotaPermissao>
          </RotasProtegidas>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RotasProtegidas>
            <RotaPermissao allow={canManageUsuarios}>
              <Usuarios />
            </RotaPermissao>
          </RotasProtegidas>
        }
      />
      <Route
        path="/empresa"
        element={
          <RotasProtegidas>
            <RotaPermissao allow={canEmpresa}>
              <Empresa />
            </RotaPermissao>
          </RotasProtegidas>
        }
      />
      <Route
        path="/relatorios"
        element={
          <RotasProtegidas>
            <RotaPermissao allow={canRelatoriosMensal}>
              <Relatorios />
            </RotaPermissao>
          </RotasProtegidas>
        }
      />
      <Route
        path="/relatorios/validade"
        element={
          <RotasProtegidas>
            <RotaPermissao allow={canRelatorioValidade}>
              <RelatorioValidades />
            </RotaPermissao>
          </RotasProtegidas>
        }
      />
      <Route
        path="/documentacao"
        element={
          <RotasProtegidas>
            <Documentacao />
          </RotasProtegidas>
        }
      />
      <Route
        path="/documentacao/:id"
        element={
          <RotasProtegidas>
            <DocumentacaoDetalhe />
          </RotasProtegidas>
        }
      />
      <Route
        path="/resumo-mensal/:id"
        element={<ResumoMensalDetalhe />}
      />
      <Route
        path="/ficha/:codigo"
        element={
          <RotasProtegidas>
            <FichaCadastral />
          </RotasProtegidas>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
