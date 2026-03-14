import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { Receitas } from './pages/Receitas';
import { Usuarios } from './pages/Usuarios';
import { Empresa } from './pages/Empresa';
import { FichaCadastral } from './pages/FichaCadastral';

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

function RotaAdmin({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route
        path="/"
        element={
          <RotasProtegidas>
            <Receitas />
          </RotasProtegidas>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RotasProtegidas>
            <RotaAdmin>
              <Usuarios />
            </RotaAdmin>
          </RotasProtegidas>
        }
      />
      <Route
        path="/empresa"
        element={
          <RotasProtegidas>
            <RotaAdmin>
              <Empresa />
            </RotaAdmin>
          </RotasProtegidas>
        }
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
