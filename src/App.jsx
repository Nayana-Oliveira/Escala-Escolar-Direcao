import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Funcionarios from "./pages/Funcionarios";
import Escalas from "./pages/Escalas";
import Ocorrencias from "./pages/Ocorrencias";
import Relatorios from "./pages/Relatorios";
import Locais from "./pages/Locais";
import Login from "./pages/Login";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function Rotas() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={usuario ? <Navigate to="/" replace /> : <Login />}
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/*"
          element={
            <>
              <Header />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/funcionarios" element={<Funcionarios />} />
                <Route path="/escalas" element={<Escalas />} />
                <Route path="/ocorrencias" element={<Ocorrencias />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/locais" element={<Locais />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#252525",
              color: "#fff",
              borderRadius: "10px",
              padding: "14px 18px",
              fontSize: "14px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#b91c1c",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
            loading: {
              duration: Infinity,
            },
          }}
        />
        <Rotas />
      </AuthProvider>
    </BrowserRouter>
  );
}
