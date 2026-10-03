import { createContext, useContext, useState } from "react";
import { fazerLogin } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const usuarioSalvo = localStorage.getItem("usuario");
      return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    } catch {
      localStorage.removeItem("usuario");
      return null;
    }
  });

  const [carregando, setCarregando] = useState(false);

  async function login(email) {
    setCarregando(true);

    try {
      const resultado = await fazerLogin(email);

      setUsuario(resultado.dados);
      localStorage.setItem("usuario", JSON.stringify(resultado.dados));

      return resultado;
    } finally {
      setCarregando(false);
    }
  }

  function logout() {
    setUsuario(null);
    localStorage.removeItem("usuario");
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
