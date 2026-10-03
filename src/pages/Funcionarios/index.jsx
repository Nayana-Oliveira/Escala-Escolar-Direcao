import { useEffect, useState } from "react";
import {
  getFuncionarios,
  cadastrarFuncionario,
  atualizarFuncionario,
  excluirFuncionario,
} from "../../services/api";
import toast from "react-hot-toast";
import "./index.css";

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [funcionarioEditando, setFuncionarioEditando] = useState(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [form, setForm] = useState({
    nome: "",
    ativo: true,
  });

  const funcionariosFiltrados = funcionarios.filter((funcionario) => {
    const correspondeNome = (funcionario.nome || "")
      .toLowerCase()
      .includes(busca.trim().toLowerCase());

    const correspondeStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "ativos" && funcionario.ativo) ||
      (filtroStatus === "inativos" && !funcionario.ativo);

    return correspondeNome && correspondeStatus;
  });

  async function carregarFuncionarios() {
    try {
      setCarregando(true);

      const dados = await getFuncionarios();
      setFuncionarios(dados);
    } catch (error) {
      toast.error(error.message || "Erro ao carregar funcionários.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  function abrirCadastro() {
    setFuncionarioEditando(null);

    setForm({
      nome: "",
      ativo: true,
    });

    setModalAberto(true);
  }

  function abrirEdicao(funcionario) {
    setFuncionarioEditando(funcionario);

    setForm({
      nome: funcionario.nome || "",
      ativo: funcionario.ativo,
    });

    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setFuncionarioEditando(null);

    setForm({
      nome: "",
      ativo: true,
    });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSave(e) {
    e.preventDefault();

    const nome = form.nome.trim();

    if (!nome) {
      toast.error("Informe o nome do funcionário.");
      return;
    }

    const toastId = toast.loading("Salvando funcionário...");

    try {
      setSalvando(true);

      const dados = {
        nome,
        ativo: form.ativo,
      };

      if (funcionarioEditando) {
        await atualizarFuncionario(funcionarioEditando.id, dados);

        toast.success("Funcionário atualizado com sucesso.", {
          id: toastId,
        });
      } else {
        await cadastrarFuncionario(dados);

        toast.success("Funcionário cadastrado com sucesso.", {
          id: toastId,
        });
      }

      setModalAberto(false);
      setFuncionarioEditando(null);

      setForm({
        nome: "",
        ativo: true,
      });

      await carregarFuncionarios();
    } catch (error) {
      toast.error(error.message || "Erro ao salvar funcionário.", {
        id: toastId,
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(funcionario) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o funcionário ${funcionario.nome}?`,
    );

    if (!confirmar) return;

    const toastId = toast.loading("Excluindo funcionário...");

    try {
      setExcluindoId(funcionario.id);

      await excluirFuncionario(funcionario.id);

      setFuncionarios((prev) =>
        prev.filter((item) => item.id !== funcionario.id),
      );

      toast.success("Funcionário excluído com sucesso.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(error.message || "Erro ao excluir funcionário.", {
        id: toastId,
      });
    } finally {
      setExcluindoId(null);
    }
  }

  function formatarData(data) {
    if (!data) return "—";

    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <main className="funcionarios-page">
      <div className="funcionarios-header">
        <div>
          <h1>Funcionários</h1>
          <p>Gerencie os funcionários cadastrados no sistema.</p>
        </div>

        <button type="button" className="btn-primary" onClick={abrirCadastro}>
          Novo funcionário
        </button>
      </div>

      <section className="funcionarios-table-container">
        <div className="funcionarios-card-header">
          <div>
            <h2>Lista de funcionários</h2>
            <span>{funcionariosFiltrados.length} resultado(s)</span>
          </div>

          <div className="funcionarios-filtros">
            <div className="campo-busca">
              <input
                type="search"
                placeholder="Buscar funcionário..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar funcionário pelo nome"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              aria-label="Filtrar por status"
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </div>

        {carregando ? (
          <p className="loading-message">Carregando funcionários...</p>
        ) : funcionariosFiltrados.length === 0 ? (
          <p className="empty-message">
            {funcionarios.length === 0
              ? "Nenhum funcionário cadastrado."
              : "Nenhum funcionário encontrado com esses filtros."}
          </p>
        ) : (
          <div className="tabela-container">
            <table className="funcionarios-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Data de cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {funcionariosFiltrados.map((funcionario) => (
                  <tr key={funcionario.id}>
                    <td>{funcionario.nome}</td>

                    <td>
                      <span
                        className={`status ${
                          funcionario.ativo ? "ativo" : "inativo"
                        }`}
                      >
                        {funcionario.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td>{formatarData(funcionario.created_at)}</td>

                    <td>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => abrirEdicao(funcionario)}
                        disabled={excluindoId === funcionario.id}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn-excluir"
                        onClick={() => handleDelete(funcionario)}
                        disabled={excluindoId === funcionario.id}
                      >
                        {excluindoId === funcionario.id
                          ? "Excluindo..."
                          : "Excluir"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAberto && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              fecharModal();
            }
          }}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h2 id="modal-title">
                {funcionarioEditando
                  ? "Editar funcionário"
                  : "Novo funcionário"}
              </h2>

              <button
                type="button"
                className="modal-close"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="nome">Nome do funcionário</label>

                <input
                  id="nome"
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Digite o nome"
                  required
                  autoFocus
                />
              </div>

              <div className="form-checkbox">
                <input
                  id="ativo"
                  type="checkbox"
                  name="ativo"
                  checked={form.ativo}
                  onChange={handleChange}
                />

                <label htmlFor="ativo">Funcionário ativo</label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : funcionarioEditando
                      ? "Salvar alterações"
                      : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
