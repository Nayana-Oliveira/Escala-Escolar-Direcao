import { Outlet } from "react-router-dom";
import Header from "../Header";
import "./index.css";

function Layout() {
  return (
    <div className="admin-layout">
      <Header />

      <main className="admin-content">
        <Outlet />
      </main>

      <footer className="admin-footer">
        Escola Estadual Eusébio de Paula Marcondes
      </footer>
    </div>
  );
}

export default Layout;
