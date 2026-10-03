import { createContext, useContext, useState } from "react";
import { fazerLogin } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function login(email) {
    setCarregando(true);

    try {
      const resultado = await fazerLogin(email);
      setUsuario(resultado.dados);
      return resultado;
    } finally {
      setCarregando(false);
    }
  }

  function logout() {
    setUsuario(null);
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
