import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./index.css";

export default function Header() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/funcionarios", label: "Funcionários" },
    { to: "/escalas", label: "Escalas" },
    { to: "/ocorrencias", label: "Ocorrências" },
    { to: "/relatorios", label: "Relatórios" },
    { to: "/locais", label: "Locais" },
  ];

  return (
    <header className="header">
      <div className="header-main">
        <div className="header-brand">
          <div className="header-brand-info">
            <span className="header-eyebrow">ESCOLA ESTADUAL</span>
            <h1>Eusébio de Paula Marcondes, Prof.</h1>
            <p>Sistema de Gestão de Escalas Escolares</p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-user">
            <span className="header-user-label">Usuário conectado</span>
            <strong>{usuario?.nome || "Usuário"}</strong>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
          >
            Sair
          </button>

          <img className="header-logo" src="/logo.png" alt="Logo da escola" />
        </div>
      </div>

      <nav className="header-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `header-link ${isActive ? "active" : ""}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
