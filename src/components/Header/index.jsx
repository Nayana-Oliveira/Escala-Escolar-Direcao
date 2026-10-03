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
      <div className="header-top">
        <div className="header-brand">
          <img src="/logo.png" alt="Logo da escola" />

          <div className="header-brand-info">
            <strong>Escala Escolar</strong>
            <span>E. E. Eusébio de Paula Marcondes, Prof.</span>
            <span>Gestão de inspetores</span>
          </div>
        </div>

        <div className="header-user">
          <span>{usuario?.nome || "Usuário"}</span>

          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
          >
            Sair
          </button>
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
