import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import "./index.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const { login, carregando } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    const emailFormatado = email.trim().toLowerCase();

    if (!emailFormatado) {
      toast.error("Informe seu e-mail.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFormatado)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    try {
      await login(emailFormatado);
      toast.success("Acesso autorizado!");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error.message || "Não foi possível realizar o acesso.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <img
            src="/logo.png"
            alt="Logo da escola"
            className="login-logo"
          />

          <h1>Bem-vindo(a)!</h1>
          <p>Entre com seu e-mail institucional</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">E-mail</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <button type="submit" disabled={carregando}>
            {carregando ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <span className="login-footer">
          Escola Estadual Eusébio de Paula Marcondes
        </span>
      </section>
    </main>
  );
}
