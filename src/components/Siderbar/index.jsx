import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import "./index.css";

const menuItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Escalas", path: "/escalas", icon: CalendarDays },
  { label: "Ocorrências", path: "/ocorrencias", icon: ClipboardList },
  { label: "Funcionários", path: "/funcionarios", icon: Users },
  { label: "Relatórios", path: "/relatorios", icon: FileSpreadsheet },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Logo da escola" />
        <div>
          <strong>Escala Escolar</strong>
          <span>Direção</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-label">MENU PRINCIPAL</span>

        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">E.E. Eusébio de Paula Marcondes</div>
    </aside>
  );
}

export default Sidebar;
